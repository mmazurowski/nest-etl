import { NestFactory } from '@nestjs/core';
import { ProductsModule } from './products-digestion/products.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(ProductsModule);

  const config = app.get(ConfigService);

  const user = config.get('RABBITMQ_USER');
  const password = config.get('RABBITMQ_PASSWORD');
  const host = config.get('RABBITMQ_HOST');
  const queue = config.get('PRODUCTS_SVC_INCOMING_QUEUE');

  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${user}:${password}@${host}/`],
      queue,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();
