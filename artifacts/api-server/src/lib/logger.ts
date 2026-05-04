import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// In production (Vercel serverless), pino must NOT use worker-thread transports.
// pino-pretty transport uses worker_threads which are unavailable/broken in Vercel's
// bundled serverless environment. In production, write plain JSON to stdout.
export const logger = pino(
  isProduction
    ? {
        level: process.env.LOG_LEVEL ?? "info",
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
        ],
      }
    : {
        level: process.env.LOG_LEVEL ?? "info",
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
        ],
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
);
