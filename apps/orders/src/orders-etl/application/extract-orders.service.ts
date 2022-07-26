import { AbstractOrdersService } from './interfaces/abstract-orders.service';
import { Injectable, Logger } from '@nestjs/common';
import { ORDERS_PROCESSING_FEATURE } from '../feature';
import { HttpService } from '@nestjs/axios';
import { Order } from '../domain/order.type';
import { EMPTY, expand } from 'rxjs';
import { AbstractOrdersRepository } from './interfaces/abstract-orders.repository';

@Injectable()
export class ExtractOrdersService extends AbstractOrdersService {
  private readonly logger = new Logger(ORDERS_PROCESSING_FEATURE);

  constructor(
    private readonly httpService: HttpService,
    private readonly orderRepository: AbstractOrdersRepository,
  ) {
    super();
  }

  public async process(): Promise<void> {
    this.logger.log('Orders service processing.');

    await this.extractOrders();
  }

  private async extractOrders(): Promise<void> {
    return new Promise((resolve, reject) => {
      const BATCH_SIZE = 1;

      // TODO: Change to 1
      let page = 20000;
      const request = {
        url: 'https://recruitment-api.dev.flipfit.io/orders',
        // url: 'https://my-json-server.typicode.com/typicode/demo/posts',
        method: 'GET',
        headers: {
          accepts: 'application/json',
        },
        params: {
          _limit: BATCH_SIZE,
          _page: page,
        },
      };

      this.httpService
        .request<Order[]>({ ...request })
        .pipe(
          expand((response) => {
            const hasNextPage =
              response.status <= 400 &&
              response.status >= 200 &&
              response.data.length > 0;

            page = page + 1;

            return hasNextPage
              ? this.httpService.request<Order[]>({
                  ...request,
                  params: { ...request.params, _page: page },
                })
              : EMPTY;
          }),
        )
        .subscribe(async (result) => {
          await Promise.all(
            result.data.map(async (order) => this.orderRepository.save(order)),
          );
          result.data.map((el) => this.logger.log(el.customer.name));
        })
        .add(() => {
          resolve();
        });
    });
  }
}
