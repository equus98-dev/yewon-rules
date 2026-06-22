const text = '이 규정은... 한다. 제2조(적용범위) ... 재무회계규칙 제52조(법인에 비치할 장부와 서류) 및 제53조(학교에 비치할 장부와 서류)에 의한다.';

const regex1 = /((?<![『「])제\d+조의?\d*\s*(?:\[(?![\s\S]*?\[\/cite\])|[〔(（])[^\]〕)）]+[\]〕)）])/g;
console.log('Original regex:', text.replace(regex1, '\n\n$1'));

const regex2 = /(^|\n|\.\s*)((?<![『「])제\d+조의?\d*\s*(?:\[(?![\s\S]*?\[\/cite\])|[〔(（])[^\]〕)）]+[\]〕)）])/g;
console.log('New regex:', text.replace(regex2, '$1\n\n$2'));
