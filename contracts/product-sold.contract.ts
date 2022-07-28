import { v4 } from 'uuid';

export type ProductSoldEvent = {
  eventId: string;
  productName: string;
  productId: string;
  price: number;
  quantity: number;
  orderDate: string;
};

const KEY = 'product.sold';

const eventFactory = (
  productName: string,
  productId: string,
  price: number,
  quantity: number,
  orderDate: string,
  eventId?: string,
): ProductSoldEvent => ({
  eventId: eventId || v4(),
  productName,
  productId,
  price,
  quantity,
  orderDate: orderDate,
});

export const productSoldContract = { KEY, eventFactory };
