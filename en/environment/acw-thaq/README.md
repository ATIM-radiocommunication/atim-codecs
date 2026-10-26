# ACW-THAQ – Indoor air quality sensor

<img src="acw-thaq.png" alt="ACW-THAQ" width="200">

Indoor air quality sensor measuring temperature, humidity, CO2 (NDIR) and VOC.

## Supported models

- ACW-THAQ

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-THAQ | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THAQ/ENGLISH/ATIM_ACW-THAQ_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THAQ/ENGLISH/ATIM_ACW-THAQ_UG_EN.pdf) |

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-thaq-codec.js](acw-thaq-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/environnement/acw-thaq](../../../fr/environnement/acw-thaq).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `temperature0` | Temperature 1 | number | Cel |
| `humidity0` | Humidity 1 | number | %RH |
| `CO2` | CO2 | number | ppm |
| `VOC` | VOC | number |  |
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
| [acw-thaq-bacnet-definition.json](acw-thaq-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-thaq-bacnet-codec.js](acw-thaq-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Temperature and humidity** – payload `a00808850917de`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "temperature0": 21.81,
  "humidity0": 61.1
}
```

**Temperature, humidity and VOC** – payload `a00808850917de0c00a0`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "temperature0": 21.81,
  "humidity0": 61.1,
  "VOC": 160
}
```

**Historised temperature and humidity** – payload `a1003c0808a408850917a217de`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "temperature0": [
    22.12,
    21.81
  ],
  "humidity0": [
    60.5,
    61.1
  ]
}
```

**Test frame with timestamp, CO2, VOC, humidity and temperature** – payload `c5646239dc0809080905040c01020d0f08`, fPort 1

```json
{
  "frame_type": "Test frame",
  "temperature0": 23.12,
  "humidity0": 12.84,
  "VOC": 258,
  "CO2": 3848,
  "timestamp": "2023-05-15T13:55:40.000Z"
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
