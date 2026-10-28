<img src="../atim.png" alt="ATIM" height="60">

# ATIM LoRaWAN Codecs – English

Payload decoders and downlink encoders for the **ATIM ACW** range of LoRaWAN devices, with **English output** (field names and labels).

*Version française : [../fr](../fr/README.md)*

Each codec is a single JavaScript file that follows the
[LoRaWAN Payload Codec API (TS013)](https://resources.lora-alliance.org/technical-specifications/ts013-1-0-0-payload-codec-api).
It is self-contained and has no dependencies. Copy it into your network server, or load it from Node.js.

## Supported platforms

| Platform | How to use the codec |
|---|---|
| The Things Stack (TTN v3) | Paste the file as a *Custom Javascript formatter* (uplink and downlink) |
| ChirpStack v4 | Paste the file in the device profile *Codec* tab |
| ChirpStack v3 | Same file: the `Decode` / `Encode` adapters are included |
| MultiTech Conduit (BACnet) | Import `<product>-bacnet-definition.json` and `<product>-bacnet-codec.js`, see [docs/bacnet.md](docs/bacnet.md) |
| Node.js | `require()` the file |

Step-by-step instructions are in [docs/platforms.md](docs/platforms.md).

## Devices

### Environment

| Device | Description | Codec |
|---|---|---|
| ACW-TH, TH-I, TH-I v2, TH-O | Temperature & humidity sensor | [environment/acw-thx](environment/acw-thx) |
| ACW-THAQ | Indoor air quality (temperature, humidity, CO2, VOC) | [environment/acw-thaq](environment/acw-thaq) |
| ACW-TCR | Temperature & humidity probe with inertial measurement | [environment/acw-tcr](environment/acw-tcr) |
| ACW-TMxP | One or two PT1000 temperature probes | [environment/acw-tmxp](environment/acw-tmxp) |
| ACW-PTMxP | Differential pressure transmitter | [environment/acw-ptmxp](environment/acw-ptmxp) |
| ACW-PW | Pilot wire heating control | [environment/acw-pw](environment/acw-pw) |

### Metering

| Device | Description | Codec |
|---|---|---|
| ACW-MR2-EX, ACW-MR2 | ATEX pulse counter, one or two meters | [metering/acw-mr2-ex](metering/acw-mr2-ex) |
| ACW-MR4 | Pulse counter & dry contacts, up to four inputs | [metering/acw-mr4](metering/acw-mr4) |
| ACW-MR4-OPTO | Optical meter reader | [metering/acw-mr4-opto](metering/acw-mr4-opto) |

### Measurement

| Device | Description | Codec |
|---|---|---|
| ACW-CTS | Self-powered current sensor | [measurement/acw-cts](measurement/acw-cts) |
| ACW-GAUG | Tank level gauge | [measurement/acw-gaug](measurement/acw-gaug) |

### Detection

| Device | Description | Codec |
|---|---|---|
| ACW-PIRxx | Motion detector | [detection/acw-pir](detection/acw-pir) |
| ACW-WLL | Leak detector | [detection/acw-wll](detection/acw-wll) |

### I/O modules & gateways

| Device | Description | Codec |
|---|---|---|
| ACW-DINDxx (DIND21) | Digital I/O module | [io-modules/acw-dind21](io-modules/acw-dind21) |
| ACW-DINDxx / DINDx0 (DIND88) | Digital & analog input module | [io-modules/acw-dind88](io-modules/acw-dind88) |
| ACW-DINRSM-V2 | Modbus master gateway | [io-modules/acw-dinrsm-v2](io-modules/acw-dinrsm-v2) |
| ACW-MIO (C0, C1, 1M8, 2M8, MT1, WLK) | 4-20 mA / 0-10 V analog inputs and digital inputs | [io-modules/acw-mio](io-modules/acw-mio) |
| ACW-MT1 | Digital or counting input | [io-modules/acw-mt1](io-modules/acw-mt1) |

### Generic decoder

| Device | Description | Codec |
|---|---|---|
| Other ACW product (ACW-LVL…) | Decodes every frame of the ACW range without knowing the product: fields named after the measurement type and the channel | [generic/acw-generic](generic/acw-generic) |

## Quick start (Node.js)

```js
const codec = require("./environment/acw-thx/acw-thx-codec.js");

console.log(codec.decodeUplink({ bytes: [0xa0, 0x08, 0x08, 0x85, 0x09, 0x17, 0xde], fPort: 1 }));
// { data: { frame_type: "Measurement frame", temperature0: 21.81, humidity0: 61.1 }, errors: [], warnings: [] }

console.log(codec.encodeDownlink({ data: { setKeepAlivePeriod: "Once every day" } }));
// { bytes: [3, 6], fPort: 1, warnings: [], errors: [] }
```

## Output conventions

- A measurement is a **number**. When the frame carries history, it is an **array, most recent sample first**.
- `timestamp` (when the timestamp is enabled on the device) is an ISO 8601 UTC string.
- `errors` is filled for empty, unsupported or unknown frames.

Details are in [docs/output-format.md](docs/output-format.md). Downlink commands are described in [docs/downlink-commands.md](docs/downlink-commands.md).

## Folder layout

```
<family>/<product>/
├── README.md              fields, downlink commands and examples
├── <product>-codec.js     the codec (decoder + encoder)
├── <product>-bacnet-definition.json, <product>-bacnet-codec.js
│                          BACnet files for the MultiTech Conduit gateway
├── <product>.png          product picture
├── examples.json          test vectors: payload -> expected output
└── product.json           machine-readable metadata (models, version, entry points)
products.json              index of all products
docs/                      shared documentation
```

## Tests

Every `examples.json` is replayed against its codec, under Node.js and in a bare JavaScript sandbox that is close to the TTN and ChirpStack runtimes. Run this from the repository root:

```sh
npm test                 # all products, both languages
npm test -- acw-thx      # one product
```

The examples can also be run in the actual JavaScript engines of the network servers:

| Command | Engine | Network server |
|---|---|---|
| `npm run test:ttn` | goja | The Things Stack (TTN v3) |
| `npm run test:chirpstack-v3` | otto (ES5 only) | ChirpStack v3 |
| `npm run test:chirpstack-v4` | QuickJS (script and ES module) | ChirpStack v4 |
| `npm run test:lns` | all three | |

`test:chirpstack-v4` needs `npm install`. `test:ttn` and `test:chirpstack-v3` need [Go](https://go.dev/dl/) 1.22 or later, or Docker:

```sh
docker run --rm -v "$PWD:/repo" -w /repo/scripts/lns/go golang:1.22 go run . ../../.. ttn
```

All of them run on every push in the GitHub CI.

## Contributing

Bug reports and new test vectors are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](../LICENSE) – Copyright (c) 2026 ATIM.
