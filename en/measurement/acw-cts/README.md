# ACW-CTS – Self-powered current sensor

<img src="acw-cts.png" alt="ACW-CTS" width="200">

Battery-free current sensor powered by energy harvesting. It measures the current flowing in an electrical cable and the temperature of the equipment.

## Supported models

- ACW-CTS

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-CTS | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-CTS/ANGLAIS/ATIM_ACW-CTS_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-CTS/ANGLAIS/ATIM_CTS_UG_EN.pdf) |

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-cts-codec.js](acw-cts-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/mesure/acw-cts](../../../fr/mesure/acw-cts).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `current` | Current | number | A |
| `voltage` | Voltage | number | V |
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
| [acw-cts-bacnet-definition.json](acw-cts-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-cts-bacnet-codec.js](acw-cts-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Historised current and voltage** – payload `a1003c0b03e804b01a001800e8`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "voltage": [
    0.024,
    0.232
  ],
  "current": [
    10,
    12
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

**Temperature and current** – payload `a00808850b03e8`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "temperature0": 21.81,
  "current": 10
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
