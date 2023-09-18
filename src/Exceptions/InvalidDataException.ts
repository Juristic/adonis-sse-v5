import { Exception } from '@adonisjs/core/build/standalone';

export default class InvalidDataException extends Exception {
   public static invoke() {
      return new this('Data cannot be falsey nor a function', 500);
   }
}
