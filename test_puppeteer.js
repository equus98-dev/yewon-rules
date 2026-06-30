const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/test_layout.html');
  const boundingBox = await page.evaluate(() => {
    const gaSpan = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('가. 전체수석'));
    return gaSpan ? gaSpan.getBoundingClientRect().left : -1;
  });
  console.log("Left position of 가.:", boundingBox);
  
  const span19 = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('제19조'));
  console.log("Left position of 제19조:", span19 ? span19.getBoundingClientRect().left : -1);

  await browser.close();
})();
