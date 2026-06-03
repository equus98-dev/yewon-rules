async function run() {
  try {
    const res = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=");
    const rules = await res.json();
    
    for (const r of rules) {
      try {
        const res2 = await fetch("https://yewon-rules.pages.dev/api/rules/" + r.id);
        if (!res2.ok) {
          console.log("API Error for rule", r.title, res2.status);
          console.log(await res2.text());
          return; // Stop on first error
        }
      } catch (e) {
      }
    }
  } catch (e) {
    console.log("Error", e);
  }
}
run();
