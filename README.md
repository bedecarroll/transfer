 # Transfer Time Calculator

 A simple static website for calculating theoretical transfer times based on file size and bandwidth.

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
 4. Click **Calculate** to see the estimated transfer time.

 ## Project Structure
 - `index.html`: Main HTML template
 - `styles.css`: Application styling
 - `src/main.ts`: Core application logic
 - `public/`: Build output (static assets)

 ## License
 This project is licensed under the [MIT License](LICENSE).
