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
      const buf = Buffer.from(entry.content);
      const text = buf.toString('utf16le');
      
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('12')) {
          console.log(`[${i}]: ${lines[i].trim()}`);
        }
      }
    }
  }
} catch (e) {
  console.error(e.message);
}
