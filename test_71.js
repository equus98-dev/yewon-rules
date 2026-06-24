const html = '<p>제71조(학부(과)장) ① 대학교의 각 학부(과)에 학부(과)장을 둔다.</p><p>② 학부(과)장은 총장의 명을 받아 각 학부(과)의 교무를 총괄하며 학생을 지도한다.</p>';
let actualBody = html;
const plainText = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）]([\s\S]*)/);
if (match) {
    const titlePart = plainText.substring(0, plainText.indexOf(match[3]));
    const regexPattern = titlePart.split('').map(c => 
        c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
    ).join('');
    const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
    console.log('remover:', remover);
    actualBody = actualBody.replace(remover, '').trim();
    console.log('actualBody after replace:', actualBody);
} else {
    console.log("No match");
}
