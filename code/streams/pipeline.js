import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import { parseArgs } from "node:util";

const start = performance.now();

const argsSchema = {
  objectMode: { type: "boolean", short: "o", default: false },

  readableHWM: { type: "string", short: "r", default: "undefined" },
  writableHWM: { type: "string", short: "w", default: "undefined" },

  chunksPerRead: { type: "string", short: "c", default: "1" },
  numberOfReads: { type: "string", short: "n", default: "35" },
  firstReadAfterDrainDelay: { type: "string", default: "0" },
};

const args = parseArgs({ args: process.env.argv, options: argsSchema });

const objectMode = args.values.objectMode ? true : false;
const readableHWM = args.values.readableHWM === "undefined" ? undefined : Number(args.values.readableHWM);
const writableHWM = args.values.writableHWM === "undefined" ? undefined : Number(args.values.writableHWM);
const chunksPerRead = Number(args.values.chunksPerRead);
const numberOfReads = Number(args.values.numberOfReads);
const firstReadAfterDrainDelay = Number(args.values.firstReadAfterDrainDelay);

console.log("Params:", { objectMode, chunksPerRead, readableHWM, writableHWM, numberOfReads, firstReadAfterDrainDelay }, "\n");

const get1MEvent = (n) => ({ number: n, data: [...Array(1024 * 1024)].map((_v, i) => i) });
const get1KString = (n) => [`0000000000${n}`.slice(-10), ...Array(1014)].join();

const readable = new Readable({
  objectMode,
  highWaterMark: readableHWM,
  encoding: objectMode ? undefined : "utf-8",
  async read(size) {
    this.iteration = this.iteration ? ++this.iteration : 1;
    this.iterationsAfterDrain = typeof this.iterationsAfterDrain === "number" && ++this.iterationsAfterDrain;

    const chunk = objectMode
      ? get1MEvent(this.iteration)
      : get1KString(this.iteration);

    console.log(
      performance.now() - start,
      this.iteration,
      this.iterationsAfterDrain,
      "reading",
      size,
      "got",
      objectMode ? chunksPerRead : chunksPerRead * chunk.length,
      "current buffer",
      this._readableState.length
    );

    await setTimeout(100);
    if (this.iteration > numberOfReads) {
      this.push(null);
      return;
    }

    if (firstReadAfterDrainDelay && this.iterationsAfterDrain === 1) {
      await setTimeout(firstReadAfterDrainDelay);
    }

    for (let i = 0; i < chunksPerRead; i += 1) {
      this.push(chunk);
    }
  }
});

readable.on("pause", () => console.log("  -- readable pause --  "));
readable.on("resume", () => console.log("  -- readable resume --  "));
readable.on("drain", () => console.log("  -- readable drain --  "));
readable.on("end", () => console.log("  -- readable end --  "));

// setInterval(() => {
//   readable.push(get1MEvent())
//   console.log(readable.readableLength);
// }, 100)

async function* transform(source) {
  for await (const event of source) {
    const processedEvent = await processChunk(event, "object", start);

    yield processedEvent;
  }
}

const regularTransform = new Transform({
  objectMode,
  encoding: objectMode ? undefined : "utf-8",
  highWaterMark: writableHWM,
  async transform(chunk, encoding, next) {
    const effectiveEncoding = objectMode ? null : encoding;
    const processedChunk = await processChunk(chunk, effectiveEncoding, start);
    this.push(processedChunk);
    next();
  }
});

regularTransform.on("resume", () => console.log("  -- transform resume --  "));
regularTransform.on("drain", () => {
  readable.iterationsAfterDrain = 0;
  console.log("  -- transform drain --  ");
});
regularTransform.on("end", () => console.log("  -- transform end --  "));


pipeline(
  readable,
  // transform,
  // Transform.from(transform),
  regularTransform,
  process.stdout
)

async function processChunk(chunk, encoding, start) {
  const isBuffer = chunk instanceof Buffer;
  const isString = typeof chunk === "string";
  const isObject = !isBuffer && typeof chunk === "object";

  const meta = [
    isBuffer && { type: "buffer", size: chunk.length, number: Number(chunk.subarray(0, 10)) },
    isString && { type: "string", size: chunk.length, number: Number(chunk.slice(0, 10)) },
    isObject && { type: "object", size: chunk.data.length, number: chunk.number }
  ].find(Boolean);

  console.log(performance.now() - start, "incoming", encoding, meta.size, meta.number);

  await setTimeout(1000);

  return " > " + JSON.stringify({ ...meta, time: performance.now() - start }) + "\n";
}
