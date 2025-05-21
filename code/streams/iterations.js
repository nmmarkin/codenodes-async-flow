import { Readable, Transform } from "node:stream";
import { setTimeout } from "node:timers/promises";
import { performance } from "node:perf_hooks";

const READ_ITERATIONS = 3;
const EVENT_DATA_LENGTH = 1;

let iteration = 0;
const start = performance.now();

const readable = Readable({
  objectMode: true,
  read() {
    iteration++;
    if (iteration > READ_ITERATIONS) {
      readable.push(null);
      return;
    }

    setTimeout(100).then(() => {
      const item = { data: Array(EVENT_DATA_LENGTH).fill(iteration) };
      readable.push(item);
      console.log(performance.now() - start, " > pushing to input", item.data.at(0), item.data.length);
    });
  }
});

const writable = Transform({
  objectMode: true,
  transform(item, encoding, done) {
    done(null, item);
  }
});

readable.on("error", console.log.bind(null, "readable"));
writable.on("error", console.log.bind(null, "writable"));

readable.on("end", console.log.bind(null, "input end"));
writable.on("finish", console.log.bind(null, "output finished"));

// setTimeout(1000).then(() => console.log("global timeout"));

main(readable, writable);

async function main(input, output) {
  const processStream = async () => {
    for await (const item of input) {
      console.log("  ", performance.now() - start, "processing input", item.data.at(0), item.data.length);
      await setTimeout(3000);
      const processed = { ...item, data: item.data.map(n => n * 2) };
      // console.log("    ", performance.now() - start, "processed ", processed.data.at(0), processed.data.length);
      output.write(processed);
    }

    output.end();

    console.log("output writable buffer size", output._writableState.length);
    console.log("output readable buffer size", output._readableState.length);
  };
  await processStream();
  // setImmediate(processStream);

  const readProcessed = async () => {
    for await (const item of output) {
      console.log("output readable buffer size", output._readableState.length);
      console.log(performance.now() - start, " < reading from output:", item.data.at(0), item.data.length);
    }

    console.log("Done");
  };
  await readProcessed();
  // setImmediate(readProcessed);
}
