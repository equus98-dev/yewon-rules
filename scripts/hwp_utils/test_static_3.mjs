async function run() {
  const urls = [
    'https://yewon-rules.pages.dev/yewon.jpg',
    'https://yewon-rules.pages.dev/files/rules/1-0-1_%ED%95%99%EA%B5%90%EB%B2%95%EC%9D%B8_%EC%98%88%EC%9B%90%EC%98%88%EC%88%A0%EB%8C%80%ED%95%99%EA%B5%90_%EC%A0%95%EA%B4%80.hwp'
  ];
  for (let u of urls) {
    const res = await fetch(u);
    console.log(u, res.status);
  }
}
run();
