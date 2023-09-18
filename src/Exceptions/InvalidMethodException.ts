import { Exception } from '@adonisjs/core/build/standalone';

export default class InvalidMethodException extends Exception {
   public static invoke() {
      return new this('The provided method on the request is invalid!', 500);
   }
}
