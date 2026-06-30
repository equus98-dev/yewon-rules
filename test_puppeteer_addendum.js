const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/test_addendum.html');
  const boundingBox1 = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('부칙'));
    return s ? { left: s.getBoundingClientRect().left, top: s.getBoundingClientRect().top } : null;
  });
  console.log("Position of 부칙:", boundingBox1);
  
  const boundingBox2 = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('[신설'));
    return s ? { left: s.getBoundingClientRect().left, top: s.getBoundingClientRect().top } : null;
  });
  console.log("Position of [신설]:", boundingBox2);

  await browser.close();
})();
