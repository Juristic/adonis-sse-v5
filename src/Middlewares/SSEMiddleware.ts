import { ApplicationContract } from '@ioc:Adonis/Core/Application';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { Exception, inject } from '@adonisjs/core/build/standalone';
import { EventStreamContract } from '@ioc:isimisi/SSE';
import SSEException from '../Exceptions/SSEException';
import InvalidMethodException from '../Exceptions/InvalidMethodException';

@inject(['Adonis/Core/Application'])
export class SSEMiddleware {
   constructor(
      protected app: ApplicationContract,
      protected stream: InstanceType<EventStreamContract>
   ) {}

   public async handle(
      { request, sse }: HttpContextContract,
      next: () => Promise<void>
   ) {
      try {
         const middlewareFunc = await this.stream.init(sse);
         await middlewareFunc(request.request, request.response, next);
      } catch (err) {
         if (err instanceof Exception) {
            throw err;
         } else if (err instanceof Error) {
            if (
               err.message.includes('source.getMaxListeners is not a function')
            ) {
               throw InvalidMethodException.invoke();
            } else {
               throw new Exception(err.message, 500);
            }
         } else {
            throw SSEException.invoke();
         }
      }
   }
}
