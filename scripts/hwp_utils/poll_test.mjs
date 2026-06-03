async function run() {
  const url = 'https://yewon-rules.pages.dev/files/rules/test.hwp';
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url);
      console.log(new Date().toISOString(), res.status);
      if (res.status === 200) {
        console.log("SUCCESS!");
        return;
      }
    } catch(e) {
      console.log(e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}
run();
