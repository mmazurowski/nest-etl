import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { OrdersEtlModule } from './orders-etl/orders-etl.module';

async function bootstrap() {
  const app = await NestFactory.create(OrdersEtlModule);

  const config = app.get(ConfigService);

  const user = config.get('RABBITMQ_USER');
  const password = config.get('RABBITMQ_PASSWORD');
  const host = config.get('RABBITMQ_HOST');
  const queue = config.get('ORDERS_SVC_OUTGOING_QUEUE');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${user}:${password}@${host}/`],
      queue,
      queueOptions: {
        durable: true,
      },
    },
  });

  // Required for Scheduler to work
  await app.init();

  await app.startAllMicroservices();
}
bootstrap();
