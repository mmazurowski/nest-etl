import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import {
  productSoldContract,
  ProductSoldEvent,
} from '../../../../../contracts/product-sold.contract';
import { DynamodbProductRepository } from '../infrastructure/dynamodb-product.repository';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ORDERS_DIGESTION_FEATURE } from '../feature';

@Controller()
export class EventsController {
  private readonly logger = new Logger(ORDERS_DIGESTION_FEATURE);

  constructor(
    private readonly repo: DynamodbProductRepository,
    @InjectQueue('products') private productsQueue: Queue,
  ) {}

  @EventPattern(productSoldContract.KEY)
  async productCounterOfAllTime(data: ProductSoldEvent) {
    this.logger.log(`Event with ID: [${data.eventId}] requested to import.`);

    await this.productsQueue.add(data);
  }
}
