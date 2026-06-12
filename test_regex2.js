const text1 = '정관 제7장 제2절 및';
const text2 = '한다. 제2장 총칙';
const text3 = '한다. 제2장 조직';

// Original regex
const regex1 = /(제\d+(?:장|절|관)\s+(?!(?:제\d+|및|에|의|은|는|이|가|을|를|과|와)(?:\s|$))[^\s]+)/g;

// Modified regex
const regex2 = /(제\d+(?:장|절|관)\s+(?!(?:제\d+(?:조|항|호|목|장|절|관)?|및|에|의|은|는|이|가|을|를|과|와)(?:\s|$))[^\s]+)/g;

console.log("Original regex:");
console.log(text1.replace(regex1, '\n\n$1'));
console.log(text2.replace(regex1, '\n\n$1'));
console.log(text3.replace(regex1, '\n\n$1'));

console.log("\nModified regex:");
console.log(text1.replace(regex2, '\n\n$1'));
console.log(text2.replace(regex2, '\n\n$1'));
console.log(text3.replace(regex2, '\n\n$1'));
