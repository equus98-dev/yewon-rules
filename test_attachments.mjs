async function run() {
  const res = await fetch('https://yewon-rules.pages.dev/api/attachments');
  const data = await res.json();
  console.log("Is array?", Array.isArray(data));
  console.log("Keys:", Object.keys(data));
  if (Array.isArray(data) && data.length > 0) {
    console.log("First element keys:", Object.keys(data[0]));
    console.log("rule:", data[0].rule);
  }
}
run();
