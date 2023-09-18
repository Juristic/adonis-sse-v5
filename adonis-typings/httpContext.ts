/// <reference path="./sse.ts" />
declare module '@ioc:Adonis/Core/HttpContext' {
   import { EventSourceContract } from '@ioc:isimisi/SSE';

   export interface HttpContextContract {
      sse: InstanceType<EventSourceContract>;
   }
}
