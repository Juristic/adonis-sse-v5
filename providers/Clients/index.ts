import { RedisManagerContract } from '@ioc:Adonis/Addons/Redis';
import { ClientInstance, ClientInstanceRedis } from '@ioc:isimisi/SSE';
import { ConfigContract } from '@ioc:Adonis/Core/Config';
import { ApplicationContract } from '@ioc:Adonis/Core/Application';
import NoRedisException from '../../src/Exceptions/NoRedisException';

type RedisResponse = Record<string, Record<string, string | number | boolean>>;

class Clients implements ClientInstance {
   private map: Map<string, Record<string, string | number | boolean>> =
      new Map();

   public get usingRedis() {
      return false;
   }

   all() {
      const entries = this.map.entries();
      return Object.fromEntries(entries);
   }

   get(id: string | number) {
      return this.map.get(id.toString());
   }

   set(id: string | number, obj: Record<string, string | number | boolean>) {
      this.map.set(id.toString(), obj);
   }

   remove(id: string | number) {
      this.map.delete(id.toString());
   }

   cleanUp() {
      this.map.clear();
   }
}

class RedisClients implements ClientInstanceRedis {
   private _redisKey = 'isimisiSSEClientKey';

   public get usingRedis() {
      return true;
   }

   set key(newKey: string) {
      this._redisKey = newKey;
   }

   constructor(private redis: RedisManagerContract, redisKey: string | null) {
      if (redisKey) {
         this.key = redisKey;
      }
   }

   async boot() {
      const result = await this.redis.get(this._redisKey);

      if (!result) {
         await this.redis.set(this._redisKey, JSON.stringify({}));
      }
   }

   async all() {
      const raw = (await this.redis.get(this._redisKey)) as string;
      const object: RedisResponse = JSON.parse(raw);
      return object;
   }

   async get(id: string | number) {
      const raw = (await this.redis.get(this._redisKey)) as string;
      const object: RedisResponse = JSON.parse(raw);
      return object[id];
   }

   async remove(id: string | number) {
      const raw = (await this.redis.get(this._redisKey)) as string;
      const object: RedisResponse = JSON.parse(raw);
      delete object[id];
      await this.redis.set(this._redisKey, JSON.stringify(object));
   }

   async set(
      id: string | number,
      obj: Record<string, string | number | boolean>
   ) {
      const raw = (await this.redis.get(this._redisKey)) as string;
      const object: RedisResponse = JSON.parse(raw);
      object[id] = obj;
      await this.redis.set(this._redisKey, JSON.stringify(object));
   }

   async cleanUp() {
      await this.redis.del(this._redisKey);
   }
}

export default function ClientManager(
   Config: ConfigContract,
   app: ApplicationContract
) {
   const config = Config.get('sse.sseConfig');

   if (config.redis) {
      try {
         const redis: RedisManagerContract = app.container.resolveBinding(
            'Adonis/Addons/Redis'
         );

         if (!redis) {
            throw NoRedisException.invoke();
         }

         return new RedisClients(redis, config.redisKey);
      } catch (error) {
         throw NoRedisException.invoke();
      }
   } else return new Clients();
}
