const React = require('react');

const text = `제5조(출장비 집행 및 관리) ① 사업 수행을 위하여 출장할 수 있으며, 출장비는 출장여비 항목으로 집행한다. ② 출장비 집행 시 사전 출장신청 및 사후 출장복명을 원칙으로 한다. ③ 출장비는 공무원 여비 규정을 준용한다. ④ 출장비 지급 기준은 다음과 같다.
<table><tr><td>전국</td></tr></table>
⑤ 자가용을 이용한 출장의 경우 교통비 지급 기준은 다음 각 호와 같다. 1. 자가용 운임비는 10km당 휘발유 1리터를 기준으로 산정한다. 2. 휘발유 단가는 한국석유공사 오피넷(www.opinet.co.kr)에 고시된 출장일 기준 가격을 적용한다. 3. 통행료는 통행영수증(실물 또는 온라인)을 증빙으로 제출한 경우에 한하여 실비 지급한다.`;

// Mock renderTextWithHistory
const renderTextWithHistory = (t) => t;
const hideHistory = false;

const formatGluedText = (text, isArticleBody = false) => {
    if (/<table/i.test(text)) {
      const parts = text.split(/(<table[\s\S]*?<\/table>)/i);
      if (parts.length > 1) {
        return parts.map((part, idx) => {
            if (/<table/i.test(part)) {
              return `[TABLE WRAPPER: ${part}]`;
            }
            if (!part.trim()) return null;
            return formatGluedText(part, isArticleBody);
        });
      }
    }

    if (/<tr|<td|<th/i.test(text)) {
       return `[HTML TABLE WRAPPER (fallback): ${text}]`;
    }

    if (text.length < 50 && !/^\s*제\d+(?:조|장|관|절)/.test(text)) {
        if (!hideHistory && (text.includes("제정") || text.includes("개정") || text.includes("시행")) && /^\s*[\[〔]/.test(text)) {
             return `[BADGE: ${text}]`;
        }
        return `[SPAN: ${text}]`;
    }

    let formatted = text
      .replace(/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮)/g, '\n$1')
      .replace(/(?<!\d+\.\s*)(?<!\d)(\d{1,2}\.)\s+(?=[^\d])/g, '\n$1 ')
      .replace(/(^|\s)([가-하]\.)\s+/g, '$1\n$2 ')
      .replace(/(제\d+조의?\d*\s*[\[〔(（][^\]〕)）]+[\]〕)）])\s*\n([①-⑮])/g, '$1 $2')
      .replace(/(제\d+조의?\d*\s*[\[〔(（][^\]〕)）]+[\]〕)）])/g, '\n\n$1')
      .replace(/(제\d+(?:장|절|관)\s+[^\s]+)/g, '\n\n$1')
      .replace(/(^|\n)(부\s*칙)\s*(.*)/g, '\n\n$2 $3');

    const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);

    return lines.map((trimmed, idx) => {
        if (/^[①-⑮]/.test(trimmed)) {
             return `[PARAGRAPH: ${trimmed}]`;
        } else if (/^\d{1,2}\./.test(trimmed)) {
             return `[ITEM: ${trimmed}]`;
        } else if (/^제\d+조/.test(trimmed)) {
             const match = trimmed.match(/^(제\d+조의?\d*)\s*[\[〔(（]([^\]〕)）]+)[\]〕)）](.*)/);
             if (match) {
                 return `[ARTICLE: ${match[1]}(${match[2]}) BODY: ${match[3]}]`;
             } else {
                 return `[ARTICLE NO MATCH: ${trimmed}]`;
             }
        }
        return `[TEXT: ${trimmed}]`;
    });
};

console.log(JSON.stringify(formatGluedText(text), null, 2));
