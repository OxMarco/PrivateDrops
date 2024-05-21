import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { StripeModule } from './stripe/stripe.module';
import { AwsModule } from './aws/aws.module';
import { AdminModule } from './admin/admin.module';
import { SendgridModule } from './sendgrid/sendgrid.module';
import { PaymentModule } from './payment/payment.module';
import { BullModule } from '@nestjs/bull';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secretKey: configService.get<string>('GOOGLE_RECAPTCHA_SECRET_KEY'),
        response: (req) => req.headers.recaptcha,
      }),
      inject: [ConfigService],
    }),
    TerminusModule.forRoot({
      logger: false,
    }),
    UserModule,
    AuthModule,
    MediaModule,
    StripeModule,
    SendgridModule,
    AwsModule,
    AdminModule,
    PaymentModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
