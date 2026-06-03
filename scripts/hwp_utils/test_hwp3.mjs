import CFB from 'cfb';
import fs from 'fs';
import path from 'path';

try {
  const filePath = path.join('E:', '예원예술대학교_규정관리시스템', 'public', 'files', 'rules', '1-0-1_학교법인_예원예술대학교_정관.hwp');
  const fileData = fs.readFileSync(filePath);
  
  const cfb = CFB.read(fileData, { type: 'buffer' });
  const prvTextEntry = cfb.FullPaths.find(p => p.includes('PrvText'));
  
  if (prvTextEntry) {
    const entry = CFB.find(cfb, prvTextEntry);
    if (entry && entry.content) {
      // Node.js Buffer from utf16le
      let text = Buffer.from(entry.content).toString('utf16le');
      
      // Clean up text
      text = text.replace(/\x00/g, '');
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      const res = [];
      for(let i = 0; i < lines.length; i++) {
        if (lines[i].includes('12조') || lines[i].includes('회계년도')) {
           res.push(`[${i}] ${lines[i]}`);
        }
      }
      fs.writeFileSync('prvtext_search.txt', res.join('\n'), 'utf8');
      console.log('Search done');
    }
  }
} catch (e) {
  console.error(e.message);
}
