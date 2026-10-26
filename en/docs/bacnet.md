# BACnet (MultiTech Conduit)

A MultiTech Conduit gateway with the **Payload Management** license (mPower 6.3.2 or later) decodes LoRaWAN uplinks and exposes the decoded values as BACnet objects. Each product folder contains the two files the gateway needs:

| File | Role |
|---|---|
| `<product>-bacnet-definition.json` | Sensor definition: the BACnet properties of the product |
| `<product>-bacnet-codec.js` | Decoder/encoder referenced by the definition |

## Importing a product

1. In the gateway web interface, open **Payload Management > Sensor Definitions** and go to the **Import** tab.
2. Enter the manufacturer (`ATIM`) and the sensor type (for example `ACW-THX`).
3. Select the definition file and the codec file of the product, then click **Import**.

Decoding errors are shown in **Status & Logs > Payload Management**. Over SSH, a codec can be tested on the gateway with `packet-decoder-cli --js-uplink-decoder <file> --port 1 --packet <hex> --stdout`.

Use the files of the language you want for the BACnet object names: `en/` gives `period`, `"Measurement frame"`…, `fr/` gives `periode`, `"Trame de mesure"`…

## Definition file

```json
{
    "description": "ACW-THX: Temperature & humidity sensor",
    "version": "1.0.0",
    "properties": {
        "temperature0": { "type": "float", "units": "celsius" },
        "period": { "type": "uint16", "units": "minutes" },
        "frame_type": { "type": "string" },
        "uplinkRSSI": { "name": "uplinkRSSI", "type": "int16", "units": "decibels-millivolt" },
        "setKeepAlivePeriod": { "type": "string", "downlink": true }
    },
    "decoder": "acw-thx-bacnet-codec.js",
    "encoder": "acw-thx-bacnet-codec.js"
}
```

- Each property becomes a BACnet object. Its name is the name of the decoded field.
- `type` is one of `float`, `int16`, `uint8`, `uint16`, `uint32` or `string`.
- `units` is one of `celsius`, `percent`, `volts`, `millivolts`, `amperes`, `milliamperes`, `pascal`, `ppm`, `lux`, `minutes`, `decibels`, `decibels-millivolt`.
- Properties with `"downlink": true` are **writable** objects. Writing one calls `encodeDownlink` and sends the command on fPort 1. See [downlink commands](downlink-commands.md).
- `uplinkFCnt`, `uplinkRSSI`, `uplinkSNR` and `scheduleDownlinkStatus` (with a `name` key) are filled by the gateway, not by the codec.

## What the BACnet codec returns

The BACnet codec is the product codec followed by a small layer, because a BACnet object holds a single value:

| Codec output | BACnet value |
|---|---|
| Number | Unchanged |
| Array (historised frame) | The most recent sample (first element) |
| `"high"` / `"switched high"` | `1` |
| `"low"` / `"switched low"` | `0` |
| Non-numeric value for a numeric property (for example `"error"`) | Not sent: the BACnet object is not updated by this uplink |
| Field not declared in the definition | Not sent |

```js
// codec:        { frame_type: "Measurement frame", period: 60, temperature0: [23.12, 23.05, 22.98] }
// BACnet codec: { frame_type: "Measurement frame", period: 60, temperature0: 23.12 }
```

## Changing a definition

The French definition (`fr/<famille>/<product>/<product>-bacnet-definition.json`) is the reference. After changing it, or a French codec, run `npm run build`. It writes the English definition and the BACnet codecs of both languages. `npm test` checks that they are up to date and runs every example through the BACnet codecs.
