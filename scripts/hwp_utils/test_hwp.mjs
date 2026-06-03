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
      // UTF-16LE decoding
      const text = Buffer.from(entry.content).toString('utf16le');
      
      const lines = text.split('\n').map(l => l.replace(/\x00/g, '').trim()).filter(Boolean);
      const idx = lines.findIndex(l => l.includes('제12조'));
      if (idx !== -1) {
        console.log('Found 제12조!');
        console.log(lines.slice(idx, idx + 5).join('\n'));
      } else {
        console.log('제12조 not found in PrvText.');
      }
    }
  } else {
    console.log('PrvText not found.');
  }
} catch (e) {
  console.error(e.message);
}
