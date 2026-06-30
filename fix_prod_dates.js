const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query(`UPDATE "Revision" SET "enactmentDate" = '2026-06-17', "effectiveDate" = '2026-06-17' WHERE "enactmentDate" >= '2026-06-30' AND "enactmentDate" <= '2026-07-02' RETURNING id, "ruleId", "versionName", "enactmentDate"`))
  .then(res => console.log("Updated Revisions:", JSON.stringify(res.rows, null, 2)))
  .finally(() => client.end());
