import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export class SentryLogger extends Logger {
  error(message: any, stack?: string, context?: string) {
    Sentry.captureMessage(message, 'error');
    if (context) super.error(message, stack, context);
    else if (stack) super.error(message, stack);
    else super.error(message);
  }
}
