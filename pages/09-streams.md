# Streams

<div class="swap-container">
  <div v-click-hide="1">
    <h6>Use cases</h6>
    <p>Use a stream whenever you would otherwise build “read → store whole payload in RAM → process → write” but any of these apply:</p>
    <ul>
      <li>Payload can be arbitrarily large or unbounded (log tail, live video).</li>
      <li>Producer and consumer run at different speeds (disk ↔ network).</li>
      <li>You want composition—chain gzip, encrypt, hash, report progress without gluing libraries together manually.</li>
      <li>You want to process data incrementally, as it arrives.</li>
    </ul>
  </div>
  <div v-click="1">
    <h6>Use cases</h6>
    <ul>
      <li><b>File & storage I/O: </b> Large-file copy/move, incremental backup/upload to S3 / GCS, on-the-fly gzip/brotli/tar, file splitting/concatenation, hashed or encrypted archival.</li>
      <li><b>Network transport & proxying: </b> Download streaming (videos, PDFs), reverse-proxy piping (req → https.request → res), SSE/chunked responses, WebSocket frames, multipart upload parsing.</li>
      <li><b>Live & batched data pipelines: </b> Log tail → filter → Kafka/ClickHouse, CSV/JSONL → database bulk-load, sensor/IoT telemetry, financial tick decoding, ETL graphs (source → transform → sink).</li>
      <li><b>Media streaming & transformation: </b> HLS/DASH segment serving, live webcam/audio relay, on-edge image resize (sharp), game-replay capture.</li>
      <li><b>Security & crypto flows: </b> AES-GCM encrypt/decrypt streams, SHA-256 hashing of huge assets, TLS plaintext duplexes for custom piping.</li>
      <li><b>CLI / Dev-tool utilities: </b> Unix-style stdin→stdout filters, progress-bar byte counters, code-gen/transpile pipelines.</li> 
    </ul>
  </div>
  <div v-click="2">
    <a href="https://nodejs.org/en/learn/modules/backpressuring-in-streams#lifecycle-of-pipe" target="_blank">🔗 Node.js Streams Pipe Lifecycle</a>
    <div class="scroll-container">
```
                                                     +===================+
                         x-->  Piping functions   +-->   src.pipe(dest)  |
                         x     are set up during     |===================|
                         x     the .pipe method.     |  Event callbacks  |
  +===============+      x                           |-------------------|
  |   Your Data   |      x     They exist outside    | .on('close', cb)  |
  +=======+=======+      x     the data flow, but    | .on('data', cb)   |
          |              x     importantly attach    | .on('drain', cb)  |
          |              x     events, and their     | .on('unpipe', cb) |
+---------v---------+    x     respective callbacks. | .on('error', cb)  |
|  Readable Stream  +----+                           | .on('finish', cb) |
+-^-------^-------^-+    |                           | .on('end', cb)    |
  ^       |       ^      |                           +-------------------+
  |       |       |      |
  |       ^       |      |
  ^       ^       ^      |    +-------------------+         +=================+
  ^       |       ^      +---->  Writable Stream  +--------->  .write(chunk)  |
  |       |       |           +-------------------+         +=======+=========+
  |       |       |                                                 |
  |       ^       |                              +------------------v---------+
  ^       |       +-> if (!chunk)                |    Is this chunk too big?  |
  ^       |       |     emit .end();             |    Is the queue busy?      |
  |       |       +-> else                       +-------+----------------+---+
  |       ^       |     emit .write();                   |                |
  |       ^       ^                                   +--v---+        +---v---+
  |       |       ^-----------------------------------<  No  |        |  Yes  |
  ^       |                                           +------+        +---v---+
  ^       |                                                               |
  |       ^               emit .pause();          +=================+     |
  |       ^---------------^-----------------------+  return false;  <-----+---+
  |                                               +=================+         |
  |                                                                           |
  ^            when queue is empty     +============+                         |
  ^------------^-----------------------<  Buffering |                         |
               |                       |============|                         |
               +> emit .drain();       |  ^Buffer^  |                         |
               +> emit .resume();      +------------+                         |
                                       |  ^Buffer^  |                         |
                                       +------------+   add chunk to queue    |
                                       |            <---^---------------------<
                                       +============+
```
    </div>
  </div>
  <div v-click="3">
    <h6>Live demo</h6>
    <ul>
      <li>
        <strong><code>/code/streams/pipeline.js</code>: Exploring the stream pipeline lifecycle</strong>
        <ul>
          <li>
            <code>objectMode</code> - processing data in batches
          </li>
          <li>
            <code>highWaterMark</code> - controlling the buffer size for readable and writable streams
          </li>
          <li>
            <code>firstReadAfterDrainDelay</code> - effect of artificial delay on back-pressure
          </li>
          <li>
            Stacking pipeline of streams and generators
          </li>
        </ul>
      </li>
      <li>
        <strong><code>/code/streams/multibyte.js</code>: Handling multibyte edge cases</strong>
        <ul>
          <li>
            <code>encoding</code> - avoid multibyte character corruption
          </li>
          <li>
            Workable example of splitted character during reading from a file
          </li>
        </ul>
      </li>
      <li>
        <strong><code>/code/streams/iterations.js</code>: Processing data in batches</strong>
        <ul>
          <li>
            A way to process a stream without pipelining
          </li>
        </ul>
      </li>
    </ul>
  </div>
</div>

<style>
.swap-container .slidev-vclick-hidden, .swap-container .slidev-vclick-prior  {
  display: none;
}

.swap-container .scroll-container {
  height: 400px;
  overflow-y: auto;
}
</style>