#!/usr/bin/env node
/**
 * Migration script to repair broken `contentJson` fields in the D1 database.
 * It scans all articles where `contentJson` equals the string "[object Object]"
 * and rebuilds a proper JSON structure based on `contentText`.
 *
 * Additionally, it removes any addendum (부칙) articles that have an empty
 * `contentText` – these correspond to records like the one observed for rule
 * 8032.
 *
 * Usage (run from project root):
 *   node scripts/fix_content_json.mjs
 *
 * The script uses the Cloudflare Wrangler D1 CLI. Ensure you have the correct
 * bindings (`yewon-rules-db`) configured in `wrangler.toml`.
 */

import { execSync } from "child_process";

// Helper to execute a Wrangler D1 query and return JSON rows.
function wranglerQuery(sql) {
  const cmd = `npx wrangler d1 execute yewon-rules-db --remote --command="${sql}"`;
  const out = execSync(cmd, { encoding: "utf8" });
  // Wrangler prints JSON rows after a line like "Rows:"; we attempt to parse.
  const jsonPart = out.split("Rows:")[1];
  if (!jsonPart) return [];
  try {
    return JSON.parse(jsonPart.trim());
  } catch (e) {
    console.error("Failed to parse Wrangler output", e);
    return [];
  }
}

async function main() {
  console.log("Scanning for broken contentJson entries...");
  const broken = wranglerQuery(
    "SELECT id, articleNumber, title, contentText FROM Article WHERE contentJson = '[object Object]';"
  );

  console.log(`Found ${broken.length} broken articles.`);

  for (const art of broken) {
    // Build a minimal JSON structure; adjust as needed for actual schema.
    const newJson = JSON.stringify({ type: "text", content: art.contentText });
    const updateSql = `UPDATE Article SET contentJson = '${newJson.replace(/'/g, "''")}' WHERE id = '${art.id}';`;
    wranglerQuery(updateSql);
    console.log(`Fixed article ${art.articleNumber}`);
  }

  console.log("Cleaning up empty addendum (부칙) records...");
  const emptyAddendum = wranglerQuery(
    "SELECT id FROM Article WHERE contentText = '' AND title LIKE '%부칙%';"
  );
  for (const row of emptyAddendum) {
    const delSql = `DELETE FROM Article WHERE id = '${row.id}';`;
    wranglerQuery(delSql);
    console.log(`Deleted empty addendum ${row.id}`);
  }

  console.log("Migration completed.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
