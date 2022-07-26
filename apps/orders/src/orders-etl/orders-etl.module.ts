import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersExtractScheduler } from './adapters/orders-extract-scheduler';
import { AbstractOrdersService } from './application/interfaces/abstract-orders.service';
import { ExtractOrdersService } from './application/extract-orders.service';
import { HttpModule } from '@nestjs/axios';
import { AbstractOrdersRepository } from './application/interfaces/abstract-orders.repository';
import { DynamodbOrdersRepository } from './infrastructure/dynamodb-orders.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HttpModule,
    ClientsModule.registerAsync([
      {
        name: 'ORDERS_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const user = config.get('RABBITMQ_USER');
          const password = config.get('RABBITMQ_PASSWORD');
          const host = config.get('RABBITMQ_HOST');
          const queue = config.get('PRODUCTS_SVC_INCOMING_QUEUE');

          return {
            transport: Transport.RMQ,
            options: {
              urls: [`amqp://${user}:${password}@${host}/`],
              queue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [],
  providers: [
    OrdersExtractScheduler,
    {
      provide: AbstractOrdersService,
      useClass: ExtractOrdersService,
    },
    {
      provide: AbstractOrdersRepository,
      useClass: DynamodbOrdersRepository,
    },
  ],
})
export class OrdersEtlModule {}
