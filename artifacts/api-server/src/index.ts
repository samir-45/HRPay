import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { pool, db } from "@workspace/db";
import { companiesTable, companyInsightsTable } from "@workspace/db";
import cron from "node-cron";
import { generateInsights, getWeekMonday } from "./routes/insights";

const rawPort = process.env["BACKEND_PORT"] || "8080";

if (!rawPort) {
  throw new Error("BACKEND_PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

/* ── Graceful shutdown ── */
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received, closing server…");
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await pool.end();
      logger.info("Database pool closed");
    } catch (err) {
      logger.error({ err }, "Error closing database pool");
    }
    process.exit(0);
  });

  // Force exit after 10 s if graceful shutdown hangs
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

/* ── Weekly AI Insights Scheduler (every Monday at 9:00 AM UTC) ── */
cron.schedule("0 9 * * 1", async () => {
  logger.info("Running weekly AI insights generation");
  try {
    const companies = await db
      .select({ id: companiesTable.id, name: companiesTable.name, settings: companiesTable.settings })
      .from(companiesTable);

    const weekOf = getWeekMonday();

    for (const company of companies) {
      try {
        const settings = (company.settings ?? {}) as Record<string, unknown>;
        if (settings.aiInsightsEnabled === false) continue;

        const payload = await generateInsights(company.id, company.name);
        await db.insert(companyInsightsTable).values({
          companyId: company.id,
          weekOf,
          summary: payload.summary,
          score: payload.score,
          insights: payload.insights,
          status: "completed",
        });
        logger.info({ companyId: company.id }, "Weekly insights generated");
      } catch (err) {
        logger.error({ err, companyId: company.id }, "Failed to generate insights for company");
      }
    }
  } catch (err) {
    logger.error({ err }, "Weekly insights scheduler error");
  }
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection — shutting down");
  process.exit(1);
});

export default app;
