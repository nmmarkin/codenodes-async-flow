# Data flow dimensions

| **Dimension**             | **Options/Values**                               | **Notes**                         |
| ------------------------- | ------------------------------------------------ | --------------------------------- |
| Ordering                  | Preserved / Best-effort / Unordered              | Important for reduce, join        |
| Retention                 | None / Partial (sliding buffer) / Full (queue)   | Memory, temp storage              |
| Parallelism               | Safe / Unsafe / Bounded                          | Depends on state and side effects |
| Completion Signal         | Yes / No / Optional                              | Needed for reduce, batch          |
| Push vs Pull              | Push (events) / Pull (APIs, polling)             | Impacts architecture              |
| Granularity               | Byte / Object / Chunk / File / Batch             | Affects memory use                |
| Stateful vs Stateless     | Stateless (map) / Stateful (reduce, count)       | Important for scaling             |
| Failure handling          | Fail fast / Retry / DLQ                          | Easier for idempotent operations  |
