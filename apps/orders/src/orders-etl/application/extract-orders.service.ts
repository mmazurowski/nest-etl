import { AbstractOrdersService } from './interfaces/abstract-orders.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ORDERS_PROCESSING_FEATURE } from '../feature';
import { HttpService } from '@nestjs/axios';
import { Order } from '../domain/order.type';
import { AbstractOrdersRepository } from './interfaces/abstract-orders.repository';
import { ClientProxy } from '@nestjs/microservices';
import { productSoldContract } from '../../../../../contracts/product-sold.contract';
import { reduceToUnique } from '../shared/reduce-to-unique-products';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExtractOrdersService extends AbstractOrdersService {
  private readonly logger = new Logger(ORDERS_PROCESSING_FEATURE);

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly orderRepository: AbstractOrdersRepository,
    @Inject('ORDERS_SERVICE') private client: ClientProxy,
  ) {
    super();
  }

  public async process(): Promise<void> {
    this.logger.log('Orders service processing started.');
    const endpoint = this.config.get('ORDERS_ENDPOINT');

    const BATCH_SIZE = 100;
    let hasNextPage = true;

    let page = 1;
    const request = {
      url: endpoint,
      method: 'GET',
      headers: {
        accepts: 'application/json',
      },
      params: {
        _limit: BATCH_SIZE,
        _page: page,
      },
    };

    do {
      const res = await this.httpService.axiosRef.request<Order[]>({
        ...request,
        params: { ...request.params, _page: page },
      });

      const repoPromises = res.data.map(async (order) => {
        const uniqueOrder = {
          ...order,
          items: reduceToUnique(order.items),
        };

        const shouldPublish = await this.orderRepository.save(uniqueOrder);

        if (shouldPublish) {
          const promises = order.items.map(
            ({ product: { id, name, price }, quantity }) =>
              this.client
                .emit(
                  productSoldContract.KEY,
                  productSoldContract.eventFactory(
                    name,
                    id,
                    Number(price) * 100,
                    quantity,
                    order.date,
                  ),
                )
                .toPromise(),
          );

          await Promise.all(promises);
        }
      });

      if (repoPromises.length === 0) {
        break;
      }

      await Promise.all(repoPromises);

      this.logger.log(`Page number: [${page}] processed.`);

      hasNextPage =
        res.status <= 400 && res.status >= 200 && res.data.length > 0;
      page = page + 1;
    } while (hasNextPage);

    this.logger.log('All orders extracted');
  }
}
