let asyncWorkerFunc = async (__function__) => {
    let messages = {
        async *[Symbol.asyncIterator]() {
            for (;;) {
                let { done, value } = await new Promise((resolve, reject) => {
                    onmessage = (event) => {
                        resolve(event.data);
                    };
                });
                // console.log(done, value);
                if (done) break;
                yield value;
            }
        }
    };

    onmessage = async (event) => {
        let args = event.data;
        postMessage(await __function__(...args, messages));
        close();
    };
};

let workerFunc = (__function__) => {
    onmessage = (event) => {
        let args = event.data;
        postMessage(__function__(...args));
        close();
    };
};

let URLWorkerFunc = (src, args) => {
    // console.log(url, args);
    importScripts(src);
    return main(...args);
};

let asyncURLWorkerFunc = async (src, args, messages) => {
    // console.log(src, args);
    importScripts(src);
    return await main(...args, messages);
};

export default async function runOnWorker(src, args = [], messages = 0) {
    // experimental
    // inline function worker
    // doesn't work well with imports and exports

    if (typeof src == 'string') {
        // highly not reliable
        if (messages) {
            return runOnWorker(asyncURLWorkerFunc, [src, args], messages);
        }
        return runOnWorker(URLWorkerFunc, [src, args]);
    }

    let worker;
    if (typeof src == 'function') {
        let func = messages ? asyncWorkerFunc : workerFunc;
        let code = '(' + func.toString() + ')(' + src.toString() + ');';
        // console.log(code);
        let blob = new Blob([code], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
    }

    worker.postMessage(args);

    if (messages) {
        for await (let message of messages) {
            worker.postMessage({ done: false, value: message });
        }
        worker.postMessage({ done: true, value: null });
    }

    return new Promise((resolve, reject) => {
        worker.onmessage = (event) => {
            resolve(event.data);
            worker.postMessage('asd');
        };

        worker.onerror = (error) => {
            reject(error);
        };
    })
}