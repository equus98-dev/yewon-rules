import { execSync } from 'child_process';

const sqlCategories = `
UPDATE Category SET name = '제5편 부속/부설기관/센터 (제1장 부속기관/센터)' WHERE id = 'c44d6af8-eb25-4f0d-8214-6e4492b3130e';
UPDATE Category SET name = '제5편 부속/부설기관/센터 (제2장 부설연구소/센터)' WHERE id = '6f8b8277-05ad-4d7e-a3a1-741cfdd77e8a';
`;

const articleId = '4e56dcb4-a3ff-48df-9a1d-8390a91c741d';
const newTitle = '선거방법';
const newContentJson = [
  { type: "article", num: "제49조", text: "(선거방법) 본 회의 선거는 보통, 평등, 직접, 비밀선거로 한다." }
];
const newContentText = "제49조(선거방법) 본 회의 선거는 보통, 평등, 직접, 비밀선거로 한다.";

const sqlArticle = `UPDATE Article SET title = '${newTitle}', contentJson = '${JSON.stringify(newContentJson).replace(/'/g, "''")}', contentText = '${newContentText.replace(/'/g, "''")}' WHERE id = '${articleId}';`;

try {
  const raw1 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlCategories.replace(/\n/g, ' ')}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Categories updated:", raw1);
} catch (e) {
  console.error("Error updating categories:", e.message);
}

try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Article updated:", raw2);
} catch (e) {
  console.error("Error updating article:", e.message);
}
