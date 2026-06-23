export const compareAttachmentNames = (aStr: string, bStr: string) => {
  const prefixRegex = /^\[([^\]]+)\]/;
  const matchA = aStr.match(prefixRegex);
  const matchB = bStr.match(prefixRegex);
  const prefixA = matchA ? matchA[1] : '';
  const prefixB = matchB ? matchB[1] : '';
  
  if (prefixA !== prefixB) {
    return prefixA.localeCompare(prefixB, 'ko');
  }
  
  const extractNum = (str: string) => {
    const match = str.match(/제(\d+)(?:[-의](\d+))?(?:호|서식)?/);
    if (match) {
       return [parseInt(match[1], 10), parseInt(match[2] || "0", 10)];
    }
    return null;
  };

  const numA = extractNum(aStr);
  const numB = extractNum(bStr);

  if (numA && numB) {
     if (numA[0] !== numB[0]) return numA[0] - numB[0];
     if (numA[1] !== numB[1]) return numA[1] - numB[1];
  }

  return aStr.localeCompare(bStr, 'ko', { numeric: true });
};
