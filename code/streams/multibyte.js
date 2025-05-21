/**
 * Output of the script:
 *
 * € byte representation: <Buffer e2 82 ac>
 *
 * Chunk size:     16384
 * Chunk bytes:    414141 ... 4141e2
 * Chunk contents: A A A  ... A A �
 *
 * Chunk size:     16384
 * Chunk bytes:    82ac41 ... 414141
 * Chunk contents: � � A  ... A A A
 *
 * Chunk size:     16384
 * Chunk bytes:    41e282 ... 414141
 * Chunk contents: A €    ... A A A
 *
 * Chunk size:     6
 * Chunk bytes:    414141e282ac
 * Chunk contents: A A A €
 *
 * Pipeline succeeded
 */

import fs from "node:fs";
import path from "node:path";
import { Transform, pipeline } from "node:stream";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_NAME = "multibyte-text.txt";
const FILE_PATH = path.join(__dirname, FILE_NAME);

const ENCODING = "utf8"

main()

async function main() {
  console.log("€ byte representation:", Buffer.from("€"));

  await ensureTextFileIsPresent(FILE_PATH);

  const stream = fs.createReadStream(FILE_PATH, {
    encoding: null,
    // encoding: ENCODING, // Comment out to break multibyte characters
    highWaterMark: 16384,
  });

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      console.log("\nChunk size:    ", chunk.length);
      console.log("Chunk bytes:   ", printBytes(chunk));
      console.log("Chunk contents:", printContents(chunk.toString()));
      callback(null, String(chunk.length) + "\n");
    }
  });

  pipeline(
    stream,
    transform,
    // process.stdout,
    (err) => {
      if (err) {
        console.error("\nPipeline failed", err);
      } else {
        console.log("\nPipeline succeeded");
      }
    }
  );
}

// Auxiliary util functions
async function ensureTextFileIsPresent(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Creating ${path.basename(filePath)}...`);
    const stream = fs.createWriteStream(filePath, {
      flags: "w",
      encoding: "utf8"
    });

    const CHUNK_SIZE = 16384; // 16KB (default highWaterMark value for regular streams)
    const repeatBlock = "A".repeat(CHUNK_SIZE - 1); // 1 byte less than chunk
    const euro = "€"; // 3-byte UTF-8 char (0xE2 0x82 0xAC)

    // Write pattern that should cause euro to land on chunk boundary
    stream.write(repeatBlock + euro);
    stream.write(repeatBlock + euro);
    stream.write(repeatBlock + euro);
    stream.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }
}

function printBytes(bytes, limit = 3) {
  return bytes.length > limit * 2
    ? [
        bytes.slice(0, limit).toString("hex"),
        bytes.slice(-1 * limit).toString("hex")
      ].join(" ... ")
    : bytes.toString("hex");
}

function printContents(contents, limit = 3) {
  const keepSpacing = (str, maxChars) => {
    const spaced = str.split("").flatMap(c => {
      const bytesInChar = c === "�" ? 1 : Buffer.byteLength(c, ENCODING);
      return bytesInChar > 1 ? [c, ...Array(bytesInChar - 1).fill("")] : [c];
    });
    const rightPadding = (s, l) => `${s}${" ".repeat(l * 2)}`.slice(0, l * 2);
    return rightPadding(spaced.slice(0, maxChars).join(" "), maxChars);
  }
  return contents.length > limit * 2
    ? [
        keepSpacing(contents.slice(0, limit), limit),
        keepSpacing(contents.slice(-1 * limit), limit)
      ].join(" ... ")
    : keepSpacing(contents, limit * 2);
}