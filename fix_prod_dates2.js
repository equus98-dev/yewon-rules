const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query(`SELECT id, "ruleId", "versionName", "enactmentDate" FROM "Revision" WHERE "enactmentDate" >= '2026-06-29'`))
  .then(res => {
    console.log("Matching Revisions:", JSON.stringify(res.rows, null, 2));
    const ids = res.rows.map(r => r.id);
    if(ids.length > 0) {
      return client.query(`UPDATE "Revision" SET "enactmentDate" = '2026-06-16T15:00:00Z', "effectiveDate" = '2026-06-16T15:00:00Z' WHERE id IN (${ids.map((_,i) => '$'+(i+1)).join(',')})`, ids);
    }
  })
  .then(() => console.log("Done."))
  .catch(err => console.error(err))
  .finally(() => client.end());
