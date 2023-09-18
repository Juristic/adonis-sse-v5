# SSE Plugin for AdonisJS v5

This plugin is an updated version of adonis-sse from the following repository https://github.com/stitchng/adonis-sse 

## Getting Started

```
npm i @isimisi/adonis-sse
```
```
yarn add @isimisi/adonis-sse
```

## Configure
```sh
node ace configure @isimisi/adonis-sse
```

## Register

Register the following middleware inside `start/kernel.js`

 ```ts
 Server.middleware.registeredNamed({
    sse: () => import ("@ioc:isimisi/SSE")
 })
 ```

 > or optionally register it as a gloabl middleware

## Usage

```ts
Route.get("/sse", ({ sse }) => {
    sse.send({ message: "To the moon!🚀" });
}).middleware(["sse"])
```

### Connecting in React
```ts
import { useEffect, useState } from "react";

function MyComponent() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        const eventSource = new EventSource("http://localhost:3333/sse");

        eventSource.addEventListener("message", (event) => {
            const data = JSON.parse(event.data); // { message: "To the moon!🚀" }
            setMessage(data.message);
        }, false)

        return () => eventSource.close();
    }, [])

    return(
        <div>{message}</div>
    )
}

export default MyComponent
```
