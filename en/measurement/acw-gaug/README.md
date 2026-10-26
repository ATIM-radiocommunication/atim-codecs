# ACW-GAUG – Tank level gauge

<img src="acw-gaug.png" alt="ACW-GAUG" width="200">

Connected tank level gauge, compatible with Rochester-type mechanical gauges.

## Supported models

- ACW-GAUG

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-GAUG1 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-CEL-GAUG/Anglais/ATIM_ACW-GAUG_DS_EN.pdf) | [PDF (FR)](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-CEL-GAUG/Francais/ATIM_ACW-GAUG1_UG_FR.pdf) |

Documents marked (FR) are only available in French.

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-gaug-codec.js](acw-gaug-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/mesure/acw-gaug](../../../fr/mesure/acw-gaug).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `rate` | Level | number | % |
| `temperature0` | Temperature 1 | number | Cel |
| `period` | Datalogging period | number | minute |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
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
| [acw-gaug-bacnet-definition.json](acw-gaug-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-gaug-bacnet-codec.js](acw-gaug-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Tank level and temperature** – payload `a00c0056080934`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "rate": 86,
  "temperature0": 23.56
}
```

**Historised tank level** – payload `a5003c0c003200310030002f002e002d`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "rate": [
    50,
    49,
    48,
    47,
    46,
    45
  ]
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

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
