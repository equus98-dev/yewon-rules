const { execSync } = require('child_process');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('docs/202_addendums_full.json', 'utf8'))[0].results;
const a8285 = data.find(d => d.id === 'ef9f1247-5c35-492d-bda1-2c1e1ae1d05f');
const a8286 = data.find(d => d.id === '38483e4a-f90b-4fc0-8d5f-4759e2d104e6');

const tableMatch = a8286.contentText.match(/(<table[\s\S]*?<\/table>)/i);
if (tableMatch) {
    const tableHtml = tableMatch[0];
    const new8285Text = a8285.contentText + '\n' + tableHtml;
    const new8286Text = a8286.contentText.replace(tableHtml, '').trim();

    // Escape single quotes for SQL
    const sql8285 = new8285Text.replace(/'/g, "''");
    const sql8286 = new8286Text.replace(/'/g, "''");

    const query = `UPDATE Article SET contentText = '${sql8285}' WHERE id = 'ef9f1247-5c35-492d-bda1-2c1e1ae1d05f'; UPDATE Article SET contentText = '${sql8286}' WHERE id = '38483e4a-f90b-4fc0-8d5f-4759e2d104e6';`;
    
    fs.writeFileSync('scripts/update_table.sql', query);
    console.log("SQL script generated.");
} else {
    console.log("Table not found in 8286!");
}
