const { execSync } = require('child_process');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('docs/202_addendums_full.json', 'utf8'))[0].results;
const a8285 = data.find(d => d.id === 'ef9f1247-5c35-492d-bda1-2c1e1ae1d05f');
const a8286 = data.find(d => d.id === '38483e4a-f90b-4fc0-8d5f-4759e2d104e6');

const cleanTableHtml = `<table class="rule-table">
  <thead>
    <tr>
      <th colspan="2">종전 재적학부(과) 및 전공</th>
      <th colspan="2">변경된 재적학부(과) 및 전공</th>
    </tr>
    <tr>
      <th>학부(과)</th>
      <th>전공</th>
      <th>학부(과)</th>
      <th>전공</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">글로벌문화예술경영학부</td>
      <td>문화예술경영전공</td>
      <td rowspan="4">글로벌문화경영학부</td>
      <td>문화예술경영전공</td>
    </tr>
    <tr>
      <td>한국문화예술전공</td>
      <td>한국문화예술전공</td>
    </tr>
    <tr>
      <td>문화예술관광전공</td>
      <td>문화예술관광전공</td>
    </tr>
    <tr>
      <td></td>
      <td>K-뷰티전공</td>
    </tr>
    <tr>
      <td>미술문화복지학과</td>
      <td></td>
      <td rowspan="4">미래평생교육학부</td>
      <td rowspan="2">미술문화복지전공</td>
    </tr>
    <tr>
      <td>반려동물산업학과</td>
      <td></td>
    </tr>
    <tr>
      <td></td>
      <td></td>
      <td rowspan="2">조형예술전공</td>
    </tr>
    <tr>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>`;

const tableMatch = a8286.contentText.match(/(<table[\s\S]*?<\/table>)/i);
if (tableMatch) {
    const new8285Text = a8285.contentText + '\n' + cleanTableHtml;
    const new8286Text = a8286.contentText.replace(tableMatch[0], '').trim();

    const sql8285 = new8285Text.replace(/'/g, "''");
    const sql8286 = new8286Text.replace(/'/g, "''");

    const query = `UPDATE Article SET contentText = '${sql8285}' WHERE id = 'ef9f1247-5c35-492d-bda1-2c1e1ae1d05f';\nUPDATE Article SET contentText = '${sql8286}' WHERE id = '38483e4a-f90b-4fc0-8d5f-4759e2d104e6';`;
    
    fs.writeFileSync('scripts/update_table_clean.sql', query);
    console.log("Clean SQL script generated.");
}
