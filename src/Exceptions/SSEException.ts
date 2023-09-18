import { Exception } from '@adonisjs/core/build/standalone';

export default class SSEException extends Exception {
   public static invoke() {
      return new this('Unexpected Error In SSE Middleware', 500);
   }
}
