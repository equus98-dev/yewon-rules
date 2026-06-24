const fs = require('fs');
const data = JSON.parse(fs.readFileSync('debug_api.json'));
const a71 = data.currentRevision.articles.find(a => a.articleNumber === 71);
let html = a71.contentText;
let actualBody = html;
const plainText = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）]([\s\S]*)/);
if (match) {
    const titlePart = plainText.substring(0, plainText.indexOf(match[3]));
    const regexPattern = titlePart.split('').map(c => 
        c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
    ).join('');
    const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
    actualBody = actualBody.replace(remover, '').trim();
    console.log("actualBody:", actualBody.substring(0, 10));
    console.log("char codes:", actualBody.substring(0, 5).split('').map(c => c.charCodeAt(0)));
}
