async function run() {
  const res = await fetch("https://yewon-rules.pages.dev/api/rules/8443cb20-c06b-496a-8b55-78a1305d5212");
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
