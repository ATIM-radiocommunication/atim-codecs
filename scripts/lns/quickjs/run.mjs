// Runs every examples.json inside QuickJS, the JavaScript engine of ChirpStack v4, both as a
// classic script and as an ES module (strict mode, module scope).
//
// Usage: npm install && npm run test:chirpstack-v4
import { getQuickJS } from "quickjs-emscripten";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const QuickJS = await getQuickJS();

function hexToBytes(h) { const b = []; for (let i = 0; i < h.length; i += 2) b.push(parseInt(h.substr(i, 2), 16)); return b; }
function toHex(a) { return a.map((x) => (x & 0xff).toString(16).padStart(2, "0")).join(""); }

function runIn(mode, code, call) {
  const vm = QuickJS.newContext();
  try {
    if (mode === "module") {
      // ES module: strict mode and module scope
      const r = vm.evalCode(code + `
;globalThis.__r = JSON.stringify(${call});`, "codec.mjs", { type: "module" });
      if (r.error) { const e = vm.dump(r.error); r.error.dispose(); return { error: e }; }
      r.value.dispose();
    } else {
      const r = vm.evalCode(code + `\n;globalThis.__r = JSON.stringify(${call});`, "codec.js");
      if (r.error) { const e = vm.dump(r.error); r.error.dispose(); return { error: e }; }
      r.value.dispose();
    }
    const h = vm.getProp(vm.global, "__r");
    const out = vm.dump(h);
    h.dispose();
    return { value: JSON.parse(out) };
  } finally {
    vm.dispose();
  }
}

let pass = 0, fail = 0;
for (const lang of ["en", "fr"]) {
  for (const p of JSON.parse(fs.readFileSync(path.join(ROOT, lang, "products.json"), "utf8"))) {
    const dir = path.join(ROOT, lang, p.path);
    const code = fs.readFileSync(path.join(dir, p.codec), "utf8");
    const examples = JSON.parse(fs.readFileSync(path.join(dir, p.examples), "utf8"));
    for (const mode of ["script", "module"]) {
      let ok = 0;
      for (const e of examples) {
        const call = e.type === "uplink"
          ? `decodeUplink({ bytes: ${JSON.stringify(hexToBytes(e.input.bytes))}, fPort: ${e.input.fPort}, recvTime: new Date(0), variables: {} })`
          : `encodeDownlink({ data: ${JSON.stringify(e.input.data)}, variables: {} })`;
        const r = runIn(mode, code, call);
        let got = r.error ? { error: r.error } : r.value;
        if (!r.error && e.type !== "uplink") got = { bytes: toHex(got.bytes), fPort: got.fPort, errors: got.errors, warnings: got.warnings };
        if (JSON.stringify(got) === JSON.stringify(e.output) || deepEq(got, e.output)) ok++;
        else { fail++; if (fail < 6) console.log(`FAIL ${lang}/${p.id} [${mode}] ${e.description}\n   got ${JSON.stringify(got).slice(0, 200)}`); }
      }
      pass += ok;
      console.log(`${ok === examples.length ? "ok  " : "FAIL"} ${lang}/${p.id} [quickjs ${mode}] ${ok}/${examples.length}`);
    }
  }
}
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEq(a[k], b[k]));
}
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
