const fs = require('fs');
let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// Find await components.ComponentMod.handler
code = code.replace(
  /await components\.ComponentMod\.handler/g,
  '(() => { console.log("ComponentMod:", components.ComponentMod); console.log("Handler:", components.ComponentMod && components.ComponentMod.handler); return components.ComponentMod.handler; })()'
);

fs.writeFileSync('.open-next/server-functions/default/handler.mjs', code);
console.log('Patched handler.mjs');
