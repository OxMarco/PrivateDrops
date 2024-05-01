import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SendgridService } from './sendgrid.service';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  providers: [SendgridService, MailProcessor],
  exports: [SendgridService],
})
export class SendgridModule {}
