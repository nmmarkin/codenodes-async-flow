import { Worker, isMainThread } from "node:worker_threads";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { Writable, pipeline } from "node:stream";
import path from "node:path";
import pRetry from "p-retry";
import { MultiPortDuplex } from "./MultiPortDuplex.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ITERATIONS_NUMBER = 6;
const PROCESSING_TIME = 3000;

const WORKERS_NUMBER = 4;
const WORKER_PATH = `${__dirname}/worker.js`;

if (!isMainThread) {
  throw new Error("This script must be run in the main thread");
}

const multiPortStream = new MultiPortDuplex();

main();

async function main() {
  const interval = setInterval(() => {
    global.iteration = global.iteration == null ? 1 : ++global.iteration;
    console.log("Iteration", global.iteration);
    if (global.iteration > ITERATIONS_NUMBER) {
      multiPortStream.end(); // end of stream does not mean end of processing
      clearInterval(interval);
      return;
    }
    const result = multiPortStream.write(`${Math.random()}`);
    if (!result) {
      console.log("Unable to write");
      multiPortStream.end(); // end of stream does not mean end of processing
      clearInterval(interval);
    }
  }, 1000);

  multiPortStream.on("error", (error) => console.log("Incoming stream error", error));
  multiPortStream.on("destroy", (error) => console.log("Incoming stream destroyed", error));
  multiPortStream.on("finish", () => console.log("Incoming stream finished"));

  pipeline(
    multiPortStream,
    new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        console.log("Writing output:", chunk);
        callback();
      }
    }),
    (error) => {
      if (error) {
        console.error("Pipeline error", error);
      } else {
        console.log("Pipeline finished");
      }
    }
  );

  console.log(`Will process ${ITERATIONS_NUMBER} items, each ${(PROCESSING_TIME / 1000).toFixed(2)} seconds, serial total time ${(PROCESSING_TIME * ITERATIONS_NUMBER / 1000).toFixed(2)} seconds`);
  const { time, failures } = await runWithDynamicWorkers(WORKERS_NUMBER);
  console.log(`Total Time: ${time} ms${failures.length ? `, finished with ${failures.length} failed workers` : ""}.`);
}

async function runWithDynamicWorkers(threadCount) {
  const start = performance.now();

  async function spawnWorker(workerId) {
    if (multiPortStream.destroyed || multiPortStream.writableDestroyed || multiPortStream.readableDestroyed) {
      throw new Error(`Stream has been destroyed, skipping worker ${workerId}`);
    }

    console.log("Starting worker", workerId);

    const worker = new Worker(WORKER_PATH);
    const { port1: parentPort, port2: workerPort } = new MessageChannel();

    const portNumber = multiPortStream.addPort(workerPort);
    worker.postMessage({ port: parentPort, workerId, number: portNumber }, [parentPort]);

    await new Promise((resolve, reject) => {
      worker.on("error", (error) => {
        multiPortStream.clearPort(portNumber);
        reject(error);
      });
      worker.on("exit", (code) => {
        if (code !== 0) {
          multiPortStream.clearPort(portNumber);
          reject(new Error(`Worker ${workerId} exited with code ${code}`));
          return;
        }
        resolve(performance.now() - start);
      });
    });
  }

  const withRetry = (procedure, index) => pRetry(
    procedure.bind(null, index + 1),
    {
      retries: 5,
      shouldRetry: () => {
        const isDestroyed = multiPortStream.destroyed || multiPortStream.writableDestroyed || multiPortStream.readableDestroyed;
        console.log("Deciding if to retry", !isDestroyed);
        if (isDestroyed) {
          return false;
        }
        return true;
      },
      onFailedAttempt: (error) => {
        console.log(`Worker ${index + 1} failed attempt`, error);
      }
    }
  );

  const workers = Array(threadCount).fill(spawnWorker)
    .map(withRetry);

  const results = await Promise.allSettled(workers);
  const failures = results.filter(r => r.status === "rejected");

  return { time: performance.now() - start, failures };
}
