import { execSync } from 'child_process';

const articleId = 'c719ca8b-2243-48da-8f0e-3bf9ffeaac49'; // From previous query

const newTitle = '수료증 및 자격인증서·자격증 수여';
const newContentJson = [
  { type: "article", num: "제22조", text: "(수료증 및 자격인증서·자격증 수여) ① 각 과정별로 소정의 교육과정을 이수한자는 수료를 인정하고 수료증(별지 제1호 서식)를 수여한다." },
  { type: "paragraph", num: "②", text: "과정개설 공인기관 및 민간협회에서 실시하는 소정의 자격검정시험에 합격하면 해당기관에서 발행하는 자격증을 수여한다." }
];
const newContentText = "제22조(수료증 및 자격인증서·자격증 수여) ① 각 과정별로 소정의 교육과정을 이수한자는 수료를 인정하고 수료증(별지 제1호 서식)를 수여한다.\n② 과정개설 공인기관 및 민간협회에서 실시하는 소정의 자격검정시험에 합격하면 해당기관에서 발행하는 자격증을 수여한다.";

const sql = `UPDATE Article SET title = '${newTitle}', contentJson = '${JSON.stringify(newContentJson).replace(/'/g, "''")}', contentText = '${newContentText.replace(/'/g, "''")}' WHERE id = '${articleId}';`;

try {
  const raw1 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sql}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log(raw1);
} catch (e) {
  console.error("Error executing query:", e.message);
}
