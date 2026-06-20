import { spawn } from "child_process";
import net from "net";
import { config as loadEnv } from "dotenv";

// 加载 .env.local，使 prisma db seed 等命令能读取到 DATABASE_URL
loadEnv({ path: ".env.local" });

const POSTGRES_HOST = "localhost";
const POSTGRES_PORT = 5433;
const STARTUP_TIMEOUT_MS = 30000;

function checkPostgres(timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => resolve(false));
    socket.connect(POSTGRES_PORT, POSTGRES_HOST);
  });
}

function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options,
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`"${command} ${args.join(" ")}" exited with code ${code}`));
      } else {
        resolve();
      }
    });
    child.on("error", reject);
  });
}

async function waitForPostgres() {
  const start = Date.now();
  while (!(await checkPostgres(1000))) {
    if (Date.now() - start > STARTUP_TIMEOUT_MS) {
      throw new Error("PostgreSQL did not become ready in time");
    }
    console.log("Waiting for PostgreSQL...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function main() {
  const isPostgresReady = await checkPostgres(500);
  if (!isPostgresReady) {
    console.log("Starting PostgreSQL container...");
    await run("docker", ["compose", "up", "-d"]);
    await waitForPostgres();
    console.log("PostgreSQL is ready");
  } else {
    console.log("PostgreSQL is already running");
  }

  console.log("Seeding database...");
  await run("npx", ["prisma", "db", "seed"]);

  console.log("Starting Next.js dev server...");
  await run("npx", ["next", "dev", "-H", "0.0.0.0"]);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
