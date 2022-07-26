// eslint-disable-next-line @typescript-eslint/no-var-requires
const ksuid = require('ksuid');
import { Order } from '../domain/order.type';
import { AttributeValue, WriteRequest } from '@aws-sdk/client-dynamodb';

type OrderRecord = {
  PK: string;
  id: string;
  date: string;
  customerId: string;
  customerName: string;
};

type OrderItemRecord = {
  PK: string;
  id: string;
  productName: string;
  productPrice: string;
  quantity: number;
};

export class DynamodbOrdersMapper {
  static toPersistence(order: Order): WriteRequest[] {
    const orderKsuid = ksuid.randomSync(new Date(order.date));

    const requests: WriteRequest[] = [
      {
        PutRequest: {
          Item: {
            PK: { S: `ORDER#${orderKsuid.string}` },
            id: { S: order.id },
            date: { S: order.date },
            customerName: { S: order.customer.name },
            customerId: { S: order.customer.id },
          },
        },
      },
      ...order.items.map((item) => ({
        PutRequest: {
          Item: {
            PK: { S: `ORDER#${orderKsuid.string}ID#${item.product.id}` },
            productName: { S: item.product.name },
            productPrice: { S: item.product.price },
            quantity: { N: item.quantity.toString() },
          },
        },
      })),
    ];

    return requests;
  }
}
