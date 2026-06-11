const str = '[별표] 1-0-1 [별표1] 법인 직원 정원.hwp';
console.log(str.replace(/^\[(?:별표|별지|전문|서식)\]\s*([\d-]+\s*)?/, ''));
