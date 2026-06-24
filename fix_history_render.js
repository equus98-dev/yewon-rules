const fs = require('fs');
let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf-8').replace(/\r\n/g, '\n');

const t1 = `    // 연혁 표시: <개정 ...> 부분을 파란색으로 렌더링하기 위한 문자열 준비
    let htmlText = decodedText.replace(
      HISTORY_REGEX,
      (match) => \`<span class="text-sky-700 font-medium text-[13px] ml-1">\${normalizeHistoryDate(match).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>\`
    );



    // 수동 인용 태그 파싱 (HTML 처리용)`;

const r1 = `    // 연혁 표시: <개정 ...> 부분을 파란색으로 렌더링하기 위한 문자열 준비
    let htmlText = decodedText.replace(
      HISTORY_REGEX,
      (match) => \`<span class="text-sky-700 font-medium text-[13px] ml-1">\${normalizeHistoryDate(match).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>\`
    );

    // 1-5. Hangs (①~⑳) should start on a new line if they are glued to previous text
    htmlText = htmlText.replace(/([①-⑳])/g, (match, p1, offset, str) => {
      const before = str.slice(0, offset);
      if (before.match(/(?:<br\\s*\\/?>|<\\/p>|<p>|<div[^>]*>|<td[^>]*>|<th[^>]*>|<li[^>]*>)\\s*$/i)) return match;
      if (before.match(/(?:^|\\n)\\s*$/)) return match;
      // 조문 제목 바로 뒤에 나오는 ① 등은 줄바꿈하지 않음
      if (before.match(/(?:^|<[^>]+>)*제\\d+조(?:의\\d+)?(?:<[^>]+>)*\\s*(?:\\[[^\\]]*\\]|〔[^〕]*〕|\\([^)]*\\)|（[^）]*）)?\\s*(?:<[^>]+>)*\\s*$/)) return match;
      return '<br/>' + match;
    });

    // 수동 인용 태그 파싱 (HTML 처리용)`;

content = content.replace(t1, r1);

const t2 = `      const wrapperCls = htmlText.includes('custom-rule-table')
        ? "block w-full overflow-x-auto html-content-inline"
        : "html-table-wrapper block w-full overflow-x-auto html-content-inline";

      return (
        <div 
          className={wrapperCls}
          dangerouslySetInnerHTML={{ __html: htmlText }} 
        />
      );`;

const r2 = `      const wrapperCls = htmlText.includes('custom-rule-table')
        ? "html-content-inline"
        : "html-table-wrapper html-content-inline";

      return (
        <span 
          className={wrapperCls}
          dangerouslySetInnerHTML={{ __html: htmlText }} 
        />
      );`;

content = content.replace(t2, r2);

fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf-8');
console.log('Success');
