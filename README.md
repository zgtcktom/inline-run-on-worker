# Inline Web Worker
> Utility function to create a web worker with arguments and async iterators

## Installation
```
npm i inline-run-on-worker
```
For browser, download runOnWorker.min.js.

## Syntax
```
runOnWorker(fn, args, messages);
```
## Parameters

### fn : function
A function to run on worker. All variables should be within function scope.

### args : any[] = []
An array of arguments. Must be a valid input invoking structuredClone().

### messages : any[iterator] = []
Either an iterable or async iterable.

## Return value
The returned value is a promise resolving the return value of the function

## Examples

### With args
No need to handle postMessage and onmessage. Useful when args is ready.
```
runOnWorker((a, b) => {
    return a + b;
}, [12, 43]).then(console.log);
```
> 55

### With messages
Useful when data is not ready yet (e.g.: ReadableStream read(), chunked fetch()).
```
let asyncGenerator = async function*() {
    for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        yield i;
    }
};
runOnWorker(async (start, messages) => {
    let sum = start;
    for await (const message of messages) {
        sum += message;
    }
    return sum;
}, [-1], asyncGenerator()).then(console.log);
```
> 44

### Why?
No
```
runOnWorker(() => {
    return 'why not?';
}).then(console.log);
```
> why not?

### Buggy
Load url as worker. Very limited use on webpack.
```
let url = new URL('./sum.js', import.meta.url).href;
runOnWorker(url, [65, 3]).then(console.log);
```
> 68