import { Order } from '../../domain/order.type';

export abstract class AbstractOrdersRepository {
  public abstract save(order: Order): Promise<void>;
}
