// Vercel serverless entry — @vercel/node compiles this TypeScript at deploy time.
// We import `app.ts` directly (NOT dist/index.mjs which is git-ignored and calls app.listen()).
// @ts-ignore – workspace package resolution handled by @vercel/node bundler
import app from "../artifacts/api-server/src/app.js";
export default app;
