import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersExtractScheduler } from './adapters/orders-extract-scheduler';
import { AbstractOrdersService } from './application/interfaces/abstract-orders.service';
import { ExtractOrdersService } from './application/extract-orders.service';
import { HttpModule } from '@nestjs/axios';
import { AbstractOrdersRepository } from './application/interfaces/abstract-orders.repository';
import { DynamodbOrdersRepository } from './infrastructure/dynamodb-orders.repository';

@Module({
  imports: [ScheduleModule.forRoot(), HttpModule],
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
