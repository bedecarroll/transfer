 # Transfer Time Calculator

A static website for calculating theoretical transfer times. TCP-specific metrics are displayed only when using TCP presets, and the MTU can be adjusted from its default of 1500 bytes. Hover over the question mark icons next to each result for a brief explanation of that metric.

 ## Prerequisites
 - bun (>=0.6.0) or Node.js (>=14)
 - Python 3 (for Python-based server)

 ## Installation
 Install dependencies:
 ```bash
 bun install
 ```

 ## Build
 Compile TypeScript and prepare the `public/` directory:
 ```bash
 bun run build
 ```

 ## Serve
 
 ### Using Node static server
 Requires the `serve` package (install globally or locally):
 ```bash
 bun run serve
 ```
 Open http://localhost:3000 (or the default port shown).

 ### Using Python HTTP server
 ```bash
 bun run serve:python
 ```
 Open http://localhost:8000.

 ## Development
 Watch for changes and rebuild automatically:
 ```bash
 bun run dev
 ```

 ## Usage
1. Open the web UI in your browser.
2. Enter a file size and select its unit.
3. Enter a bandwidth value and select its unit.
4. (Optional) Enter the round-trip latency in milliseconds.
5. (Optional) Specify the MTU in bytes (default **1500**) if your network uses jumbo frames.
6. (Optional) Pick an overhead preset (defaults to **Ethernet IPv4/TCP**) such as MPLS or VXLAN.
7. (Optional) Add extra header bytes on top of the chosen preset. The resulting overhead percentage updates automatically.
8. (Optional) Adjust packet loss (default **0.001&nbsp;%**) and the TCP window size to see throughput limits.
9. Click **Calculate** to see the minimum transfer time followed by the metrics used to derive it.
10. Hover over the question mark icons next to each result for an explanation of what the metric represents.

## Formulas

The calculation uses the following formulas. In these expressions all file sizes are converted to **bits (b)** and all bandwidth values to **bits per second (b/s)**:

```
sizeBits (b) = fileSize × 8
bandwidthBps (b/s) = bandwidth
transferSeconds (s) = sizeBits (b) ÷ bandwidthBps (b/s)
effectiveBandwidth (b/s) = bandwidthBps (b/s) × (1 - overheadPercent / 100)
transferWithOverheadSeconds (s) = sizeBits (b) ÷ effectiveBandwidth (b/s)

totalWithoutOverhead (s) = transferSeconds (s)
totalWithOverhead (s) = transferWithOverheadSeconds (s)
bandwidthDelayProduct (b) = bandwidthBps (b/s) × latencyMilliseconds (ms) / 1000
maxOverheadThroughput (b/s) = effectiveBandwidth (b/s)
maxLossThroughput (b/s) = 1.22 × MSSBytes × 8 ÷ (latencySeconds × sqrt(packetLoss))
maxWindowThroughput (b/s) = tcpWindowBytes × 8 ÷ latencySeconds
expectedThroughput (b/s) = min(bandwidthBps, maxOverheadThroughput, maxLossThroughput, maxWindowThroughput)
minimumTransferTime (s) = sizeBits ÷ expectedThroughput
```

The generic forms above show the units for each term. ``latencyMilliseconds`` is provided by the user in **ms**. The overhead percentage reduces available bandwidth by the factor ``(1 - overheadPercent / 100)`` before computing the transfer duration.

``maxLossThroughput`` uses the Mathis et al. formula with a fixed MSS of 1460 bytes and the packet loss probability provided by the user. ``maxWindowThroughput`` depends on the configured TCP receive window.


When protocol overhead is applied (derived from header bytes), the bandwidth
is multiplied by `(1 - overheadPercent/100)` before computing the transfer time.
The Bandwidth-Delay Product (BDP) expresses how many bits can fill the
pipeline at once: `bandwidthBps × latencySeconds`. The calculator displays the
BDP and the equivalent minimum TCP receive window.

### Manual Calculation Example

The following example demonstrates how you can verify the numbers manually.
Assume a **1&nbsp;GB** file is sent over a **100&nbsp;Mbps** TCP link with
**50&nbsp;ms** round-trip latency and **3&nbsp;%** protocol overhead:

1. **Convert units**
   - `sizeBits = 1 GB × 8 = 8,000,000,000`
   - `bandwidthBps = 100 Mbps = 100,000,000`
2. **Effective bandwidth**
   - `effectiveBandwidth = 100,000,000 × (1 - 3/100 = 0.97) = 97,000,000`
3. **Without overhead**
   - `transferSeconds = sizeBits ÷ bandwidthBps = 8,000,000,000 ÷ 100,000,000 = 80`
   - `totalWithoutOverhead = transferSeconds = 80`
4. **With overhead**
   - `transferWithOverheadSeconds = sizeBits ÷ effectiveBandwidth = 8,000,000,000 ÷ 97,000,000 ≈ 82.47`
   - `totalWithOverhead = transferWithOverheadSeconds ≈ 82.47`

5. **Bandwidth-Delay Product and Minimum Window**
   - `bdpBits = bandwidthBps × latencySeconds = 100,000,000 × 0.05 = 5,000,000`
   - `bdpBytes = bdpBits ÷ 8 = 625,000`
6. **Throughput Limits** (assume `0.001 %` packet loss and a `16 MiB` TCP window)
   - `maxOverheadThroughput = effectiveBandwidth = 97,000,000`
   - `maxLossThroughput = 1.22 × 1460 × 8 ÷ (0.05 × √0.00001) ≈ 90,000,000`
   - `maxWindowThroughput = 16,777,216 × 8 ÷ 0.05 ≈ 2,684,354,560`
   - `expectedThroughput = min(100,000,000, 97,000,000, 90,000,000, 2,684,354,560) = 90,000,000`
7. **Minimum Transfer Time**
   - `minimumTransferTime = sizeBits ÷ expectedThroughput = 8,000,000,000 ÷ 90,000,000 ≈ 88.9`

So the transfer takes about **80 seconds** without overhead and roughly
**82.6 seconds** once overhead is applied.

 ## Project Structure
 - `index.html`: Main HTML template
 - `styles.css`: Application styling
 - `src/main.ts`: Core application logic
 - `public/`: Build output (static assets)
 - `AGENTS.md`: Describes the `calculate_transfer_time` function agent for LLM integrations. This agent is specified solely in the document and does not have a corresponding `src/agent.ts` file.

 ## License
 This project is licensed under the [MIT License](LICENSE).
