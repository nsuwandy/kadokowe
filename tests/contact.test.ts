/** Run with: npm test */
import { CONTACT } from "../src/lib/site";

let failed = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); failed++; }
};

// With no override, the default must render exactly as it did when the
// displayed number was a separate hardcoded string.
check("default display", CONTACT.phoneDisplay, "+62 811-3370-378");
check("link is digits only", CONTACT.whatsappNumber, "628113370378");
check("wa.me link", CONTACT.whatsappUrl, "https://wa.me/628113370378");

// The bug this guards: the shown number and the dialled number must be the
// same value, or customers message a number nobody watches.
check(
  "display and link agree",
  CONTACT.phoneDisplay.replace(/[^\d]/g, ""),
  CONTACT.whatsappNumber,
);

if (failed) process.exitCode = 1;
