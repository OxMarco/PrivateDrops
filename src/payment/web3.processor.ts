import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bull';

type TransactionJob = {
  destinationAddress: string;
  amount: number;
};

@Processor('web3')
export class Web3Processor {
  private logger: Logger;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.logger = new Logger(Web3Processor.name);
  }

  @Process()
  async send(job: Job<TransactionJob>) {
    const data = job.data;
  }

  @OnQueueError()
  onError(job: Job) {
    this.logger.error(
      'An error occurred in the web3 processor queue',
      job.data,
    );
  }
}
