import { EventEmitter } from 'stream';
import {
   ClientInstance,
   ClientInstanceRedis,
   EventSourceContract,
   EventSourcePayload,
} from '@ioc:isimisi/SSE';
import staticImplements from '../../decorators/staticImplements';

@staticImplements<EventSourceContract>()
export default class Source extends EventEmitter {
   private idgenfn: () => string | number | symbol;
   private _id: string | number | symbol;

   /**
    * ID of client who instanciated the request;
    */
   public get id() {
      return this._id;
   }

   constructor(
      idGeneratorFunc: () => string | number | symbol,
      public clients: ClientInstance | ClientInstanceRedis
   ) {
      super();

      function guid() {
         return ++guid.id;
      }

      guid.id = 0;

      this.idgenfn = idGeneratorFunc || guid;
      this._id = this.idgenfn();
   }

   async ready() {
      await this.clients.set(this._id.toString(), {
         timestamp: new Date().valueOf(),
      });
   }

   send(
      data: any,
      event: string = '',
      retry: number = 0,
      comment: string | null = null
   ) {
      const payload: EventSourcePayload = {
         id: this.idgenfn(),
         data: data,
         comment,
         event,
         retry: Number.isNaN(retry) ? 0 : retry,
      };

      return this.emit('data', payload);
   }
}
