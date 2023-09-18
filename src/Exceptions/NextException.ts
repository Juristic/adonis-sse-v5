import { Exception } from '@adonisjs/core/build/standalone';

export default class NextFnException extends Exception {
   public static invoke() {
      return new this(
         'Next function given from the SSE middleware is not a function',
         500
      );
   }
}
