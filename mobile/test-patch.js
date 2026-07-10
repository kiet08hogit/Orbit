const WB = require('expo-web-browser');
try {
  const orig = WB.openAuthSessionAsync;
  WB.openAuthSessionAsync = () => {};
  console.log("Patch success!");
} catch (e) {
  console.error("Patch failed:", e.message);
}
