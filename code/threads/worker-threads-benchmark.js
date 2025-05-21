import { Worker, isMainThread, parentPort } from "node:worker_threads";
import crypto from "node:crypto";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);

const DATA_SIZE = 10 * 1024 * 1024; // 10 MB
const TOTAL_TASKS = 32;

function generateDataSet() {
  return Array.from({ length: TOTAL_TASKS }, () =>
    crypto.randomBytes(DATA_SIZE)
  );
}

function hashData(buffer) {
  crypto.createHash("sha256").update(buffer).digest();
}

if (isMainThread) {
  const threadCounts = [1, 2, 4, 8, 16, 32];
  const dataSet = generateDataSet();

  const dataset = {
    axis: {
      x: { type: "linear", title: { display: true, text: "Number of threads" } },
      y: { type: "linear", title: { display: true, text: "Duration (ms)" } },
    },
    points: [],
  };

  main();

  async function main() {
    console.log(`Running on ${os.cpus().length} logical CPUs`);
    console.log(`Hashing ${DATA_SIZE} bytes * ${TOTAL_TASKS} = ${(DATA_SIZE * TOTAL_TASKS / 1024 / 1024).toFixed(2)} MB total`);

    for (const count of threadCounts) {
      const time = await runWithDynamicWorkers(count);
      console.log(`Threads: ${count} → Total Time: ${time} ms`);

      dataset.points.push({
        label: `Threads: ${count}`,
        data: [{ x: count, y: time }],
      });
    }

    fs.writeFileSync("./public/points-workers.json", JSON.stringify(dataset, null, 2));
    console.log("✅ Saved");
  }

  async function runWithDynamicWorkers(threadCount) {
    let taskIndex = 0;
    let completed = 0;

    const start = performance.now();

    return new Promise((resolve, reject) => {
      const workers = [];

      function spawnWorker() {
        const worker = new Worker(__filename);

        worker.on("message", (msg) => {
          if (msg === "done") {
            completed++;
            if (taskIndex < TOTAL_TASKS) {
              const buffer = Buffer.from(dataSet[taskIndex]);
              worker.postMessage(buffer, [buffer.buffer]); // Transfer buffer
              taskIndex++;
            } else {
              worker.postMessage({ done: true });
            }

            if (completed === TOTAL_TASKS) {
              resolve((performance.now() - start).toFixed(2));
              workers.forEach((w) => w.terminate());
            }
          }
        });

        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker exited with code ${code}`));
          }
        });

        // Start worker with first task
        if (taskIndex < TOTAL_TASKS) {
          const buffer = Buffer.from(dataSet[taskIndex]);
          // if (buffer.byteLength === 0) {
          //   console.log("[WARN] Detached buffer", taskIndex);
          // }
          worker.postMessage(buffer, [buffer.buffer]); // Transfer buffer
          taskIndex++;
        }

        workers.push(worker);
      }

      for (let i = 0; i < threadCount; i++) {
        spawnWorker();
      }
    });
  }
} else {
  parentPort.on("message", (msg) => {
    if (msg && msg.done) {
      process.exit(0);
    } else if (msg instanceof Uint8Array) {
      hashData(msg);
      parentPort.postMessage("done");
    }
  });
}
