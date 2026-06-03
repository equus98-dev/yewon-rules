import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query(`
    SELECT a.id, a."articleNumber", a."contentJson", r.title
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
  `);
  
  let fixCount = 0;
  for (const r of res.rows) {
     if (!r.contentJson) continue;
     let json = typeof r.contentJson === 'string' ? JSON.parse(r.contentJson) : r.contentJson;
     if (!Array.isArray(json)) continue;
     
     // Find tables
     const tableItems = json.filter(i => i.type === 'text' && i.text && i.text.includes('<table'));
     if (tableItems.length === 0) continue;
     
     // Find first addendum index
     let addendumIdx = -1;
     for (let i = 1; i < json.length; i++) {
        const text = json[i].text ? json[i].text.trim() : '';
        if (/^\(시행일\)|^\(폐지|^\(경과조치|^\(적용례|^\(적용예외|^\(적용범위|^\(준용\)|^부\s*칙/.test(text)) {
           addendumIdx = i;
           break;
        }
     }
     
     if (addendumIdx !== -1) {
        // Remove tables
        const newJson = json.filter(i => !(i.type === 'text' && i.text && i.text.includes('<table')));
        
        // The addendumIdx might have shifted due to table removal, but tables were usually at the end.
        // Let's recalculate addendumIdx on newJson
        let newAddendumIdx = -1;
        for (let i = 1; i < newJson.length; i++) {
            const text = newJson[i].text ? newJson[i].text.trim() : '';
            if (/^\(시행일\)|^\(폐지|^\(경과조치|^\(적용례|^\(적용예외|^\(적용범위|^\(준용\)|^부\s*칙/.test(text)) {
               newAddendumIdx = i;
               break;
            }
        }
        
        if (newAddendumIdx !== -1) {
            // Insert tables right before newAddendumIdx
            newJson.splice(newAddendumIdx, 0, ...tableItems);
            
            // Check if it's different from original
            if (JSON.stringify(newJson) !== JSON.stringify(json)) {
               console.log(`[Fixing] ${r.title} 제${r.articleNumber}조 (moved table before addendum at idx ${newAddendumIdx})`);
               await pool.query(`UPDATE "Article" SET "contentJson" = $1::jsonb WHERE id = $2`, [JSON.stringify(newJson), r.id]);
               fixCount++;
            }
        }
     }
  }
  console.log(`Fixed ${fixCount} articles.`);
  pool.end();
})();
