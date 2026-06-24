async function run() {
  const res = await fetch("https://yewon-rules.vercel.app/api/rules/1d13f9c3-169c-4740-8bfa-1994a5e2f75d?t=" + Date.now()); // Need the actual rule ID. I'll get it from DB.
}
run();
