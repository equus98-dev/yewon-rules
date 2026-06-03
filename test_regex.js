const text = "보고하여야 한다. (개정 2008.7. 16. 개정 2015.2.16.) 1. 목적 가. 나. 다. 라.";
let formatted = text
  .replace(/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮)/g, '\n$1')
  .replace(/(?<!\d+\.\s*)(?<!\d)(?<!\d\.)(\d{1,2}\.)\s+(?=[^\d])/g, '\n$1 ')
  .replace(/(^|\s)([가-하]\.)\s+/g, '$1\n$2 ')
  .replace(/(제\d+조의?\d*\([^)]+\))/g, '\n\n$1')
  .replace(/(제\d+장\s+[^\s]+)/g, '\n\n$1');

console.log(formatted);
