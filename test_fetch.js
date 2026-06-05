async function test() {
  const res2 = await fetch('https://a9a5911e.yewon-rules.pages.dev/api/rules/c9de5cda-3279-4efc-b336-e6aa0ad538f0');
  const detail = await res2.json();
  console.log(JSON.stringify(detail, null, 2));
}
test();
