# ACW-MR4 – Pulse counter & dry contacts

<img src="acw-mr4.png" alt="ACW-MR4" width="200">

Remote reading of pulse-output meters and reporting of dry contact states, on up to four inputs.

## Supported models

- ACW-MR4

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-MR4 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR4/ENGLISH/ATIM_ACW-MRx_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR4/ENGLISH/ATIM_ACW-MR4_UG_EN.pdf) |

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-mr4-codec.js](acw-mr4-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/comptage/acw-mr4](../../../fr/comptage/acw-mr4).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `period` | Datalogging period | number | minute |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
| `counter0` | Counter 1 (Channel 0) | number |  |
| `counter1` | Counter 2 (Channel 1) | number |  |
| `counter2` | Counter 3 (Channel 2) | number |  |
| `counter3` | Counter 4 (Channel 3) | number |  |
| `input_state0` | Input 1 | number (0/1) |  |
| `input_state1` | Input 2 | number (0/1) |  |
| `input_state2` | Input 3 | number (0/1) |  |
| `input_state3` | Input 4 | number (0/1) |  |
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
| [acw-mr4-bacnet-definition.json](acw-mr4-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-mr4-bacnet-codec.js](acw-mr4-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Digital inputs and counter** – payload `a001010400000052`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "counter0": 82,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 0,
  "input_state3": 0
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

**Digital input change of state** – payload `a00110`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "input_state0": "switched low",
  "input_state1": "low",
  "input_state2": "low",
  "input_state3": "low"
}
```

**Historised digital inputs** – payload `a1003c010f05`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "input_state0": [
    1,
    1
  ],
  "input_state1": [
    1,
    0
  ],
  "input_state2": [
    1,
    1
  ],
  "input_state3": [
    1,
    0
  ]
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
