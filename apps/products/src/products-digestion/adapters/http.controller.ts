import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { DynamodbProductRepository } from '../infrastructure/dynamodb-product.repository';

type MostProfitableResponse = {
  id: string;
  total: number;
  name: string;
};

type MostBoughtResponse = {
  id: string;
  name: string;
  count: number;
};

type ResponseWrapper<T> = {
  success: boolean;
  data: T;
};

@Controller()
export class HttpController {
  constructor(private readonly repo: DynamodbProductRepository) {}

  @Get('/product/most-profit')
  @HttpCode(200)
  public async mostProfitOfAllTime(): Promise<
    ResponseWrapper<MostProfitableResponse[]>
  > {
    const data = await this.repo.getMostProfitable();
    return { success: true, data };
  }

  @Get('/product/most-frequent')
  @HttpCode(200)
  public async mostOftenBoughtOfAllTime(): Promise<
    ResponseWrapper<MostBoughtResponse[]>
  > {
    const data = await this.repo.getMostBought();

    return { success: true, data };
  }

  @Get('/product/most-frequent-yesterday')
  @HttpCode(200)
  public async mostOftenBoughtYesterday(
    @Query('day') dayFor,
  ): Promise<ResponseWrapper<MostBoughtResponse[]>> {
    const data = await this.repo.getMostBoughtByDay(dayFor);

    return { success: true, data };
  }
}
