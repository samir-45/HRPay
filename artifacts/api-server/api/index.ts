// Vercel serverless entry when the project root is artifacts/api-server.
// Keep this separate from src/index.ts, which starts a long-running server.
import app from "../src/app.js";

export default app;
