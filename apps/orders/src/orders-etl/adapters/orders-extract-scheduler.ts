import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AbstractOrdersService } from '../application/interfaces/abstract-orders.service';
import { ORDERS_PROCESSING_FEATURE } from '../feature';

@Injectable()
export class OrdersExtractScheduler {
  private readonly logger = new Logger(ORDERS_PROCESSING_FEATURE);

  private isExecuting = false;

  constructor(private readonly ordersService: AbstractOrdersService) {}

  // For the purpose of demonstration fires more frequently than it would in real life.
  @Cron(CronExpression.EVERY_MINUTE)
  async execute(): Promise<void> {
    if (this.isExecuting) {
      this.logger.log('Skipping orders extraction. Previous job still running');
      return;
    }

    this.logger.log('Orders extraction scheduled.');

    this.isExecuting = true;

    try {
      await this.ordersService.process();
    } catch (e) {
      this.logger.error(e);
    }

    this.isExecuting = false;
  }
}
