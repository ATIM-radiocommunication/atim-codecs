# Contributing

*Version française : [../fr/CONTRIBUTING.md](../fr/CONTRIBUTING.md)*

## Reporting a decoding problem

Open an issue with:

- the product and its firmware version;
- the payload in hexadecimal and the fPort;
- the output you get and the output you expect.

## How the two languages are kept in sync

The **French codecs (`fr/`) are the reference**. The English codecs (`en/`) are generated from them by `npm run build`:

- French labels and comments are translated with the tables in [`scripts/lib/i18n.js`](../scripts/lib/i18n.js). Identifiers (variables, functions, field names) are translated word by word with its `WORDS` dictionary, keeping order, separators and case (`valeur_hum0` → `value_hum0`, `voieTemp` → `channelTemp`), so the English codec is English code that directly outputs English fields (`periode` → `period`, `compteur0` → `counter0`…);
- the build stops if a translation would give the same English name to two different French names of a file;
- `en/<family>/<product>/examples.json` is derived from the French examples.

The BACnet files (`<product>-bacnet-definition.json`, `<product>-bacnet-codec.js`) are generated the same way: the French definition is the reference, see [docs/bacnet.md](docs/bacnet.md).

`npm run build` writes all generated files. `npm test` fails when one of them is not up to date.

## Changing a codec

1. Edit the French codec `fr/<famille>/<product>/<product>-codec.js`.
2. Add a test vector for the case you fixed to the French `examples.json`:

   ```json
   {
     "description": "Description courte de la trame",
     "type": "uplink",
     "input": { "bytes": "a00808850917de", "fPort": 1 },
     "output": { "data": { ... }, "errors": [], "warnings": [] }
   }
   ```

   Downlink vectors use `"type": "downlink-encode"`, with `input.data` and `output.bytes` in hexadecimal.
3. If you added a French label, comment, variable, function, output field or example description, add its English translation to `scripts/lib/i18n.js`.
4. Run `npm run build`, then `npm test`. Every codec must pass under Node.js and in the sandbox, which has no `require`, `module`, `Buffer` or `process`. Then run `npm run test:lns` (or let the CI do it) to check the codec in the engines of TTN, ChirpStack v3 and ChirpStack v4.
5. Bump `version` in the French `product.json` and in the header of the French codec. Add an entry to both `CHANGELOG.md` files. A change in the output (renamed field, changed type) is a breaking change: bump the major version.

## Adding a product

1. Create `fr/<famille>/<product>/` with the codec, `examples.json`, `product.json`, the BACnet definition, the picture and a README, and add the product to `fr/products.json`.
2. Run `npm run build`. It creates the English codec, examples, `product.json` and BACnet definition, and the BACnet codecs of both languages.
3. Write the English `README.md` and the English `summary` in `en/.../product.json`, then add the product to both top-level READMEs (`en/README.md`, `fr/README.md`).

## Rules for codec files

- One self-contained file per product, with no dependencies.
- Expose `decodeUplink` and, when supported, `encodeDownlink`, following the LoRaWAN Payload Codec API (TS013).
- Do not use Node.js-only APIs (`Buffer`, `require`): the file must run in TTN and ChirpStack.
- Write ES5 (`var`, no arrow functions, no `let` / `const`, no template literals, decimal object keys): ChirpStack v3 only accepts ES5.
- Keep the platform adapters at the end of the file (`Decode` / `Encode` for ChirpStack v3, `module.exports` for Node.js).
