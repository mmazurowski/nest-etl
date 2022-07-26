import { Module } from '@nestjs/common';
import { OrdersEtlModule } from './orders-etl/orders-etl.module';

@Module({
  imports: [OrdersEtlModule],
})
export class AppModule {}
