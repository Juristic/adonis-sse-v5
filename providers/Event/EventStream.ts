import {
   EventSourceContract,
   EventSourcePayload,
   EventStreamContract,
   SSEConfig,
} from '@ioc:isimisi/SSE';
import { IncomingMessage, ServerResponse } from 'http';
import staticImplements from '../../decorators/staticImplements';
import SSEAcceptException from '../../src/Exceptions/AcceptException';
import NextFnException from '../../src/Exceptions/NextException';
import InvalidDataException from '../../src/Exceptions/InvalidDataException';
import { ConfigContract } from '@ioc:Adonis/Core/Config';
import { LoggerContract } from '@ioc:Adonis/Core/Logger';

@staticImplements<EventStreamContract>()
export default class EventStream {
   private config: SSEConfig;

   constructor(
      protected Config: ConfigContract,
      public logger: LoggerContract
   ) {
      this.config = Config.get('sse.sseConfig');
   }

   static dispatch(callback: (...args: any[]) => any) {
      setTimeout(
         function poll(...args: any[]) {
            const returnVal = callback.apply(null, args);

            const pending = Promise.all([Promise.resolve(false), returnVal]);

            pending.then(function () {
               setTimeout(poll, 0, args);
            });
         },
         0,
         ...[].slice.call(arguments, 1)
      );

      return true;
   }

   static set logger(newLogger: LoggerContract) {
      this.prototype.logger = newLogger;
   }

   private corsHandler(req: IncomingMessage, res: ServerResponse) {
      const { cors } = this.config;

      res.setHeader('Access-Control-Allow-Methods', String(cors.methods));
      res.setHeader('Access-Control-Max-Age', cors.maxAge.toString());
      res.setHeader(
         'Access-Control-Expose-Headers',
         String(cors.exposeHeaders)
      );
      res.setHeader(
         'Access-Control-Allow-Credentials',
         String(cors.credentials)
      );

      if (typeof cors.origin === 'string') {
         res.setHeader('Access-Control-Allow-Origin', cors.origin);
      } else {
         const origin = req.headers.origin;
         if (origin && cors.origin.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
         }
      }
   }

   private hasValidAcceptHeaders(acceptHeader: string[] | string) {
      return (
         acceptHeader.includes('application/json') ||
         acceptHeader.includes('text/event-stream') ||
         acceptHeader.includes('*/*')
      );
   }

   async init(source: InstanceType<EventSourceContract>) {
      await source.ready();

      const prepareTextData = function (data: any) {
         if (!data || typeof data === 'function') {
            throw InvalidDataException.invoke();
         }

         if (typeof data === 'object') {
            const formatedData: string | Array<string> =
               typeof data.toJSON === 'function'
                  ? data.toJSON()
                  : JSON.stringify(data, null, '\t').split(/\n/g);

            return typeof formatedData === 'string'
               ? `data: ${formatedData}`
               : formatedData
                    .map(function (dataLine) {
                       return `data: ${dataLine.replace(/(?:\t{1,})/g, '')}\n`;
                    })
                    .join('');
         } else {
            if (typeof data !== 'string') {
               return `data: ${String(data)}`;
            } else {
               return `data: ${data}`;
            }
         }
      };

      const options = {
         padForIe: this.config.pad_for_ie,
         noIds: this.config.no_ids,
         preferedEventName: this.config.prefered_event_name,
      };

      return function (
         this: EventStream,
         req: IncomingMessage,
         res: ServerResponse,
         next: () => Promise<void>
      ) {
         if (this.hasValidAcceptHeaders(req.headers['accept'] || '')) {
            const isIE =
               req.headers['ua-cpu'] ||
               (req.headers['user-agent'] || 'unknown').match(
                  /Trident [\d]{1}/g
               ) !== null;

            req.socket.setTimeout(0);
            req.socket.setNoDelay(true);
            req.socket.setKeepAlive(true);
            res.statusCode = 200;

            this.corsHandler(req, res);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');

            if (req.httpVersion !== '2.0') {
               res.setHeader('Connection', 'keep-alive');
               res.setHeader('X-Accel-Buffering', 'no');
            }

            // browsers can disconnect at will despite the 'Connection: keep-alive'
            // so we trick the browser to expect more data by sending SSE comments

            let intervalId: NodeJS.Timeout | null = null;

            if (req.headers['connection'] !== 'keep-alive') {
               intervalId = setInterval(function () {
                  res.write(`: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`);
               }, 1500);
            }

            // Increase number of event listeners on init
            source.setMaxListeners(source.getMaxListeners() + 1);

            const dataListener = (payload: Partial<EventSourcePayload>) => {
               if (options.noIds) {
                  delete payload.id;
               }

               if (options.padForIe || isIE) {
                  // 2 kB padding for old IE (8/9)
                  res.write(`: ${';'.repeat(2048)}`);
               }

               if (payload.comment) {
                  res.write(`: ${payload.comment}\n`);
               }

               if (payload.id) {
                  res.write(`id: ${String(payload.id)}\n`);
               }

               if (payload.retry) {
                  res.write(`retry: ${payload.retry}\n`);
               }

               if (payload.event) {
                  res.write(`event: ${payload.event}\n`);
               } else {
                  if (options.preferedEventName) {
                     res.write(
                        `event: ${options.preferedEventName || 'message'}\n`
                     );
                  }
               }

               if (source.id) {
                  res.write(`sse_id: ${source.id.toString()}\n`);
               }

               if (payload.data) {
                  res.write(`${prepareTextData(payload.data)}\n\n`);
               }
            };

            source.on('data', dataListener);

            // Remove listeners and reduce the number of max listeners on client disconnect
            req.on('close', () => {
               intervalId && clearInterval(intervalId);
               source.removeListener('data', dataListener);
               source.setMaxListeners(source.getMaxListeners() - 1);
               source.clients.remove(source.id.toString());
            });
         } else {
            throw SSEAcceptException.invoke();
         }

         if (typeof next === 'function') {
            return next();
         } else {
            throw NextFnException.invoke();
         }
      }.bind(this);
   }
}
