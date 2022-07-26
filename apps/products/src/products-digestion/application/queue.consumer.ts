import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProductSoldEvent } from '../../../../../contracts/product_created.contract';
import { DynamodbProductRepository } from '../infrastructure/dynamodb-product.repository';
import { backOff } from 'exponential-backoff';
import { Logger } from '@nestjs/common';
import { ORDERS_PROCESSING_FEATURE } from '../../../../orders/src/orders-etl/feature';

@Processor('products')
export class QueueConsumer {
  private readonly logger = new Logger(ORDERS_PROCESSING_FEATURE);

  constructor(private readonly repo: DynamodbProductRepository) {}

  @OnQueueFailed()
  public onError(job: Job<ProductSoldEvent>, error: Error) {
    this.logger.error(`Queue job has failed with error: ${error.name}`);
  }

  @Process()
  public async handle(job: Job<ProductSoldEvent>) {
    await backOff(() => this.repo.save(job.data), {
      numOfAttempts: 10,
      jitter: 'full',
      timeMultiple: 3,
    });

    this.logger.log(
      `Event with ID: [${job.data.eventId}] successfully imported`,
    );
  }
}
