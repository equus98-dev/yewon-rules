async function run() {
  for(let i=0; i<5; i++) {
    const res = await fetch("https://yewon-rules.pages.dev/api/rules/8443cb20-c06b-496a-8b55-78a1305d5212");
    if (!res.ok) {
      console.log("Failed:", res.status, await res.text());
    } else {
      console.log("Success:", i);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
run();
