import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

interface Transfer {
  recipientName: string;
  amount: number;
  reference: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('transfer')
  async createTransfer(
    @Body('recipientName') recipientName: string,
    @Body('accountNumber') accountNumber: string,
    @Body('amount') amount: number,
    @Body('reference') reference: string,
  ) {
    const transfer = await this.appService.createTransfer(
      recipientName,
      accountNumber,
      amount,
      reference,
    );
    return { transfer };
  }

  
}
