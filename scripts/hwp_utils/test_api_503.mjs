async function run() {
  const url = "https://yewon-rules.pages.dev/api/rules/c5ded1e4-d909-446e-8334-39d88c6e3cb2";
  const res = await fetch(url);
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
run();
