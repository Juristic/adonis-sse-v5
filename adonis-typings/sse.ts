declare module '@ioc:isimisi/SSE' {
   import { IncomingMessage, ServerResponse } from 'http';
   import { EventEmitter } from 'stream';
   import { ApplicationContract } from '@ioc:Adonis/Core/Application';
   import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
   import { LoggerContract } from '@ioc:Adonis/Core/Logger';
   import { ConfigContract } from '@ioc:Adonis/Core/Config';

   type Id = string | number | symbol;

   export interface ClientInstance {
      usingRedis: boolean;
      all(): Record<string, Record<string, string | number | boolean>>;
      get(
         id: string | number
      ): Record<string, string | number | boolean> | undefined;
      set(
         id: string | number,
         obj: Record<string, string | number | boolean>
      ): void;
      remove(id: string | number): void;
      cleanUp(): void;
   }
   export interface ClientInstanceRedis {
      usingRedis: boolean;
      boot(): Promise<void>;
      all(): Promise<Record<string, Record<string, string | number | boolean>>>;
      get(
         id: string | number
      ): Promise<Record<string, string | number | boolean>>;
      set(
         id: string | number,
         obj: Record<string, string | number | boolean>
      ): Promise<void>;
      remove(id: string | number): Promise<void>;
      cleanUp(): Promise<void>;
   }

   export function ClientManager(
      config: ConfigContract,
      application: ApplicationContract
   ): ClientInstanceRedis | ClientInstance;

   export interface EventSourcePayload {
      id: Id;
      data: any;
      comment: string | null | undefined;
      event: string | undefined;
      retry: number | undefined;
   }

   export interface EventStreamOptions {
      noIds: boolean;
      padForIe: boolean;
      preferedEventName: string;
   }

   export interface EventSourceInstance<
      T = ClientInstance | ClientInstanceRedis
   > extends EventEmitter {
      send: (
         data: any,
         event?: string,
         retry?: number,
         comment?: string | null
      ) => boolean;
      ready(): Promise<void>;
      clients: T;
      id: string | number | symbol;
      response: ServerResponse;
      end: ServerResponse['end'];
   }

   export interface EventSourceContract<
      T = ClientInstance | ClientInstanceRedis
   > {
      new (idGeneratorFunc: () => Id, clients: T): EventSourceInstance;
   }

   export const EventSource: EventSourceContract;

   export interface EventStreamContract {
      dispatch: (callback: (...args: any) => any) => boolean;
      new (Config: ConfigContract, Logger: LoggerContract): {
         logger: LoggerContract;
         init: (
            source: EventSourceInstance
         ) => Promise<
            (
               request: IncomingMessage,
               response: ServerResponse,
               next: () => Promise<void>
            ) => Promise<void>
         >;
      };
   }

   export interface SSEConfig {
      pad_for_ie: boolean;
      no_ids: boolean;
      cors: {
         origin: string | Array<string>;
         methods: string[];
         credentials: boolean;
         maxAge: number;
         exposeHeaders: string[];
      };
      prefered_event_name?: string;
      redis: boolean;
      redisKey: null | string;
   }

   export interface SSEMiddlewareContract {
      new (
         application: ApplicationContract,
         stream: InstanceType<EventStreamContract>
      ): {
         handle(ctx: HttpContextContract, next: () => Promise<void>): any;
      };
   }

   const SSEMiddleware: SSEMiddlewareContract;

   export default SSEMiddleware;
}
