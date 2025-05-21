import { Duplex } from "node:stream";
import { setTimeout } from "node:timers/promises";
import _ from "lodash";
import pRetry from "p-retry";

const defer = () => {
  const controls = {};
  const promise = new Promise((resolve, reject) => {
    controls.resolve = resolve;
    controls.reject = reject;
  });
  return { promise, ...controls };
};

class MultiPortDuplex extends Duplex {
  constructor(opts = {}) {
    super({ ...opts, objectMode: true });

    this.ports = [];                           // [{ port, number, busy, ackResolvers }]
    this.waitingForPort = [];                  // [resolve]
    this.msgId = 0;                            // global id counter
    this.ackTimeout = opts.ackTimeout || 5000; // ack timeout in ms
    this.retries = opts.retries || 3;          // number of retries
    this.pendingRetries = new Map();           // { id: Promise }
    this.pendingMessages = new Map();          // { id: Promise }
  }

  /* ----------------------- PUBLIC API ----------------------- */

  addPort(port) {
    const state = {
      number: this.ports.length + 1,
      port,
      busy: false,
      ackResolvers: new Map()
    };

    // one listener per port
    port.on("message", msg => {
      if (msg?.type === "ack") {
        const resolve = state.ackResolvers.get(msg.id);
        if (resolve) {
          state.ackResolvers.delete(msg.id);
          state.busy = false;
          resolve();                 // finish the write that’s waiting
          this.#releasePort(state);  // wake the next writer
        }
        this.push(msg.result);       // readable side, one result per one write -> no overflow
      }
    });

    this.ports.push(state);
    this.#releasePort(state);        // in case someone is waiting already

    return state.number;
  }

  clearPort(number) {
    const index = this.ports.findIndex(s => s?.number === number);
    if (index > -1) {
      this.ports[index] = null;
    }
  }

  /* ----------------------- Writable side -------------------- */

  async _write(chunk, _enc, done) {
    const doneOnce = _.once(done);
    
    const id = ++this.msgId;

    // Supposing batch-like writes with retry side effects (composition out of scope)

    try {
      this.pendingMessages.set(id, defer());

      const ensurePendingRetriesResolved = _.once(this.#ensurePendingRetriesResolved.bind(this));

      const throwIfAckTimeout = async (ack) => {
        const isAckTimeout = await Promise.race([
          setTimeout(this.ackTimeout, true),
          ack.then(() => false)
        ]);
        
        if (isAckTimeout) {
          // Fail fast vs retry vs save for later
          throw new Error(`Ack timeout for message ${id}`);
        }
        const pendingRetryControls = this.pendingRetries.get(id);
        pendingRetryControls && pendingRetryControls.resolve();
      };
      
      // If could not get ack in time, retry
      await pRetry(async () => {
        // Should not hold up retries
        await ensurePendingRetriesResolved(id);

        // console.log(`Getting available port for message ${id}`, this.ports.map(s => (s && { number: s?.number, busy: s?.busy, ackResolvers: s?.ackResolvers && Array.from(s?.ackResolvers.keys()) })));

        const portState = await this.#getAvailablePort();   // wait for port
  
        console.log(`Posting message ${id} to port ${portState.number}`);
        portState.port.postMessage({ type: "data", id, payload: chunk });

        doneOnce();
  
        const ack = new Promise(resolve => portState.ackResolvers.set(id, resolve));

        await throwIfAckTimeout(ack);

        const pendingMessageControls = this.pendingMessages.get(id);
        pendingMessageControls && pendingMessageControls.resolve();
        this.pendingMessages.delete(id);

        console.log(`Message ${id} processed by port ${portState.number}`);
      }, {
        retries: this.retries,
        onFailedAttempt: (error) => {
          if (error && error.retriesLeft > 0) {
            this.pendingRetries.set(id, defer());
          }
        }
      });
    } catch (error) {
      const pendingMessageControls = this.pendingMessages.get(id);
      pendingMessageControls && pendingMessageControls.resolve(error);
      console.log("Error during write", error);
      doneOnce(error);
    }
  }

  /* ----------------------- Readable side -------------------- */

  _read() { /* no-op: pushes happen in the port listener */ }

  async _final(done) {
    try {
      console.log("Finalizing");

      await this.#ensurePendingMessagesResolved(); // do not send end events if there are pending messages
      
      this.push(null);
      
      done();
    } catch (error) {
      done(error);
    } finally {
      for (const portState of this.ports.filter(Boolean)) {
        portState.port.postMessage({ type: "end" });
      }
    }
  }

  async _destroy(error, done) {
    console.log("Destroying");
    
    for (const portState of this.ports.filter(Boolean)) {
      portState.port.postMessage({ type: "end" });
      this.clearPort(portState.number);
    }
    
    done(error);
  }


  /* ----------------------- Internals ------------------------ */

  #getAvailablePort() {
    const freePort = this.ports.filter(Boolean).find(p => !p.busy);
    if (freePort) {
      freePort.busy = true;
      return Promise.resolve(freePort);
    };

    return new Promise(resolve => this.waitingForPort.push(resolve));
  }

  #releasePort(state) {
    if (!state.busy && this.waitingForPort.length) {
      const next = this.waitingForPort.shift();
      state.busy = true;
      next(state);                   // release waiter of available ports
    }
  }

  async #ensurePendingRetriesResolved(id) {
    // console.log("Ensuring pending retries resolved", id, this.pendingRetries);
    const results = await Promise.all(Array.from(this.pendingRetries.values()).map(d => d.promise));
    const error = results.find(r => r instanceof Error);
    if (error) {
      throw error;
    }
    this.pendingRetries.clear();
  }

  async #ensurePendingMessagesResolved() {
    const results = await Promise.all(Array.from(this.pendingMessages.values()).map(d => d.promise));
    const error = results.find(r => r instanceof Error);
    if (error) {
      throw error;
    }
    this.pendingMessages.clear();
  }
}

export { MultiPortDuplex };
