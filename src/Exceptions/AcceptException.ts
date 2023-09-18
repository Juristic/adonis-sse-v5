import { Exception } from '@adonisjs/core/build/standalone';

export default class SSEAcceptException extends Exception {
   public static invoke() {
      return new this(
         'Client does not accept text/event-stream',
         403,
         'E_INVALID_ACCEPT_HEADER'
      );
   }
}
