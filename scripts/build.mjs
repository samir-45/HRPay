import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function run(args, options = {}) {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
    const commandArgs =
      process.platform === "win32" ? ["/d", "/s", "/c", "pnpm", ...args] : args;

    const child = spawn(command, commandArgs, {
      cwd: rootDir,
      env: { ...process.env, ...options.env },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pnpm ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function copyFrontendToPublic() {
  const frontendDist = path.join(rootDir, "artifacts", "hrpay", "dist", "public");
  const publicDirs = [
    path.join(rootDir, "public"),
    path.join(rootDir, "artifacts", "api-server", "public"),
  ];

  await Promise.all(
    publicDirs.map(async (publicDir) => {
      await rm(publicDir, { recursive: true, force: true });
      await cp(frontendDist, publicDir, { recursive: true });
    }),
  );
}

await run(["run", "typecheck"]);
await run(["--filter", "@workspace/api-server", "run", "build"], {
  env: { SKIP_VERCEL_PUBLIC_FALLBACK: "1" },
});
await run(["--filter", "@workspace/hrpay", "run", "build"]);
await copyFrontendToPublic();
