async function run() {
  const base = 'https://yewon-rules.pages.dev/files/rules/';
  const name = '1-0-1_학교법인_예원예술대학교_정관.hwp';
  
  const urls = [
    base + encodeURI(name),
    base + encodeURIComponent(name),
    base + escape(name),
    base + name
  ];
  
  for (let u of urls) {
    try {
      const res = await fetch(u);
      console.log(res.status, u);
    } catch(e) {
      console.log("error", u);
    }
  }
}
run();
