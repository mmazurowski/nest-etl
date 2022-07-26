import { Item } from '../domain/order.type';

export const reduceToUnique = (items: Item[]): Item[] => {
  const map = new Map<string, Item>();
  for (const item of items) {
    const productId = item.product.id;

    if (map.has(productId)) {
      const currentProduct = map.get(productId);

      map.set(productId, {
        ...currentProduct,
        quantity: currentProduct.quantity + item.quantity,
      });

      continue;
    }

    map.set(productId, item);
  }

  return Array.from(map.values());
};
