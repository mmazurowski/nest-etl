import { Module } from '@nestjs/common';
import { EventsController } from './adapters/events.controller';
import { HttpController } from './adapters/http.controller';
import { DynamodbProductRepository } from './infrastructure/dynamodb-product.repository';
import { BullModule } from '@nestjs/bull';
import { QueueConsumer } from './application/queue.consumer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Agent } from 'http';

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
  providers: [
    DynamodbProductRepository,
    QueueConsumer,
    {
      inject: [ConfigService],
      provide: 'DYNAMODB_CLIENT',
      useFactory: (config: ConfigService) => {
        // Local version of DynamoDB requires a bit different config than production.
        // This could be in Factory depending on actual environment
        const endpoint = config.get('DYNAMODB_PRODUCTS_ENDPOINT');

        return new DynamoDBClient({
          credentials: {
            secretAccessKey: 'dummy-data',
            accessKeyId: 'dummy-data',
          },
          endpoint,
          requestHandler: new NodeHttpHandler({
            httpAgent: new Agent({
              keepAlive: true,
            }),
          }),
        });
      },
    },
  ],
})
export class ProductsModule {}
