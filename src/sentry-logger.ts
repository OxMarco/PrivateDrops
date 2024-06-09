import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export class SentryLogger extends Logger {
  error(message: any, stack?: string, context?: string) {
    Sentry.captureMessage(message, 'error');
    if (context) {
      Sentry.captureMessage(context, 'error');
      Sentry.captureMessage(stack, 'error');
      super.error(message, stack, context);
    } else if (stack) {
      Sentry.captureMessage(stack, 'error');
      super.error(message, stack);
    } else super.error(message);
  }
}
