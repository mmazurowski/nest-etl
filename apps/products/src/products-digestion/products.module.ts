import { Module } from '@nestjs/common';
import { EventsController } from './adapters/events.controller';
import { HttpController } from './adapters/http.controller';
import { DynamodbProductRepository } from './infrastructure/dynamodb-product.repository';
import { BullModule } from '@nestjs/bull';
import { QueueConsumer } from './application/queue.consumer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    BullModule.registerQueue({
      redis: {
        host: 'redis',
        port: 6379,
      },
      name: 'products',
    }),
    ConfigModule.forRoot(),
  ],
  controllers: [EventsController, HttpController],
  providers: [DynamodbProductRepository, QueueConsumer],
})
export class ProductsModule {}
