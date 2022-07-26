type Product = {
  id: string;
  name: string;
  price: string;
};

export type Item = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  customer: {
    id: string;
    name: string;
  };
  items: Array<Item>;
};
