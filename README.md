 # Transfer Time Calculator

A simple static website for calculating theoretical transfer times based on file size,
bandwidth and network protocol (TCP or UDP).

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
4. Choose a protocol (TCP or UDP). If TCP is selected, provide the round-trip latency in milliseconds.
5. Select the IP version (IPv4 or IPv6). When no overhead preset is selected, the overhead field updates automatically for the chosen protocol and IP version.
   Changing either the protocol or IP version clears the preset selection so the
   defaults take effect. The protocol and IP version inputs are also used to
   calculate the TCP handshake when applicable.
6. (Optional) Pick an overhead preset such as Ethernet IPv4/TCP or MPLS to override the automatic value.
7. Click **Calculate** to see the estimated transfer time.

## Formulas

The calculation uses these formulas (sizes are converted to bits and bandwidth to bits per second):

```
handshakeSeconds = protocol == TCP ? 2 × latencyMs / 1000 : 0
transferSeconds = (sizeBits) ÷ bandwidthBps
effectiveBandwidth = bandwidthBps × (1 - overheadPercent / 100)
transferWithOverheadSeconds = (sizeBits) ÷ effectiveBandwidth

totalWithoutOverhead = handshakeSeconds + transferSeconds
totalWithOverhead = handshakeSeconds + transferWithOverheadSeconds
```

When a protocol overhead percentage (for example 3%) is provided, the bandwidth
is multiplied by `(1 - 3/100 = 0.97)` before computing the transfer time.
Handshake time applies only to TCP and depends on the round-trip latency.

### Manual Calculation Example

The following example demonstrates how you can verify the numbers manually.
Assume a **1&nbsp;GB** file is sent over a **100&nbsp;Mbps** TCP link with
**50&nbsp;ms** round-trip latency and **3&nbsp;%** protocol overhead:

1. **Convert units**
   - `sizeBits = 1 GB × 8 = 8,000,000,000`
   - `bandwidthBps = 100 Mbps = 100,000,000`
2. **Handshake time (TCP only)**
   - `handshakeSeconds = 2 × 50 ms / 1000 = 0.1`
3. **Effective bandwidth**
   - `effectiveBandwidth = 100,000,000 × (1 - 3/100 = 0.97) = 97,000,000`
4. **Without overhead**
   - `transferSeconds = sizeBits ÷ bandwidthBps = 8,000,000,000 ÷ 100,000,000 = 80`
   - `totalWithoutOverhead = handshakeSeconds + transferSeconds = 80.1`
5. **With overhead**
   - `transferWithOverheadSeconds = sizeBits ÷ effectiveBandwidth = 8,000,000,000 ÷ 97,000,000 ≈ 82.47`
   - `totalWithOverhead = handshakeSeconds + transferWithOverheadSeconds ≈ 82.57`

So the transfer takes about **80 seconds** without overhead and roughly
**82.6 seconds** once overhead is applied.

 ## Project Structure
 - `index.html`: Main HTML template
 - `styles.css`: Application styling
 - `src/main.ts`: Core application logic
 - `public/`: Build output (static assets)

 ## License
 This project is licensed under the [MIT License](LICENSE).
