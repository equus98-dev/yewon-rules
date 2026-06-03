import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.jagpwxgasudlnaoxfroe',
  password: 'Tmtmfh0022$&*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const testId = 'dc43a03d-0566-4774-8f0c-b58c75ae6aaa';

async function run() {
  try {
    // Simulate the exact query in the API route
    const ruleRes = await pool.query(
      `SELECT 
        r.id, r.title, r."ruleNumber", r.status, r."categoryId", r."departmentId",
        c.id AS "catId", c.name AS "categoryName",
        d.id AS "deptId", d.name AS "departmentName"
       FROM "Rule" r
       LEFT JOIN "Category" c ON r."categoryId" = c.id
       LEFT JOIN "Department" d ON r."departmentId" = d.id
       WHERE r.id = $1`,
      [testId]
    );
    console.log('Rule found:', ruleRes.rows.length > 0);
    console.log('Rule data:', JSON.stringify(ruleRes.rows[0]));
    
    const revisionsRes = await pool.query(
      `SELECT id, version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description
       FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`,
      [testId]
    );
    console.log('\nRevisions:', revisionsRes.rows.length);
    
    const targetRevisionId = revisionsRes.rows[0].id;
    
    const articlesRes = await pool.query(
      `SELECT id, chapter, section, "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder"
       FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`,
      [targetRevisionId]
    );
    console.log('\nArticles:', articlesRes.rows.length);
    
    // Check contentJson size - LARGE contentJson could be the issue
    const firstArticle = articlesRes.rows[0];
    if (firstArticle) {
      const jsonStr = typeof firstArticle.contentJson === 'string' 
        ? firstArticle.contentJson 
        : JSON.stringify(firstArticle.contentJson);
      console.log('ContentJson size (bytes):', Buffer.byteLength(jsonStr, 'utf8'));
      
      // Try to parse it
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('ContentJson parsed, items count:', Array.isArray(parsed) ? parsed.length : 'not array');
      } catch(e) {
        console.log('CONTENTJSON PARSE ERROR:', e.message);
      }
    }
    
    // Run the full comparisons query
    console.log('\nRunning comparisons query...');
    const comparisonsRes = await pool.query(
      `SELECT 
        ac.id, ac."beforeArticleId", ac."afterArticleId", ac.note,
        ba.chapter AS "before_chapter", ba."articleNumber" AS "before_articleNumber",
        ba.title AS "before_title", ba."contentText" AS "before_contentText", ba."contentJson" AS "before_contentJson",
        aa.chapter AS "after_chapter", aa."articleNumber" AS "after_articleNumber",
        aa.title AS "after_title", aa."contentText" AS "after_contentText", aa."contentJson" AS "after_contentJson"
       FROM "ArticleComparison" ac
       LEFT JOIN "Article" ba ON ac."beforeArticleId" = ba.id
       LEFT JOIN "Article" aa ON ac."afterArticleId" = aa.id
       WHERE ac."revisionId" = $1`,
      [targetRevisionId]
    );
    console.log('Comparisons:', comparisonsRes.rows.length);
    
    // Now measure the full response size
    const attachmentsRes = await pool.query(
      `SELECT id, title, "fileUrl", "fileType", "createdAt" FROM "Attachment" WHERE "ruleId" = $1 ORDER BY "createdAt" ASC`,
      [testId]
    );
    
    const fullData = {
      id: ruleRes.rows[0].id,
      title: ruleRes.rows[0].title,
      revisions: revisionsRes.rows,
      attachments: attachmentsRes.rows,
      currentRevision: {
        ...revisionsRes.rows[0],
        articles: articlesRes.rows,
        comparisons: comparisonsRes.rows,
      }
    };
    
    const serialized = JSON.stringify(fullData);
    const sizeKB = Buffer.byteLength(serialized, 'utf8') / 1024;
    console.log('\nTotal response size:', sizeKB.toFixed(1), 'KB');
    
    // Cloudflare Workers have a 128MB response limit but the default edge function
    // limit is often 1MB uncompressed
    if (sizeKB > 1000) {
      console.log('WARNING: Response is over 1MB - this could cause edge runtime issues!');
    }
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();
