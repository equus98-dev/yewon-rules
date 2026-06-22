const fs = require('fs');
const execSync = require('child_process').execSync;

const data = JSON.parse(fs.readFileSync('docs/202_addendums_full.json', 'utf8'));
const articles = data[0].results;

const addendums = articles.filter(a => a.title && a.title.startsWith('부칙'));

let tablesFixed = 0;
let fileIndex = 0;

for (let a of addendums) {
    if (a.id === '8f46471d-1aba-4dd3-a28c-c492fc0e3734') continue;

    let content = a.contentText || '';
    if (content.includes('<table')) {
        const tableRegex = /<table[\s\S]*?<\/table>/gi;
        
        content = content.replace(tableRegex, (match) => {
            tablesFixed++;
            let cleanTable = match.replace(/\r?\n/g, '');
            cleanTable = cleanTable.replace(/<table[^>]*>/i, '<table class="custom-rule-table w-full border-collapse border-[2px] border-black text-center text-[13px] my-4 break-keep">');
            cleanTable = cleanTable.replace(/<td([^>]*)>/gi, '<td$1 class="bg-white border border-slate-300 p-2 align-middle text-slate-800">');
            cleanTable = cleanTable.replace(/<th([^>]*)>/gi, '<th$1 class="bg-[#e2e2e2] border border-black font-semibold p-2 align-middle">');
            return cleanTable;
        });

        if (content !== a.contentText) {
            const safeContent = content.replace(/'/g, "''");
            const sql = `UPDATE Article SET contentText = '${safeContent}' WHERE id = '${a.id}';`;
            const filename = `scripts/update_table_${fileIndex}.sql`;
            fs.writeFileSync(filename, sql);
            console.log(`Executing ${filename} for article ${a.articleNumber}...`);
            try {
                execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=${filename}`, {stdio: 'inherit'});
            } catch(e) {
                console.error(`Failed to execute ${filename}`);
            }
            fileIndex++;
        }
    }
}

console.log(`Successfully processed ${fileIndex} addendums and fixed ${tablesFixed} tables.`);
