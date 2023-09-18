The Package `@isimisi/adonis-sse` has been successfully configured. Before you begin please register the below named Middleware inside your `start/kernel.ts` file.

 ```ts
 Server.middleware.registeredNamed({
    sse: () => import ("@ioc:isimisi/SSE")
 })
 ```