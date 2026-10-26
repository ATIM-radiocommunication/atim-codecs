# Platform integration

Every codec file (`<product>-codec.js`) can be used as is: no build step and no dependencies.

## The Things Stack (TTN v3)

1. Open your application, then **Payload formatters → Uplink**.
2. Choose **Custom Javascript formatter** and paste the content of the codec file.
3. Paste the same file under **Payload formatters → Downlink** to use `encodeDownlink`.
4. Use **Test** with a sample from the product `examples.json` to check the result.

The formatter can also be set per end device, which is useful when one application mixes several ATIM products.

## ChirpStack v4

1. Open **Device profiles** and select the profile of your ATIM devices.
2. In the **Codec** tab, choose **JavaScript functions**.
3. Paste the content of the codec file and save.

ChirpStack v4 calls `decodeUplink` and `encodeDownlink` directly.

## ChirpStack v3

1. Open **Device-profiles** and select the profile.
2. In the **Codec** tab, choose **Custom JavaScript codec functions**.
3. Paste the content of the codec file in both fields (decode and encode) and save.

ChirpStack v3 calls `Decode(fPort, bytes, variables)` and `Encode(fPort, obj, variables)`. These adapters are defined at the end of each codec file.

## Node.js

```js
const { decodeUplink, encodeDownlink } = require("./metering/acw-mr4/acw-mr4-codec.js");

const result = decodeUplink({ bytes: [0x81, 0x0e, 0x10, 0x0d, 0xac], fPort: 1 });
```

## How the codec files are built

Like most LoRaWAN codec repositories, each file holds the decoding logic and thin entry points for each platform:

| Function | Used by |
|---|---|
| `decodeUplink(input)`, `encodeDownlink(input)` | TTN v3, ChirpStack v4, any TS013-compliant platform |
| `Decode(fPort, bytes, variables)`, `Encode(fPort, obj, variables)` | ChirpStack v3 |
| `module.exports` (only when `module` exists) | Node.js |

The codecs use plain JavaScript only (no `Buffer`, `require` or other Node.js APIs), so the same file runs everywhere.
