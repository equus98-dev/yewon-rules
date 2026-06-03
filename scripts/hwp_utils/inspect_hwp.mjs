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
      console.log('First 20 bytes:', buf.slice(0, 20));
      // Try decoding from offset 0
      console.log('Offset 0:', buf.toString('utf16le', 0, 40));
      // Try decoding from offset 1
      console.log('Offset 1:', buf.toString('utf16le', 1, 41));
      // Try offset 2
      console.log('Offset 2:', buf.toString('utf16le', 2, 42));
    }
  }
} catch (e) {
  console.error(e.message);
}
