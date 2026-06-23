const fs = require('fs');
let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf-8').replace(/\r\n/g, '\n');

const t2 = `    let formatted = text
      .replace(/(?:^|\\n)\\s*<br\\s*\\/?>/gi, '\\n')
      .replace(/<br\\s*\\/?>\\s*(?=\\n|$)/gi, '\\n')
      .replace(/([①-⑳])/g, (match, p1, offset, string) => {
        const before = string.slice(0, offset);
        if (before.match(/(?:\\n|^)\\s*$/)) return match;
        return '\\n' + match;
      })`;

const r2 = `    let formatted = text
      .replace(/(?:^|\\n)\\s*<br\\s*\\/?>/gi, '\\n')
      .replace(/<br\\s*\\/?>\\s*(?=\\n|$)/gi, '\\n')
      .replace(/([①-⑳])/g, (match, p1, offset, string) => {
        const before = string.slice(0, offset);
        if (before.match(/(?:\\n|^)\\s*$/)) return match;
        // 조문 제목 바로 뒤에 나오는 ① 등은 줄바꿈하지 않음
        if (before.match(/(?:^|<[^>]+>)*제\\d+조(?:의\\d+)?(?:<[^>]+>)*\\s*(?:\\[[^\\]]*\\]|〔[^〕]*〕|\\([^)]*\\)|（[^）]*）)?\\s*(?:<[^>]+>)*\\s*$/)) return match;
        return '\\n' + match;
      })`;

content = content.replace(t2, r2);

const t3 = `                           <span className="font-bold mr-1 text-[#000080]">{fullTitle}</span>
                           {bodyText && <span className="font-normal text-slate-800">{renderTextWithHistory(bodyText)}</span>}`;

const r3 = `                           <span className="font-bold text-[#000080]">{articleNum}</span>
                           {titleText && <span className="font-normal text-slate-800 ml-1 mr-1">{titleText}</span>}
                           {bodyText && <span className="font-normal text-slate-800">{renderTextWithHistory(bodyText)}</span>}`;

content = content.replace(t3, r3);

const t4 = `                        {(() => {
                          let articleTitleOverride = parsedTitle;
                          let articleNumOverride = safeNum;
                          let actualBody = safeText;
                          if (parsedTitle) {
                             actualBody = actualBody.replace(parsedTitle, "").trim();
                          }`;

const r4 = `                        {(() => {
                          let articleTitleOverride = parsedTitle;
                          let articleNumOverride = safeNum || "";
                          let actualBody = safeText;

                          if (articleNumOverride) {
                              const numMatch = articleNumOverride.match(/^(제\\d+조(?:의\\d+)?)\\s*(\\([^)]+\\))$/);
                              if (numMatch) {
                                  articleNumOverride = numMatch[1];
                                  articleTitleOverride = numMatch[2] + (articleTitleOverride || "");
                              }
                          }

                          if (parsedTitle) {
                             actualBody = actualBody.replace(parsedTitle, "").trim();
                          }`;

content = content.replace(t4, r4);

const t5 = `                          return (
                            <>
                              <span className="font-bold mr-1 text-[#000080]">{articleNumOverride}{articleTitleOverride}</span>
                              {actualBody && <span className="font-normal">{formatGluedText(actualBody, true)}</span>}
                            </>
                          );`;

const r5 = `                          return (
                            <>
                              <span className="font-bold text-[#000080]">{articleNumOverride}</span>
                              {articleTitleOverride && <span className="font-normal text-slate-800 ml-1 mr-1">{articleTitleOverride}</span>}
                              {actualBody && <span className="font-normal">{formatGluedText(actualBody, true)}</span>}
                            </>
                          );`;

content = content.replace(t5, r5);

fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf-8');
console.log('Success');
