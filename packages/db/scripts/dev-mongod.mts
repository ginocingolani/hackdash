import { MongoMemoryServer } from "mongodb-memory-server";
import { writeFileSync } from "node:fs";

// Dev utility: run a throwaway in-memory MongoDB (no local install needed).
// Prints the URI; optionally writes it to $URI_FILE. Ctrl+C to stop.
const mongod = await MongoMemoryServer.create();
if (process.env.URI_FILE) writeFileSync(process.env.URI_FILE, mongod.getUri());
console.log(`mongod up: ${mongod.getUri()}`);
setInterval(() => {}, 60_000);
