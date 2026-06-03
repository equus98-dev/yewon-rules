import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const apiDir = path.join(process.cwd(), 'src/app/api');

walkDir(apiDir, function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it creates a pool
    if (content.includes('new Pool(')) {
      // Remove poolConfig
      content = content.replace(/const poolConfig = {[\s\S]*?ssl: { rejectUnauthorized: false },\s*};/g, '');
      
      // Remove pool import
      content = content.replace(/import { Pool } from "@neondatabase\/serverless";/g, 'import { pool } from "@/lib/db";');
      
      // Remove new Pool instance creation
      content = content.replace(/const pool = new Pool\(poolConfig\);/g, '');
      
      // Remove pool.end() from catch blocks
      content = content.replace(/await pool\.end\(\);/g, '');

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Refactored ${filePath}`);
    }
  }
});
