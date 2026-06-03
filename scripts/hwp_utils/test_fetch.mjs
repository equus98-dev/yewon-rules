async function test() {
  try {
    const res = await fetch("https://cloudflare.com"); // Returns HTML
    const data = await res.json();
    console.log("Data:", data);
  } catch (e) {
    console.log("Caught:", e.message);
  }
}
test();
