#!/usr/bin/env node
/*
 * Runs every examples.json against its codec, twice:
 *   - "node"    : the codec loaded with require(), as a Node.js application would;
 *   - "sandbox" : the codec evaluated in a bare JavaScript context (no require,
 *                 module, Buffer or process), close to what TTN and ChirpStack provide.
 *
 * Both language trees (en/ and fr/) are tested.
 *
 * Usage: node scripts/test.js [product-id ...]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const LANGUAGES = ["en", "fr"];
const only = process.argv.slice(2);

function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
    return bytes;
}

function bytesToHex(bytes) {
    return bytes.map((b) => (b & 0xff).toString(16).padStart(2, "0")).join("");
}

function loadSandbox(file) {
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
    return {
        decodeUplink: context.decodeUplink,
        encodeDownlink: context.encodeDownlink,
    };
}

// Values coming out of a vm context have their own prototypes: compare them as JSON.
function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function runExample(codec, example) {
    if (example.type === "uplink") {
        const result = codec.decodeUplink({
            bytes: hexToBytes(example.input.bytes),
            fPort: example.input.fPort,
            recvTime: new Date(0),
        });
        assert.deepStrictEqual(plain(result), example.output);
    } else if (example.type === "downlink-encode") {
        const result = codec.encodeDownlink({ data: example.input.data });
        assert.deepStrictEqual(
            { bytes: bytesToHex(result.bytes), fPort: result.fPort, errors: plain(result.errors), warnings: plain(result.warnings) },
            example.output
        );
    } else {
        throw new Error("unknown example type " + example.type);
    }
}

// ---------------------------------------------------------------------------
// BACnet (MultiTech Conduit): <product>-bacnet-definition.json and <product>-bacnet-codec.js
// ---------------------------------------------------------------------------

const BACNET_TYPES = ["string", "uint8", "uint16", "uint32", "int16", "float"];
const BACNET_UNITS = ["celsius", "percent", "volts", "millivolts", "amperes", "milliamperes", "pascal",
    "ppm", "lux", "minutes", "decibels", "decibels-millivolt"];
const BACNET_STATES = {
    fr: { "état haut": 1, "état bas": 0, "mise à l'état haut": 1, "mise à l'état bas": 0 },
    en: { "high": 1, "low": 0, "switched high": 1, "switched low": 0 },
};

function checkDefinition(def, product, constants) {
    assert.strictEqual(def.decoder, `${product.id}-bacnet-codec.js`, "decoder file name");
    assert.strictEqual(def.encoder !== undefined, product.entryPoints.includes("encodeDownlink"), "encoder declared iff encodeDownlink exists");
    for (const [name, prop] of Object.entries(def.properties)) {
        assert.ok(BACNET_TYPES.includes(prop.type), `${name}: unknown type ${prop.type}`);
        if (prop.units !== undefined) assert.ok(BACNET_UNITS.includes(prop.units), `${name}: unknown units ${prop.units}`);
    }
    for (const name of Object.keys(constants)) {
        const prop = def.properties[name];
        assert.ok(prop && prop.type === "string" && !prop.downlink && !prop.name, `constant ${name}: not a string property`);
    }
}

// Texts the BACnet codec adds to every uplink: fr/<path>/<product>-bacnet-constants.json, same names in both languages.
function bacnetConstants(product, lang) {
    const fr = products.find((p) => p.lang === "fr" && p.id === product.id);
    const file = fr ? path.join(ROOT, "fr", fr.path, `${product.id}-bacnet-constants.json`) : null;
    const out = {};
    if (file && fs.existsSync(file)) {
        for (const [name, texts] of Object.entries(JSON.parse(fs.readFileSync(file, "utf8")))) out[name] = texts[lang];
    }
    return out;
}

// What the BACnet codec must return for a decoded uplink (independent of the generated code).
function expectedBacnet(data, def, lang, constants) {
    const out = {};
    for (const [key, raw] of Object.entries(data)) {
        const prop = def.properties[key];
        if (!prop || prop.downlink || prop.name) continue;
        let value = Array.isArray(raw) ? raw[0] : raw;
        if (value === undefined || value === null) continue;
        if (prop.type === "string") {
            out[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
            continue;
        }
        if (typeof value === "string" && value in BACNET_STATES[lang]) value = BACNET_STATES[lang][value];
        if (typeof value === "number" && isFinite(value)) out[key] = value;
    }
    return Object.assign(out, constants);
}

function bacnetExamples(examples, def, lang, constants) {
    return examples.map((e) => e.type !== "uplink" ? e
        : Object.assign({}, e, { output: Object.assign({}, e.output, { data: expectedBacnet(e.output.data, def, lang, constants) }) }));
}

// ---------------------------------------------------------------------------
// LTE-M / NB-IoT: the same measurements in an extended frame (type 0x09), and the keep alive GPS position.
// Each new generation measurement example is rewritten as the equivalent extended frame: the codec
// must return the same values, plus the frame index and the period.
// ---------------------------------------------------------------------------

const LTE_NAMES = {
    fr: { measure: "Trame de mesure", extended: "Trame de mesure étendue", keepAlive: "Trame de vie", index: "index_trame", period: "periode", timestamp: "horodatage",
        gps: "etat_gps", found: "Position trouvée", notFound: "Position non trouvée" },
    en: { measure: "Measurement frame", extended: "Extended measurement frame", keepAlive: "Keep alive frame", index: "frame_index", period: "period", timestamp: "timestamp",
        gps: "gps_status", found: "Position found", notFound: "Position not found" },
};
const LTE_INDEX = 42;
const LTE_TIMESTAMP = ["6a803ba6", "2026-08-15T10:12:54.000Z"];

function extendedFrame(example, names) {
    const hex = example.input.bytes;
    const header = parseInt(hex.substr(0, 2), 16);
    if ((header & 0xA0) !== 0xA0 || example.output.data.frame_type !== names.measure) return null;
    const timestamp = (header & 0x40) ? hex.substr(2, 8) : "";
    const depth = ((header >> 3) & 0x03) + 1;
    const samples = (header & 0x07) + 1;
    let pos = 2 + timestamp.length;
    let period = 60;
    if (depth > 1 || samples > 1) {
        period = parseInt(hex.substr(pos, 4), 16);
        pos += 4;
    }
    const bytes = ((header & 0x40) ? "c9" : "89") + timestamp + LTE_INDEX.toString(16).padStart(8, "0")
        + depth.toString(16).padStart(2, "0") + samples.toString(16).padStart(4, "0") + period.toString(16).padStart(4, "0")
        + hex.substr(pos);
    const data = Object.assign({}, example.output.data, { frame_type: names.extended });
    data[names.index] = LTE_INDEX;
    data[names.period] = period;
    return {
        description: "LTE-M extended frame: " + example.description,
        type: "uplink",
        input: { bytes: bytes, fPort: example.input.fPort },
        output: Object.assign({}, example.output, { data: data }),
    };
}

function lteExamples(examples, product) {
    if (product.id === "acw-dinrsm-v2") return [];
    const names = LTE_NAMES[product.lang];
    const out = examples.filter((e) => e.type === "uplink").map((e) => extendedFrame(e, names)).filter(Boolean);
    // the same extended frames with a timestamp (header bit 6)
    for (const e of out.slice()) {
        if (e.input.bytes.startsWith("c9")) continue;
        const data = Object.assign({}, e.output.data, { [names.timestamp]: LTE_TIMESTAMP[1] });
        out.push({
            description: e.description + " (timestamped)", type: "uplink",
            input: { bytes: "c9" + LTE_TIMESTAMP[0] + e.input.bytes.substr(2), fPort: e.input.fPort },
            output: Object.assign({}, e.output, { data: data }),
        });
    }
    const keepAlive = (gps, extra) => {
        const data = { frame_type: names.keepAlive, voltagec: 3.176, voltagev: 3.364 };
        return {
            description: "LTE-M keep alive frame with GPS " + gps, type: "uplink",
            input: { bytes: "810d240c68" + gps, fPort: 1 },
            output: { data: Object.assign(data, extra), errors: [], warnings: [] },
        };
    };
    // 45°3'4.9"N 5°32'44.5"E (user guide example), the same in the south-west, and no fix
    out.push(keepAlive("03293ee90513c6", { [names.gps]: names.found, latitude: 45.05135, longitude: 5.5457 }));
    out.push(keepAlive("00293ee90513c6", { [names.gps]: names.found, latitude: -45.05135, longitude: -5.5457 }));
    out.push(keepAlive("03ffffffffffff", { [names.gps]: names.notFound }));
    return out;
}

let failures = 0;
let passed = 0;

const products = [];
for (const lang of LANGUAGES) {
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, lang, "products.json"), "utf8"));
    for (const product of index) products.push(Object.assign({ lang: lang }, product));
}

for (const product of products) {
    if (only.length && !only.includes(product.id)) continue;

    const dir = path.join(ROOT, product.lang, product.path);
    const examples = JSON.parse(fs.readFileSync(path.join(dir, product.examples), "utf8"));
    const targets = [{ label: product.lang + "/" + product.id, file: path.join(dir, product.codec), examples: examples.concat(lteExamples(examples, product)) }];

    const defFile = path.join(dir, `${product.id}-bacnet-definition.json`);
    if (fs.existsSync(defFile)) {
        const def = JSON.parse(fs.readFileSync(defFile, "utf8"));
        const constants = bacnetConstants(product, product.lang);
        try {
            checkDefinition(def, product, constants);
        } catch (err) {
            failures++;
            console.log(`FAIL ${product.lang}/${product.id} bacnet definition: ${err.message}`);
        }
        targets.push({
            label: product.lang + "/" + product.id + " bacnet",
            file: path.join(dir, def.decoder),
            examples: bacnetExamples(examples, def, product.lang, constants),
        });
    }

    for (const target of targets) runTarget(target);
}

function runTarget(target) {
    const label = target.label;
    const file = target.file;
    const examples = target.examples;
    const runtimes = { node: () => require(file), sandbox: () => loadSandbox(file) };

    for (const [runtime, load] of Object.entries(runtimes)) {
        let codec;
        try {
            codec = load();
        } catch (err) {
            failures++;
            console.log(`FAIL ${label} [${runtime}] cannot load codec: ${err.message}`);
            continue;
        }
        let ok = 0;
        for (const example of examples) {
            try {
                runExample(codec, example);
                ok++;
            } catch (err) {
                failures++;
                console.log(`FAIL ${label} [${runtime}] ${example.description}`);
                console.log("     " + String(err.message).split("\n").slice(0, 12).join("\n     "));
            }
        }
        passed += ok;
        console.log(`${ok === examples.length ? "ok  " : "FAIL"} ${label} [${runtime}] ${ok}/${examples.length}`);
    }
}

console.log(`\n${passed} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
