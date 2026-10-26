#!/usr/bin/env node
/*
 * Builds the English codecs (en/) from the French reference codecs (fr/).
 *
 * The French codec is the source of truth. For each product of fr/products.json this script
 * writes, in en/<family>/<product>/:
 *   - <product>-codec.js : French labels, comments and identifiers translated (the
 *                          identifiers include the output field names);
 *   - examples.json      : the French examples with English descriptions and outputs;
 *   - product.json       : created when missing (fill in the English summary afterwards).
 * The English README.md is written by hand.
 *
 * Translations live in scripts/lib/i18n.js.
 *
 * Usage:
 *   node scripts/build-en.js           write the English files
 *   node scripts/build-en.js --check   exit with an error if en/ is not up to date
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { scan, rewrite } = require("./lib/tokenize");
const T = require("./lib/i18n");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const stale = [];
function output(file, content) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
    if (current === content) return;
    if (CHECK) {
        stale.push(path.relative(ROOT, file));
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    console.log("wrote " + path.relative(ROOT, file));
}

function header(product, summary) {
    return `/**
 * ATIM ${product.name} – ${summary}
 * Codec version ${product.version} – English output
 *
 * LoRaWAN Payload Codec API (TS013) entry points:
${product.entryPoints.map((e) => ` *   ${e}(input)`).join("\n")}
 *
 * Works as is on The Things Stack (TTN v3), ChirpStack v4 and v3, and Node.js.
 * Documentation and examples: README.md and examples.json in this folder.
 * Generated from the French codec by scripts/build-en.js: edit the French codec, then rebuild.
 *
 * Copyright (c) 2026 ATIM – SPDX-License-Identifier: MIT
 */

`;
}

function adapters(entries) {
    let s = `
/* ---------------------------------------------------------------------------
 * Platform adapters
 * ------------------------------------------------------------------------- */

/* ChirpStack v3 */
function Decode(fPort, bytes, variables) {
    return decodeUplink({ bytes: bytes, fPort: fPort, variables: variables }).data;
}
`;
    if (entries.includes("encodeDownlink")) {
        s += `
function Encode(fPort, obj, variables) {
    return encodeDownlink({ data: obj, variables: variables }).bytes;
}
`;
    }
    s += `
/* Node.js / CommonJS */
if (typeof module !== "undefined" && module.exports) {
${entries.map((f) => `    module.exports.${f} = ${f};`).join("\n")}
}
`;
    return s;
}

// A string made only of names, brackets and semicolons declares frame fields
// ('ubyte[2] periode;', '] compte'): the names it contains are identifiers.
function isDeclaration(value) {
    return /^[\w\[\]; ]+$/.test(value) && /[A-Za-z_]/.test(value);
}

function renameDeclaration(value) {
    return value.replace(/[A-Za-z_][\w]*/g, (w) => T.renameId(w));
}

// Every French name must keep a distinct English name within a file.
function checkRenames(code, id) {
    const names = new Set();
    for (const t of scan(code)) {
        if (t.kind === "ident") names.add(t.value);
        else if (t.kind === "string" && !has(T.STRINGS, t.value) && isDeclaration(t.value)) {
            // a name ending the string is a prefix ('] compte' + channel): kept apart from variables
            const words = t.value.match(/[A-Za-z_][\w]*/g);
            const prefix = !/;\s*$/.test(t.value) && /\w$/.test(t.value) ? words[words.length - 1] : null;
            for (const w of words) names.add(w === prefix ? w + "+" : w);
        }
    }
    const byTarget = new Map();
    for (const n of names) {
        const target = n.endsWith("+") ? T.renameId(n.slice(0, -1)) + "+" : T.renameId(n);
        if (!byTarget.has(target)) byTarget.set(target, new Set());
        byTarget.get(target).add(n);
    }
    for (const [target, sources] of byTarget) {
        if (sources.size > 1) {
            throw new Error(`${id}: ${[...sources].join(", ")} would all become "${target}" (scripts/lib/i18n.js, WORDS / OVERRIDES)`);
        }
    }
}

function translateCodec(frCode, product, summary) {
    let code = frCode.replace(/\r\n/g, "\n");

    // French header and platform adapters are replaced by their English versions.
    code = code.replace(/^\/\*\*[\s\S]*?\*\/\n+/, "");
    const cut = code.indexOf("\n/* ---------------------------------------------------------------------------\n * Adaptateurs de plateformes");
    if (cut < 0) throw new Error(product.id + ": platform adapters not found");
    code = code.slice(0, cut);

    // French keep alive values are only accepted by the French codecs.
    for (const fr of Object.values(T.KEEPALIVE_FR)) {
        code = code.split(`:\n            case ${JSON.stringify(fr)}`).join("");
    }

    checkRenames(code, product.id);
    code = rewrite(code, (t) => {
        if (t.kind === "ident") {
            const name = T.renameId(t.value);
            return name === t.value ? undefined : name;
        }
        if (t.kind === "string") {
            if (has(T.STRINGS, t.value)) return JSON.stringify(T.STRINGS[t.value]);
            if (isDeclaration(t.value)) {
                const renamed = renameDeclaration(t.value);
                return renamed === t.value ? undefined : t.quote + renamed + t.quote;
            }
            return undefined;
        }
        const trimmed = t.text.trim();
        if (!has(T.COMMENTS, trimmed)) return undefined;
        const body = t.text.replace(trimmed, T.COMMENTS[trimmed]);
        return t.kind === "line" ? "//" + body : "/*" + body + "*/";
    });

    code = code.replace(/\s+$/, "\n");

    return header(product, summary) + code + adapters(product.entryPoints);
}

function translateExamples(frExamples, product) {
    const out = [];
    for (const e of frExamples) {
        const ka = e.input.data && e.input.data.setKeepAlivePeriod;
        if (ka && Object.values(T.KEEPALIVE_FR).includes(ka)) continue;
        if (!has(T.EXAMPLES_EN, e.description)) {
            throw new Error(`${product.id}: no English description for "${e.description}" (scripts/lib/i18n.js, EXAMPLES_FR)`);
        }
        const en = { description: T.EXAMPLES_EN[e.description], type: e.type, input: e.input, output: e.output };
        if (e.type === "uplink") en.output = Object.assign({}, e.output, { data: T.dataEn(e.output.data) });
        out.push(en);
    }
    return out;
}

const frIndex = readJson(path.join(ROOT, "fr", "products.json"));
const enIndex = [];

for (const fr of frIndex) {
    if (!has(T.FAMILIES, fr.family)) throw new Error(`${fr.id}: unknown family "${fr.family}" (scripts/lib/i18n.js, FAMILIES)`);
    const family = T.FAMILIES[fr.family];
    const frDir = path.join(ROOT, "fr", fr.path);
    const enDir = path.join(ROOT, "en", family, fr.id);

    const enMetaFile = path.join(enDir, "product.json");
    const previous = fs.existsSync(enMetaFile) ? readJson(enMetaFile) : null;
    if (!previous) console.log(`note: ${fr.id} has no English product.json yet, the French summary is used`);
    const meta = Object.assign({}, fr, {
        summary: previous ? previous.summary : fr.summary,
        family: family,
        language: "en",
    });
    delete meta.path;

    output(path.join(enDir, fr.codec), translateCodec(fs.readFileSync(path.join(frDir, fr.codec), "utf8"), meta, meta.summary));
    output(path.join(enDir, fr.examples), JSON.stringify(translateExamples(readJson(path.join(frDir, fr.examples)), fr), null, 2) + "\n");
    output(enMetaFile, JSON.stringify(meta, null, 2) + "\n");
    if (fr.image && !fs.existsSync(path.join(enDir, fr.image)) && !CHECK) {
        fs.copyFileSync(path.join(frDir, fr.image), path.join(enDir, fr.image));
    }
    if (!fs.existsSync(path.join(enDir, "README.md"))) console.log(`note: write ${path.relative(ROOT, path.join(enDir, "README.md"))}`);

    enIndex.push(Object.assign({}, meta, { path: family + "/" + fr.id }));
}

output(path.join(ROOT, "en", "products.json"), JSON.stringify(enIndex, null, 2) + "\n");

if (CHECK) {
    if (stale.length) {
        console.log("en/ is not up to date with fr/. Run: npm run build:en");
        for (const f of stale) console.log("  " + f);
        process.exit(1);
    }
    console.log("en/ is up to date with fr/");
}
