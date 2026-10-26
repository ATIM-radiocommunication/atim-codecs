# ACW-MR4-OPTO – Optical meter reader

<img src="acw-mr4-opto.png" alt="ACW-MR4-OPTO" width="200">

Optical index reading for meters fitted with a pulse LED, based on the ACW-MR4.

## Supported models

- ACW-MR4-OPTO

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-MR4-OPTO | [PDF (FR)](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-OPTO/ATIM_ACW-MR4-OPTO_DS_FR.pdf) | – |
| ACW-MR4 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR4/ENGLISH/ATIM_ACW-MRx_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR4/ENGLISH/ATIM_ACW-MR4_UG_EN.pdf) |

Documents marked (FR) are only available in French.

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-mr4-opto-codec.js](acw-mr4-opto-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/comptage/acw-mr4-opto](../../../fr/comptage/acw-mr4-opto).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `period` | Datalogging period | number | minute |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
| `counter0` | Counter 1 (Channel 0) | number |  |
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
| [acw-mr4-opto-bacnet-definition.json](acw-mr4-opto-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-mr4-opto-bacnet-codec.js](acw-mr4-opto-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Meter index** – payload `a00400000052`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "counter0": 82
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

**Historised meter index** – payload `a1003c04000000a400000052`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "counter0": [
    164,
    82
  ]
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
