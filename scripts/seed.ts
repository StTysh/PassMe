import { closeDb } from "@/db/client";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { ensureDemoData } from "@/lib/services/demo";

function main() {
  ensureDatabaseReady();
  ensureDemoData();
  closeDb();
  console.log("Database ready. Seeded personas and demo data.");
}

main();
