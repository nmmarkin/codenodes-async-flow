import { parentPort } from "node:worker_threads";
import { setTimeout } from "node:timers/promises";
import { performance } from "node:perf_hooks";

const PROCESSING_TIME = 3000;

const start = performance.now();

parentPort.once("message", ({ port, workerId, number }) => {
  console.log("  ", `[${workerId}]`, performance.now() - start, `Message channel received ${number}.`);

  const pending = new Map();

  port.on("message", async (msg) => {
    try {
      console.log("  ", `[${workerId}:${number}]`, performance.now() - start, ">", msg);

      if (msg.type === "data") {
        const processMessage = async (message) => {
          await setTimeout(PROCESSING_TIME);
          if (Math.random() > 0.5) {
            // throw new Error("Random failure");
          }
          const result = { payload: (message.payload * 1000).toFixed(2) };
          port.postMessage({ id: message.id, type: "ack", result });
          console.log("  ", `[${workerId}:${number}]`, performance.now() - start, "<", message.id, result.payload);
          pending.delete(message.id);
        }
        const processor = processMessage(msg);
        pending.set(msg.id, processor);
        await processor;
        return;
      }
      if (msg.type === "end") {
        await Promise.all(pending.values());
        process.exit(0);
      }
    } catch (error) {
      pending.delete(msg.id);
      console.log("  ", `[${workerId}:${number}]`, performance.now() - start, `Error caught`, error.message);
      throw error;
    }
  });
});