 # Agents

 This document describes the available function agents for language-model integrations. Each agent represents a tool the LLM can call to perform specific tasks.

 ## calculate_transfer_time
 - **Description**: Calculate theoretical transfer time given a file size and bandwidth.
 - **Function Name**: `calculate_transfer_time`
 - **Parameters**:
   - `size` (number): Numeric value of the file size.
   - `sizeUnit` (string): Unit of file size; one of `B`, `KB`, `MB`, `GB`, `TB`.
   - `bandwidth` (number): Numeric value of the bandwidth.
   - `bandwidthUnit` (string): Unit of bandwidth; one of `bps`, `Kbps`, `Mbps`, `Gbps`, `Tbps`.
 - **Returns**:
   - `timeSeconds` (number): Estimated transfer time in seconds.
   - `timeHuman` (string): Human-readable transfer time (e.g., `1 minute 20 seconds`).

 ### Function Schema (for LLM function calling)
 ```json
 {
   "name": "calculate_transfer_time",
   "description": "Calculate theoretical transfer time given file size and bandwidth",
   "parameters": {
     "type": "object",
     "properties": {
       "size": { "type": "number" },
       "sizeUnit": {
         "type": "string",
         "enum": ["B", "KB", "MB", "GB", "TB"]
       },
       "bandwidth": { "type": "number" },
       "bandwidthUnit": {
         "type": "string",
         "enum": ["bps", "Kbps", "Mbps", "Gbps", "Tbps"]
       }
     },
     "required": ["size", "sizeUnit", "bandwidth", "bandwidthUnit"]
   }
 }
 ```

 ### Example Call
 ```json
 {
   "name": "calculate_transfer_time",
   "arguments": {
     "size": 500,
     "sizeUnit": "MB",
     "bandwidth": 5,
     "bandwidthUnit": "Mbps"
   }
 }
 ```

 ### Example Response
 ```json
 {
   "timeSeconds": 800,
   "timeHuman": "13 minutes 20 seconds"
 }
 ```
