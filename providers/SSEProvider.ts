import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import type {
   EventSourceContract,
   EventStreamContract,
   ClientManager,
} from '@ioc:isimisi/SSE';
import type { v4 } from 'uuid';
import type { HttpContextConstructorContract } from '@ioc:Adonis/Core/HttpContext';

export default class SSEProvider {
   public static needsApplication = true;

   constructor(protected app: ApplicationContract) {}

   private registerEventStream() {
      this.app.container.singleton('isimisi/SSE/EventStream', () => {
         const Config = this.app.container.resolveBinding('Adonis/Core/Config');
         const Logger = this.app.container.resolveBinding('Adonis/Core/Logger');
         const EventStream: EventStreamContract =
            require('./Event/EventStream').default;
         return new EventStream(Config, Logger);
      });
   }

   private registerSSEClients() {
      this.app.container.singleton('isimisi/SSE/Clients', () => {
         const Config = this.app.container.resolveBinding('Adonis/Core/Config');
         const cliManager: typeof ClientManager =
            require('./Clients/index').default;

         return cliManager(Config, this.app);
      });
   }

   private registerEventSource() {
      this.app.container.bind('isimisi/SSE/EventSource', () => {
         const Source: EventSourceContract =
            require('./Event/EventSource').default;

         const clients = this.app.container.resolveBinding(
            'isimisi/SSE/Clients'
         );

         const uuid: typeof v4 = require('uuid').v4;

         return new Source(uuid, clients);
      });
   }

   public register() {
      this.registerEventStream();
      this.registerSSEClients();
      this.registerEventSource();
      this.app.container.bind('isimisi/SSE', () => {
         const stream: InstanceType<EventStreamContract> =
            this.app.container.resolveBinding('isimisi/SSE/EventStream');
         const { SSEMiddleware } = require('../src/Middlewares/SSEMiddleware');
         return new SSEMiddleware(this.app, stream);
      });
   }

   private async bootClients() {
      const clients = this.app.container.resolveBinding('isimisi/SSE/Clients');

      await clients.cleanUp();

      if (clients.usingRedis) {
         await clients.boot();
      }
   }

   public async boot() {
      await this.bootClients();

      const HttpContext: HttpContextConstructorContract =
         this.app.container.resolveBinding('Adonis/Core/HttpContext');
      const container = this.app.container;
      /**
       * Adding getter to the HTTP context. Please note the queue
       * instance...
       */
      HttpContext.getter(
         'sse',
         function () {
            // A NEW SOURCE INSTANCE ON EVERY REQUEST [HTTP]
            if (
               this.request.method().toLowerCase() === 'get' ||
               this.request.method().toLowerCase() === 'post'
            ) {
               const sse = container.resolveBinding('isimisi/SSE/EventSource');
               sse.setServerResponse(this.request.response);
               return sse;
            } else {
               return { send: function () {}, end: function () {} };
            }
         },
         true
      );
   }
}
