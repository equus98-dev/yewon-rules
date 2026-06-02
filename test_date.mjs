try {
  console.log(new Date(undefined).toLocaleDateString());
} catch(e) {
  console.log("undefined throws:", e.message);
}
try {
  console.log(new Date(null).toLocaleDateString());
} catch(e) {
  console.log("null throws:", e.message);
}
try {
  console.log(new Date("").toLocaleDateString());
} catch(e) {
  console.log("empty string throws:", e.message);
}
