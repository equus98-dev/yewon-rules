import fs from 'fs';

async function checkAllRules() {
    console.log("Fetching categories/tree...");
    const treeRes = await fetch('https://yewon-rules.pages.dev/api/categories');
    const treeData = await treeRes.json();

    let ruleIds = [];
    
    function extractRules(node) {
        if (node.type === 'file' && node.id) {
            ruleIds.push({id: node.id, title: node.name});
        }
        if (node.children && node.children.length > 0) {
            node.children.forEach(extractRules);
        }
    }
    
    treeData.forEach(extractRules);
    console.log(`Found ${ruleIds.length} rules in the tree.`);
    
    let errors = [];
    for (let i = 0; i < ruleIds.length; i++) {
        const rule = ruleIds[i];
        const res = await fetch(`https://yewon-rules.pages.dev/api/rules/${rule.id}`);
        if (!res.ok) {
            errors.push(`[${res.status}] Rule ${rule.id} (${rule.title}) failed!`);
        } else {
            const data = await res.json();
            if (data.error) {
                errors.push(`[JSON ERROR] Rule ${rule.id} (${rule.title}) returned error object!`);
            }
        }
        if (i % 50 === 0) console.log(`Checked ${i} rules...`);
    }
    
    console.log("\nResults:");
    if (errors.length > 0) {
        errors.forEach(e => console.log(e));
    } else {
        console.log("ALL rules loaded successfully with 200 OK!");
    }
}

checkAllRules().catch(console.error);
