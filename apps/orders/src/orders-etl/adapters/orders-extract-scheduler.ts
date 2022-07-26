import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AbstractOrdersService } from '../application/interfaces/abstract-orders.service';
import { ORDERS_PROCESSING_FEATURE } from '../feature';

@Injectable()
export class OrdersExtractScheduler {
  private readonly logger = new Logger(ORDERS_PROCESSING_FEATURE);

  constructor(private readonly ordersService: AbstractOrdersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async execute(): Promise<void> {
    this.logger.log('Orders extraction scheduled.');

    return this.ordersService.process();
  }
}
