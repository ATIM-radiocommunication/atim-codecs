# ACW-PIRxx – Motion detector

<img src="acw-pir.png" alt="ACW-PIRxx" width="200">

Passive infrared motion detector with alarm and counting modes. Some variants also report temperature and humidity.

## Supported models

- ACW-PIRxx

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-PIR | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-PIR/ENGLISH/ATIM_ACW-PIR_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-PIR/ENGLISH/ATIM_ACW-PIR_UG_EN.pdf) |

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-pir-codec.js](acw-pir-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/detection/acw-pir](../../../fr/detection/acw-pir).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `temperature0` | Temperature 1 | number | Cel |
| `humidity0` | Humidity 1 | number | %RH |
| `counter0` | Counter 1 (Detections) | number |  |
| `counter_pir` | PIR detections counter | number |  |
| `temperature_pir` | PIR sensor output | number | mV |
| `type_frame` | Former PIR frame: "Box opening frame", "Alarm frame" or "Counting frame" | string |  |
| `box` | Former PIR frame: "box open" or "box closed" | string |  |
| `sensor_dq` | Former PIR frame: DQ sensor "Enabled", "Disabled" or "Not used" | string |  |
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
| [acw-pir-bacnet-definition.json](acw-pir-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-pir-bacnet-codec.js](acw-pir-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Temperature, humidity and detection counter** – payload `a00808850917de030005`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "temperature0": 21.81,
  "counter0": 5,
  "humidity0": 61.1
}
```

**Historised temperature, humidity and detection counter** – payload `a1003c0808a408850917a217de03000f000c`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "temperature0": [
    22.12,
    21.81
  ],
  "counter0": [
    15,
    12
  ],
  "humidity0": [
    60.5,
    61.1
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

**PIR product frame (enclosure opening, detection counter)** – payload `3201000123002a0885`, fPort 1

```json
{
  "frame_type": "PIR product",
  "type_frame": "Box opening frame",
  "sensor_dq": "Not used",
  "counter_pir": 42,
  "temperature_pir": 2181,
  "box": "box open"
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
