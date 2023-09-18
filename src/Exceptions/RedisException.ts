import { Exception } from '@adonisjs/core/build/standalone';

export default class RedisException extends Exception {
   public static invoke(message: string) {
      return new this(message, 500);
   }
}
