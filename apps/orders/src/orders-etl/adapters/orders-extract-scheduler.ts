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
    this.logger.log('Orders extraction scheduled.');

    if (this.isExecuting) {
      this.logger.log(
        'Skipping cron invocation. Previous invocation still running',
      );
      return;
    }

    this.isExecuting = true;

    await this.ordersService.process();

    this.isExecuting = false;
  }
}
