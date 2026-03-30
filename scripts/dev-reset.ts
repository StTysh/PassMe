import { existsSync, rmSync } from "node:fs";

import { closeDb, getDatabaseFilePath } from "@/db/client";

const resolved = getDatabaseFilePath();
closeDb();

if (existsSync(resolved)) {
  rmSync(resolved, { force: true });
}

console.log(`Removed ${resolved}`);
