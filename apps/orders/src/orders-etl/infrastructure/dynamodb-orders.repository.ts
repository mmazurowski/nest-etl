import { AbstractOrdersRepository } from '../application/interfaces/abstract-orders.repository';
import { Order } from '../domain/order.type';
import {
  CancellationReason,
  DynamoDBClient,
  TransactionCanceledException,
  TransactWriteItem,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ORDERS_PROCESSING_FEATURE } from '../feature';
import { v4 } from 'uuid';

@Injectable()
export class DynamodbOrdersRepository extends AbstractOrdersRepository {
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly client: DynamoDBClient,
  ) {
    super();
  }
  private static TABLE_NAME = 'orders';

  private readonly logger = new Logger(ORDERS_PROCESSING_FEATURE);

  public async save(order: Order): Promise<boolean> {
    const items: TransactWriteItem[] = order.items.map((item) => ({
      Put: {
        TableName: DynamodbOrdersRepository.TABLE_NAME,
        Item: {
          PK: { S: `ORDER#${order.id}ID#${item.product.id}#ITEMID#${v4()}` },
          productName: { S: item.product.name },
          productPrice: { S: item.product.price },
          quantity: { N: item.quantity.toString() },
        },
      },
    }));

    items.push({
      Put: {
        TableName: DynamodbOrdersRepository.TABLE_NAME,
        Item: {
          PK: { S: `ORDER#${order.id}` },
          id: { S: order.id },
          date: { S: order.date },
          customerName: { S: order.customer.name },
          customerId: { S: order.customer.id },
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });

    const command = new TransactWriteItemsCommand({
      TransactItems: items,
    });

    try {
      await this.client.send(command);

      return true;
    } catch (e) {
      if (this.isTransactionError(e)) {
        const isConditionalCheck = e.CancellationReasons.find(
          (el: CancellationReason) => el.Code === 'ConditionalCheckFailed',
        );

        if (isConditionalCheck) {
          this.logger.log(
            `Order with ID: [${order.id}] already processed. Skipping`,
          );
        }

        return false;
      }

      throw e;
    }
  }

  private isTransactionError(
    error: Error,
  ): error is TransactionCanceledException {
    return error.name === TransactionCanceledException.name;
  }
}
