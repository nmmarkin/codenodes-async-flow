# Scenario examples

| **Scenario**                                | **Parallelism** | **Why**                                 |
| ------------------------------------------- | --------------- | --------------------------------------- |
| Stateless transformations (e.g., map)       | ✅ Safe          | Each item is isolated                  |
| Writing to shared file or DB row            | ❌ Unsafe        | Risk of race conditions, corrupt state |
| Accumulating counts in global variable      | ❌ Unsafe        | Non-atomic, racey updates              |
| Aggregating per window with state reset     | ⚠️ Bounded       | Needs correct grouping/windowing       |
| Calling external APIs with idempotent logic | ✅ Safe          | Retries are okay, no shared state      |
| Parsing streamed data into structured form  | ✅ Safe          | Independent per unit                   |
| Real-time fraud detection per session       | ⚠️ Bounded       | Needs session-aware logic              |
| Processing ordered logs with time joins     | ⚠️ Bounded       | Must retain order for correctness      |
