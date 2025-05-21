import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const poolSizes = [1, 2, 4, 8, 16, 32];
const dataset = {
  axis: {
    x: { type: "linear", title: { display: true, text: "Number of iterations" } },
    y: { type: "linear", title: { display: true, text: "Duration (ms)" } },
  },
  points: [],
};

for (const size of poolSizes) {
  console.log(`Running with UV_THREADPOOL_SIZE=${size}...`);
  const res = spawnSync("node", [path.join(__dirname, "cpu-intensive-job.js")], {
    env: { ...process.env, UV_THREADPOOL_SIZE: size.toString() },
    encoding: "utf-8"
  });

  if (res.error) {
    console.error(`Error with pool size ${size}:`, res.error);
    continue;
  }

  try {
    const parsed = JSON.parse(res.stdout.trim());

    // console.log(parsed.allDurations);
    console.log(`Avg: ${parsed.avg}, Median: ${parsed.median}`);

    dataset.points.push({
      label: `Threadpool: ${size} (avg: ${Math.round(parsed.avg)}ms)`,
      data: parsed.allDurations.map((duration, index) => ({ x: index, y: duration })),
    });
  } catch (err) {
    console.error(`Failed to parse output for size ${size}:`, res.stdout, res.error);
  }
}

fs.writeFileSync("./public/points-threadpool.json", JSON.stringify(dataset, null, 2));
console.log("✅ Saved");
