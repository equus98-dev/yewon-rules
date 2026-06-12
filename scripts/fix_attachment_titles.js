const { execSync } = require('child_process');

try {
  const query = `SELECT id, title, fileUrl FROM Attachment;`;
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const data = JSON.parse(result);
  
  const rows = data[0].results;
  if (!rows || rows.length === 0) {
    console.log("No attachments found.");
    process.exit(0);
  }
  
  const updates = [];
  
  for (const row of rows) {
    let title = row.title;
    if (!title) continue;
    
    // Check if it already starts with a proper prefix
    if (title.startsWith('[전문]') || title.startsWith('[별표]') || title.startsWith('[별지]')) {
      continue;
    }
    
    let newTitle = title;
    
    // Determine the type
    if (title.includes('별표')) {
      newTitle = `[별표] ${title}`;
    } else if (title.includes('별지') || title.includes('서식')) {
      newTitle = `[별지] ${title}`;
    } else if (title.includes('부칙')) {
      newTitle = `[별표] ${title}`; // Group 부칙 into 별표
    } else {
      newTitle = `[전문] ${title}`;
    }
    
    if (newTitle !== title) {
      updates.push(`UPDATE Attachment SET title = '${newTitle.replace(/'/g, "''")}' WHERE id = '${row.id}';`);
    }
  }
  
  if (updates.length > 0) {
    console.log(`Updating ${updates.length} attachments...`);
    require('fs').writeFileSync('update_attachments.sql', updates.join('\n'));
    execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=update_attachments.sql`, { stdio: 'inherit' });
    console.log("Update successful!");
  } else {
    console.log("No attachments needed updating.");
  }

} catch(e) {
  console.error(e);
}
