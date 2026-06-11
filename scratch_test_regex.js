const str = '[별표] 1-0-1 [별표1] 법인 직원 정원.hwp';
const res = str.replace(/^(\[[^\]]+\]\s*|[\d-]+\s*)+/, '');
console.log("Result:", res);
