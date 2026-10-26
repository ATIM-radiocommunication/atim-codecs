# ACW-MR2-EX – ATEX pulse counter

<img src="acw-mr2-ex.png" alt="ACW-MR2-EX" width="200">

Remote reading of one or two pulse-output meters (dry contacts), ATEX certified. This codec also covers the legacy ACW-MR2.

## Supported models

- ACW-MR2-EX
- ACW-MR2

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-MR2-EX | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR2-EX/ENGLISH/ATIM_ACW-MRx_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR2-EX/ENGLISH/ATIM_ACW-MR2-EX_UG_EN.pdf) |
| ACW-MR2 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/OLD%20PRODUCTS/MR2/ENGLISH/ATIM_ACW-MR2_DS_EN_V1.7.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/OLD%20PRODUCTS/MR2/ENGLISH/ATIM_ACW-MR2_UG_EN_V1.0.pdf) |

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-mr2-ex-codec.js](acw-mr2-ex-codec.js) | 2.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/comptage/acw-mr2-ex](../../../fr/comptage/acw-mr2-ex).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `wirecut` | Wirecut | number (0/1) |  |
| `counter_init` | Reference index | number |  |
| `period` | Datalogging period | number | minute |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
| `counter1` | Meter 1 counter (standard and test frames) | number |  |
| `index0` | Meter 1 index 0 (most recent) | number |  |
| `index1` | Meter 1 index 1 | number |  |
| `index2` | Meter 1 index 2 | number |  |
| `index3` | Meter 1 index 3 | number |  |
| `index4` | Meter 1 index 4 | number |  |
| `index5` | Meter 1 index 5 (oldest) | number |  |
| `counter2` | Meter 2 counter | number |  |
| `logic_level0` | Input 1 | number (0/1) |  |
| `logic_level1` | Input 2 | number (0/1) |  |
| `delta1` | Delta 1 | number |  |
| `delta2` | Delta 2 | number |  |
| `delta3` | Delta 3 | number |  |
| `delta4` | Delta 4 | number |  |
| `delta5` | Delta 5 | number |  |
| `frame_type` | Frame type | string |  |
| `alert` | Alert | string |  |
| `error` | Error | string |  |
| `timestamp` | Frame timestamp (ISO 8601 UTC) | string |  |

## Downlink commands

Pass one or more of these keys in `input.data` of `encodeDownlink`. See [downlink commands](../../docs/downlink-commands.md).

| Key | Description | Type | Accepted values |
|---|---|---|---|
| `setKeepAlivePeriod` | Keep alive period | string | Disable, Once every 10 mins, Once every hour, Once every 2 hours, Once every 4 hours, Once every 8 hours, Once every day, Once every 2 days, Once every 3 days, Once every 4 days, Once every week, Once every month (30 days) |
| `setDataloggingPeriod` | Datalogging period in minutes | number | 1 – 65535 minute |
| `setTimestamp` | Timestamp in uplinks: 0 = disabled, 1 = enabled | number | 0 – 1 |

## BACnet (MultiTech Conduit gateway)

To expose this product over BACnet on a MultiTech Conduit gateway (mPower, Payload Management license), import these two files in **Payload Management > Sensor Definitions > Import**:

| File | Role |
|---|---|
| [acw-mr2-ex-bacnet-definition.json](acw-mr2-ex-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-mr2-ex-bacnet-codec.js](acw-mr2-ex-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Digital input change of state** – payload `090003`, fPort 1

```json
{
  "frame_type": "Change of state detection frame (digital)",
  "wirecut": 0,
  "logic_level1": 1,
  "logic_level0": 1
}
```

**ECO counter frame (LoRaWAN, six 32-bit indexes)** – payload `30000000050000000400000003000000020000000100000000`, fPort 1

```json
{
  "frame_type": "ECO mode counter frame (counter 1, six 32-bit indexes, LoRaWAN)",
  "index0": 0,
  "index1": 1,
  "index2": 2,
  "index3": 3,
  "index4": 4,
  "index5": 5
}
```

**ECO counter frame (Sigfox, five 12-bit deltas)** – payload `3b003e8005004003002001`, fPort 1

```json
{
  "frame_type": "Frame 3B ECO mode counter (counter 1 20 bits and five concatenated 12-bit deltas, Sigfox)",
  "counter_init": 1000,
  "delta1": 5,
  "delta2": 4,
  "delta3": 3,
  "delta4": 2,
  "delta5": 1
}
```

**Keep alive frame** – payload `810e100dac`, fPort 1

```json
{
  "frame_type": "Keep alive frame",
  "voltagec": 3.5,
  "voltagev": 3.6
}
```

**Historised measurement frame** – payload `a1003c`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
