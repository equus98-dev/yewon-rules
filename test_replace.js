const plainText = '제71조 (학부(과)장)\n① 대학교의 각 학부(과)에 학부(과)장을 둔다.';
let actualBody = plainText; // Simplify actualBody

const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）](.*)/);
let articleNumOverride = '';
let articleTitleOverride = '';

if (match) {
   articleNumOverride = match[1].replace(/\s/g, '');
   articleTitleOverride = `(${match[2]})`;
   const titlePart = plainText.substring(0, plainText.indexOf(match[3]));
   console.log('titlePart:', JSON.stringify(titlePart));
   const regexPattern = titlePart.split('').map(c => 
     c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
   ).join('');
   const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
   console.log('remover:', remover);
   actualBody = actualBody.replace(remover, '').trim();
}

console.log('articleNumOverride:', articleNumOverride);
console.log('articleTitleOverride:', articleTitleOverride);
console.log('actualBody:', actualBody);
