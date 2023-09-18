import { Exception } from '@adonisjs/core/build/standalone';

export default class NoRedisException extends Exception {
   public static invoke() {
      return new this(
         'Redis is initialized on this Adonis Server',
         500,
         'E_NO_REDIS'
      );
   }
}
