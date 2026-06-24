const html = '<p><span style="color: navy">제72조</span>&nbsp;&nbsp;&nbsp;(하부조직) ① 대학교에...</p>';
const plainText = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）](.*)/);

if (match) {
  const titlePart = plainText.substring(0, plainText.indexOf(match[3]));
  console.log('titlePart:', titlePart);
  
  const regexPattern = titlePart.split('').map(c => 
    c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
  ).join('');
  
  const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
  console.log('result:', html.replace(remover, '').trim());
}
