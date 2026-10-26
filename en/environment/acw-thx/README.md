# ACW-THX – Temperature & humidity sensor

<img src="acw-thx.png" alt="ACW-THX" width="200">

Indoor and outdoor temperature and humidity sensors used to monitor comfort, energy efficiency and storage conditions.

## Supported models

- ACW-TH
- ACW-TH Indoor v2
- ACW-THX-I
- ACW-TH-O

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-THX v2 (TH-I v2) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX/ENGLISH/ATIM_ACW-THX_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX/ENGLISH/ATIM_ACW-THX_UG_EN.pdf) |
| ACW-THX-O v2 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX-O-V2/ANGLAIS/ATIM_ACW-THX-O_DS_EN.pdf) | [PDF (FR)](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX-O-V2/FRANCAIS/ATIM_ACW-THX-O_V2_UG_FR.pdf) |
| ACW-TH-I | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-I/ENGLISH/ATIM_ACW-TH-I_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-I/ENGLISH/ATIM_ACW-TH-I_UG_EN.pdf) |
| ACW-TH-O | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-O/ENGLISH/ATIM_ACW-TH-O_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-O/ENGLISH/ATIM_ACW-TH-O_UG_EN.pdf) |

Documents marked (FR) are only available in French.

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-thx-codec.js](acw-thx-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/environnement/acw-thx](../../../fr/environnement/acw-thx).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `temperature0` | Temperature 1 | number | Cel |
| `humidity0` | Humidity 1 | number | %RH |
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
| [acw-thx-bacnet-definition.json](acw-thx-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-thx-bacnet-codec.js](acw-thx-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

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

**Keep alive frame** – payload `810e100dac`, fPort 1

```json
{
  "frame_type": "Keep alive frame",
  "voltagec": 3.5,
  "voltagev": 3.6
}
```

**Extended measurement frame (LTE-M / NB-IoT)** – payload `8900000001010001003c0808850917de`, fPort 1

```json
{
  "frame_type": "Extended measurement frame",
  "frame_index": 1,
  "period": 60,
  "temperature0": 21.81,
  "humidity0": 61.1
}
```

**Timestamped extended measurement frame, 2 samples** – payload `c96a803ba600000002010002003c08088508fc0917de1388`, fPort 1

```json
{
  "frame_type": "Extended measurement frame",
  "frame_index": 2,
  "period": 60,
  "temperature0": [
    21.81,
    23
  ],
  "humidity0": [
    61.1,
    50
  ],
  "timestamp": "2026-08-15T10:12:54.000Z"
}
```

**Keep alive frame with GPS position (LTE-M / NB-IoT)** – payload `810d240c6803293ee90513c6`, fPort 1

```json
{
  "frame_type": "Keep alive frame",
  "voltagec": 3.176,
  "voltagev": 3.364,
  "gps_status": "Position found",
  "latitude": 45.05135,
  "longitude": 5.5457
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
