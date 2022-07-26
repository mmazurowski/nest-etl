import {
  CancellationReason,
  DynamoDBClient,
  QueryCommand,
  TransactionCanceledException,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';
import { Product } from '../domain/product.type';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Agent } from 'http';

type MostProfitableRecord = {
  id: string;
  total: number;
  name: string;
};

type MostBoughtRecords = {
  id: string;
  name: string;
  count: number;
};

@Injectable()
export class DynamodbProductRepository {
  private static TABLE_NAME = 'products';

  private readonly client = new DynamoDBClient({
    credentials: {
      secretAccessKey: 'dummy-data',
      accessKeyId: 'dummy-data',
    },
    endpoint: 'http://products-db:8000',
    requestHandler: new NodeHttpHandler({
      httpAgent: new Agent({
        keepAlive: true,
      }),
    }),
  });

  public async save(product: Product): Promise<void> {
    const command = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: DynamodbProductRepository.TABLE_NAME,
            Item: {
              PK: {
                S: `PRODUCT#${product.productId}`,
              },
              SK: { S: `ENTRY#${product.orderDate}` },
              entityType: { S: 'log' },
              productName: { S: product.productName },
              orderedAt: { S: product.orderDate },
              price: { N: product.price.toString() },
              quality: { N: product.quantity.toString() },
            },
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        {
          Update: {
            TableName: DynamodbProductRepository.TABLE_NAME,
            UpdateExpression:
              'ADD #counter :incr SET entityType = :type, productName = :pName, productId = :pId, GSI3PK = :GSI3PK',
            ExpressionAttributeNames: {
              '#counter': 'amountSold',
            },
            ExpressionAttributeValues: {
              ':incr': { N: '1' },
              ':type': { S: 'projection' },
              ':pName': { S: product.productName },
              ':pId': { S: product.productId },
              ':GSI3PK': {
                S: `TOTAL_COUNT_DATE#${product.orderDate.slice(0, 10)}`,
              },
            },
            Key: {
              PK: {
                S: `PRODUCT#${product.productId}`,
              },
              SK: {
                S: `#TOTAL_COUNT_DATE#${product.orderDate.slice(0, 10)}`,
              },
            },
          },
        },
        {
          Update: {
            TableName: DynamodbProductRepository.TABLE_NAME,
            UpdateExpression:
              'ADD #counter :incr SET entityType = :type, productName = :pName, productId = :pId, GSI1PK = :GSI1PK',
            ExpressionAttributeNames: {
              '#counter': 'amountSold',
            },
            ExpressionAttributeValues: {
              ':incr': { N: '1' },
              ':type': { S: 'projection' },
              ':pName': { S: product.productName },
              ':pId': { S: product.productId },
              ':GSI1PK': { S: 'TOTAL_COUNT' },
            },
            Key: {
              PK: { S: `PRODUCT#${product.productId}` },
              SK: { S: '#TOTAL_COUNT' },
            },
          },
        },
        {
          Update: {
            TableName: DynamodbProductRepository.TABLE_NAME,
            UpdateExpression:
              'ADD #value :incr SET entityType = :type, productName = :pName, productId = :pId, GSI2PK = :GSI2PK',
            ExpressionAttributeNames: {
              '#value': 'totalValue',
            },
            ExpressionAttributeValues: {
              ':incr': {
                N: (Number(product.price) * product.quantity).toString(),
              },
              ':type': { S: 'projection' },
              ':pName': { S: product.productName },
              ':pId': { S: product.productId },
              ':GSI2PK': { S: 'TOTAL_VALUE' },
            },
            Key: {
              PK: { S: `PRODUCT#${product.productId}` },
              SK: { S: '#TOTAL_VALUE' },
            },
          },
        },
      ],
    });

    try {
      await this.client.send(command);
    } catch (e) {
      if (this.isTransactionError(e)) {
        const isConditionalCheck = e.CancellationReasons.find(
          (el: CancellationReason) => el.Code === 'ConditionalCheckFailed',
        );

        if (isConditionalCheck) {
          return;
        }
      }

      throw e;
    }
  }

  public async getMostProfitable(): Promise<Array<MostProfitableRecord>> {
    const query = new QueryCommand({
      TableName: DynamodbProductRepository.TABLE_NAME,
      IndexName: 'GSI2PK-totalValue-index',
      KeyConditionExpression: 'GSI2PK = :type',
      ExpressionAttributeValues: {
        ':type': { S: 'TOTAL_VALUE' },
      },
      Limit: 10,
      ScanIndexForward: false,
    });

    const response = await this.client.send(query);

    if (response.Items.length === 0) {
      return [];
    }

    return response.Items.map((el) => ({
      name: el.productName.S,
      id: el.productId.S,
      total: Number(el.totalValue.N),
    }));
  }

  public async getMostBought(): Promise<Array<MostBoughtRecords>> {
    const query = new QueryCommand({
      TableName: DynamodbProductRepository.TABLE_NAME,
      IndexName: 'GSI1PK-amountSold-index',
      KeyConditionExpression: 'GSI1PK = :type',
      ExpressionAttributeValues: {
        ':type': { S: 'TOTAL_COUNT' },
      },
      Limit: 10,
      ScanIndexForward: false,
    });

    const response = await this.client.send(query);

    if (response.Items.length === 0) {
      return [];
    }

    return response.Items.map((el) => ({
      name: el.productName.S,
      count: Number(el.amountSold.N),
      id: el.productId.S,
    }));
  }

  public async getMostBoughtByDay(
    day: string,
  ): Promise<Array<MostBoughtRecords>> {
    const query = new QueryCommand({
      TableName: DynamodbProductRepository.TABLE_NAME,
      IndexName: 'GSI3PK-amountSold-index',
      KeyConditionExpression: 'GSI3PK = :type',
      ExpressionAttributeValues: {
        ':type': { S: `TOTAL_COUNT_DATE#${day}` },
      },
      Limit: 10,
      ScanIndexForward: false,
    });

    const response = await this.client.send(query);

    if (response.Items.length === 0) {
      return [];
    }

    return response.Items.map((el) => ({
      name: el.productName.S,
      count: Number(el.amountSold.N),
      id: el.productId.S,
    }));
  }

  private isTransactionError(
    error: Error,
  ): error is TransactionCanceledException {
    return error.name === TransactionCanceledException.name;
  }
}
