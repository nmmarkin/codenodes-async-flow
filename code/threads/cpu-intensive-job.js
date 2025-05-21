import crypto from "node:crypto";
import { performance } from "node:perf_hooks";

const ITERATIONS = 32;

main();

async function main() {
  const start = performance.now();
  const { onDone, getStats } = measureExecution(start);

  for (let i = 0; i < ITERATIONS; i += 1) {
    crypto.pbkdf2("secret", "salt", 100000, 64, "sha512", onDone);
  }
  const stats = await getStats();

  console.log(JSON.stringify(stats));
}

function measureExecution(start) {
  let iteration = 0;
  const allDurations = [];
  const [waiter, resolve, reject] = ((l) => [new Promise((r, j) => l.push(r, j)), ...l])([]);
  return {
    onDone: (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = performance.now() - start;
      allDurations.push(duration);
      iteration += 1;

      if (iteration === ITERATIONS) {
        resolve(result);
      }
    },
    waiter,
    getStats: async () => {
      await waiter;
      const avg = allDurations.reduce((s, v) => s + v, 0) / allDurations.length;
      const sorted = [...allDurations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      return { avg, median, allDurations };
    }
  }
}