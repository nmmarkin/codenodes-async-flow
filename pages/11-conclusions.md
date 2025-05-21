# Conclusions

- **Cancellation must be explicit**  
  Use AbortController/AbortSignal, clearTimeout, or custom flags, without them async operations will keep running even after the result is no longer needed.
- **Retries only work with idempotent steps**  
  Wrap awaits in a retry loop or library (p-retry) and make sure the underlying action can safely repeat.
- **Retention/timeout guards stop leaks**  
  Always bound the lifetime of resources (DB handles, sockets) with setTimeout, AbortSignal.timeout(), or finally blocks to avoid piling up dangling work.
- **Parallelisation hides latency, not bugs**  
  Spawning workers/promises can speed throughput but doesn’t fix race-conditions, back-pressure, or memory growth - flow control and resource limits still matter.
- **Supervision loops beat ad-hoc fixes**  
  A dedicated orchestrator (queue consumer, cron, BullMQ, or your own supervisor loop) that cancels stale jobs, retries transient failures and caps concurrency keeps an async system healthy.