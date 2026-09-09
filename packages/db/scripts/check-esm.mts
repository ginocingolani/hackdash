// Guard against CJS-interop regressions: vitest's transform tolerates named
// imports from CommonJS packages (like mongoose) that break under real Node
// ESM — the runtime the seed script and Next.js server actually use. This
// imports the whole package under real ESM; a bad import fails loudly here
// even though the test suite would pass.
await import("../src/index.ts");
console.log("ESM import check passed");
