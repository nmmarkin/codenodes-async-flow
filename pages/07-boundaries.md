# Boundaries

| **Layer**         | **What Causes Boundary**                  | **Symptom**                                 |
| ----------------- | ----------------------------------------- | ------------------------------------------- |
| Event loop        | Long sync tasks, promise churn            | Laggy timers, delayed I/O                   |
| Streams           | Uncontrolled flow or missing backpressure | Memory spikes, stream stalls                |
| Thread pool       | `libuv` pool overload or task saturation  | CPU pegging, unresponsive process           |
| Worker threads    | Oversubscription, contention              | Diminishing returns, high context switching |
| Queue/concurrency | No concurrency limit, retry storms        | API rate limits hit, memory overuse         |
| Network I/O       | Slow clients or servers                   | Head-of-line blocking, growing buffers      |
| External services | Blocking APIs, poor retry logic           | Latency chains, inconsistent performance    |
