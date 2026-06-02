const fs = require('fs');
const file = 'src/components/SidebarTree.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('selectedItems={activeRuleId ? activeRuleId : undefined}', 'selectedItems={activeRuleId || null}');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed SidebarTree.tsx');
