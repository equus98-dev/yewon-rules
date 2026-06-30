const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(async () => {
  try {
    const res = await client.query(`
      SELECT a.id, a."contentJson" 
      FROM "Article" a 
      JOIN "Revision" r ON a."revisionId" = r.id 
      WHERE r."ruleId" = 'ba1e19c0-9eec-48cc-bd08-a20bc46b5158' 
        AND a."articleNumber" = 19
      ORDER BY r."createdAt" DESC LIMIT 1
    `);
    
    if (res.rows.length === 0) {
      console.log('Article 19 not found.');
      return;
    }
    
    const articleId = res.rows[0].id;
    let contentJson = res.rows[0].contentJson;
    
    // We only need to fix if contentJson is an array of items and has separated "가." items.
    if (Array.isArray(contentJson)) {
      let mergedItems = [];
      for (let i = 0; i < contentJson.length; i++) {
        let item = contentJson[i];
        
        // If it's a subitem like "가.", "나.", "다." and the previous item was "2." or similar
        // we can merge it into the previous item's text.
        if (item.num && /^[가-하]\./.test(item.num)) {
          if (mergedItems.length > 0) {
            mergedItems[mergedItems.length - 1].text += '\n' + item.num + ' ' + item.text;
          } else {
            mergedItems.push(item);
          }
        } else if (!item.num && /^[가-하]\./.test(item.text)) {
           // If num is empty but text contains "가."
           if (mergedItems.length > 0) {
            mergedItems[mergedItems.length - 1].text += '\n' + item.text;
          } else {
            mergedItems.push(item);
          }
        } else {
          mergedItems.push(item);
        }
      }
      
      console.log('Merged items:', JSON.stringify(mergedItems, null, 2));
      
      // Update DB
      await client.query(`UPDATE "Article" SET "contentJson" = $1 WHERE id = $2`, [JSON.stringify(mergedItems), articleId]);
      console.log('Article 19 updated successfully.');
    } else {
      console.log('ContentJson is not an array, skipping merge.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
});
