import { AbstractOrdersRepository } from '../application/interfaces/abstract-orders.repository';
import { Order } from '../domain/order.type';
import {
  BatchWriteItemCommand,
  DynamoDBClient,
  PutRequest,
} from '@aws-sdk/client-dynamodb';
import { Injectable } from '@nestjs/common';
import { DynamodbOrdersMapper } from './dynamodb-orders.mapper';

@Injectable()
export class DynamodbOrdersRepository extends AbstractOrdersRepository {
  private static TABLE_NAME = 'orders';

  public async save(order: Order): Promise<void> {
    const client = new DynamoDBClient({ endpoint: 'http://localhost:8000' });

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [DynamodbOrdersRepository.TABLE_NAME]:
          DynamodbOrdersMapper.toPersistence(order),
      },
    });

    await client.send(command);
  }
}
