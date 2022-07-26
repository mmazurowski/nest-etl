import { reduceToUnique } from './reduce-to-unique-products';

const doubledProduct = [
  {
    product: {
      id: '022032aacb6ad6f4b39ac2cc',
      name: 'Luxurious Wooden Soap',
      price: '98.00',
    },
    quantity: 1,
  },
  {
    product: {
      id: '022032aacb6ad6f4b39ac2cc',
      name: 'Luxurious Wooden Soap',
      price: '98.00',
    },
    quantity: 5,
  },
];

describe('reduce order items to be unique', () => {
  test('sums duplicates to one element', () => {
    const unique = reduceToUnique(doubledProduct);

    expect(unique).toHaveLength(1);
    expect(unique[0].quantity).toBe(6);
  });
});
