import { execSync } from "node:child_process";

const TEST_DATABASE_URL = "postgresql://nuzuljo:nuzuljo@localhost:5432/nuzuljo_test?schema=public";

export default function globalSetup() {
  execSync("npx prisma migrate deploy", {
    cwd: __dirname + "/..",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
