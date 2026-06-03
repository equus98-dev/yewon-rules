import { Pool } from "@neondatabase/serverless";

const connectionString = "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

async function run() {
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    const res = await pool.query(`SELECT title, "fileUrl" FROM "Attachment" LIMIT 5`);
    for (const row of res.rows) {
      console.log("Testing:", row.title);
      console.log("fileUrl:", row.fileUrl);
      
      const proxyUrl = "https://yewon-rules.pages.dev/api/download?fileUrl=" + encodeURIComponent(row.fileUrl);
      console.log("proxyUrl:", proxyUrl);
      
      const fetchRes = await fetch(proxyUrl, { method: "HEAD" });
      console.log("Status:", fetchRes.status);
      console.log("Headers:", fetchRes.headers.get("content-type"), fetchRes.headers.get("content-disposition"));
      console.log("-----");
    }
  } finally {
    await pool.end();
  }
}
run();
