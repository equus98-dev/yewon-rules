const htmlText = '<span class="text-sky-700 font-medium text-[13px] ml-1">&lt;개정 2001. 2. 28.&gt;</span>';
console.log('Regex match:', /<table|<tr|<td|<th|<br|<p/i.test(htmlText));
const decodedText = '(2001. 2. 28)';
const HISTORY_REGEX = /((?:&lt;|[<(\[＜（])(?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)(?:&gt;|[>\])＞）]))/gi;
const parts = decodedText.split(HISTORY_REGEX);
console.log('Parts:', parts);
