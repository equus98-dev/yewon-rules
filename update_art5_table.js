const { execSync } = require('child_process');

// 1. Fetch the Article containing "우등고속버스"
console.log("Fetching article...");
try {
  const result = execSync('npx wrangler d1 execute yewon-rules-db --remote --json --command="SELECT id, contentText FROM Article WHERE contentText LIKE \'%우등고속버스%\'"').toString();
  const data = JSON.parse(result);
  console.log(data);
  const rows = data[0].results;
  
  if (rows.length > 0) {
    const articleId = rows[0].id;
    let contentText = rows[0].contentText;
    
    // 2. Perform replacements
    contentText = contentText.replace(/<td valign="middle" style="overflow:hidden;width:80px;height:124px;([^"]+)">\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">교직원<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<\/td>/, 
      '<td valign="middle" style="overflow:hidden;width:80px;height:124px;background-color:#f1f3f5;$1">\n\t<p class="HStyle0" style="text-align:center;"><span style="position:relative;font-weight:bold;">교직원</span></p>\n\t</td>');
      
    contentText = contentText.replace(/<td valign="middle" style="overflow:hidden;width:110px;/g, '<td valign="middle" style="overflow:hidden;width:134px;');
    contentText = contentText.replace(/<td rowspan="2" valign="middle" style="overflow:hidden;width:110px;/g, '<td rowspan="2" valign="middle" style="overflow:hidden;width:134px;');
    
    contentText = contentText.replace(/<td valign="middle" style="overflow:hidden;width:57px;/g, '<td valign="middle" style="overflow:hidden;width:45px;');
    contentText = contentText.replace(/<td rowspan="2" valign="middle" style="overflow:hidden;width:57px;/g, '<td rowspan="2" valign="middle" style="overflow:hidden;width:45px;');
    
    // Replace 숙박비 실비 내역
    contentText = contentText.replace(/<p class="HStyle0" style="text-align:center;"><span style="position:relative">실비<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(상한액:서울특별시 100,000 \/ 광역시 80,000 \/ 그 밖의 지역 70,000\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>/,
      '<p class="HStyle0" style="text-align:center;line-height:1.6;"><span style="position:relative">실비</span><br><span style="position:relative">(상한액)</span><br><span style="position:relative">서울특별시 10만원</span><br><span style="position:relative">광역시 8만원</span><br><span style="position:relative">그 밖의 지역 7만원</span></p>');

    // Replace 대중교통 실비 내역
    contentText = contentText.replace(/<p class="HStyle0" style="text-align:center;"><span style="position:relative">실비<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(철도: KTX일반실\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(버스: 우등고속버스\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(항공: 이코노미\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>/,
      '<p class="HStyle0" style="text-align:center;line-height:1.6;"><span style="position:relative">실비</span><br><span style="position:relative">철도: KTX일반실</span><br><span style="position:relative">버스: 우등고속버스</span><br><span style="position:relative">항공: 이코노미</span></p>');

    const fs = require('fs');
    fs.writeFileSync('update_payload.json', JSON.stringify({ contentText }));
    console.log("Updated payload written to update_payload.json");
    
    // Note: To prevent argument too long error, we use a bound parameter approach or a local DB first?
    // Actually we can just generate a SQL file and execute it
    const escapedContent = contentText.replace(/'/g, "''");
    const sql = `UPDATE Article SET contentText = '${escapedContent}' WHERE id = '${articleId}';`;
    fs.writeFileSync('update_art5_remote.sql', sql);
    console.log("SQL file generated: update_art5_remote.sql");
    
    // Execute SQL
    console.log("Executing SQL on remote DB...");
    execSync('npx wrangler d1 execute yewon-rules-db --remote --file=update_art5_remote.sql');
    console.log("Update completed.");
  } else {
    console.log("No article found.");
  }
} catch (e) {
  console.error("Error:", e.message);
  if (e.stdout) console.error(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
}
