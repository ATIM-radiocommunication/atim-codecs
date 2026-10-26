# ACW-MT1 – Digital or counting input

<img src="acw-mt1.png" alt="ACW-MT1" width="200">

Single-input module: change of state detection (digital input) or pulse counting, with an accelerometer that reports when the product is moved. Available in LoRaWAN, Sigfox, LTE-M and NB-IoT.

This codec is for the MT1 that reports product type 0x9F (ACW/MR1 in the configurator). The MT1 of the MIO range (ACW/MIO-MT1) uses the [ACW-MIO](../acw-mio) codec. Both products send the same uplink frames, but their configuration parameters have different numbers: do not send the commands of one to the other.

## Documentation

| Datasheet | User guide |
|---|---|
| [PDF (FR)](https://atim.com/wp-content/uploads/documentation/ACW/ACW-CEL-MT1/Francais/ATIM_ACW-MT1_DS_FR.pdf) | [PDF (FR)](https://atim.com/wp-content/uploads/documentation/ACW/ACW-CEL-MT1/Francais/ATIM_ACW-MT1_UG_FR.pdf) |

Documents marked (FR) are only available in French.

The counter is sent on 4 bytes (channel type 0x04), as on the MIO range. The frame examples of user guide v1.0 show a 2-byte counter (type 0x03), which does not match the firmware.

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-mt1-codec.js](acw-mt1-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/entrees-sorties/acw-mt1](../../../fr/entrees-sorties/acw-mt1).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `counter0` | Counter index of the input | number |  |
| `input_state0` | Input state: 1/0 in periodic frames; `"switched high"`, `"switched low"`, `"high"` or `"low"` in change of state frames | number |  |
| `period` | Transmission period | number | minute |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
| `frame_type` | Frame type | string |  |
| `error` | Error or alarm, for example "Movement or theft detected on the product" (accelerometer) | string |  |
| `timestamp` | Frame timestamp (ISO 8601 UTC) | string |  |

In LTE-M and NB-IoT, the extended measurement frame adds `frame_index`, and the keep alive frame can carry the GPS position (`gps_status`, `latitude`, `longitude`). See [output format](../../docs/output-format.md#lte-m--nb-iot-products).

### Command responses

| Field | Description | Type | Unit |
|---|---|---|---|
| `configuration_accepted` | 1 when every parameter was accepted, 0 otherwise | number |  |
| `rejected_parameters` | Position (from 1) of the rejected parameters in the sent frame | list |  |
| `downlink_error` | Downlink frame rejected: cause | string |  |
| `command` | Number of the command the product answers | number |  |
| `config_input1` | Input configuration read back, for example "Counter, pull-up, rising edge" | string |  |
| `keep_alive_period` | Keep alive period read back | string |  |
| `timestamp_enabled` | Uplink timestamp read back: 0 or 1 | number |  |

## Downlink commands

Pass one or more of these keys in `input.data` of `encodeDownlink`. See [downlink commands](../../docs/downlink-commands.md).

| Key | Description | Type | Accepted values |
|---|---|---|---|
| `setKeepAlivePeriod` | Keep alive period | string | Disable, Once every hour, Once every day… (see [downlink commands](../../docs/downlink-commands.md)) |
| `setDataloggingPeriod` | Transmission period in minutes | number | 1 – 65535 minutes |
| `setTimestamp` | Timestamp in uplinks: 0 = disabled, 1 = enabled | number | 0 – 1 |
| `setInput1Config` | Role of the input (parameter 30, see below) | object | `{ mode, pull, trigger }` or the configuration byte |
| `setCounter1` | Sets the counter value. Send it alone. | number | 0 – 4294967295 |
| `getConfiguration` | Reads back the keep alive, timestamp, datalogging and input settings. Send it alone. | number | 1 |

### Input configuration

| `mode` | Role | Other keys |
|---|---|---|
| `"disabled"` | Input disabled | |
| `"edge"` | Digital input: a frame is sent on each edge | `pull`: `"none"` (default), `"up"`, `"down"`; `trigger`: `"rising"`, `"falling"`, `"both"` (default) |
| `"counter"` | Pulse counting | `pull`, `trigger` (default `"rising"`) |

Factory setting: counter, pull-up, rising edge (`1e52`).

## BACnet (MultiTech Conduit gateway)

To expose this product over BACnet on a MultiTech Conduit gateway (mPower, Payload Management license), import these two files in **Payload Management > Sensor Definitions > Import**:

| File | Role |
|---|---|
| [acw-mt1-bacnet-definition.json](acw-mt1-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-mt1-bacnet-codec.js](acw-mt1-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

Writable: `setKeepAlivePeriod`, `setDataloggingPeriod`, `setTimestamp`, `setInput1Config` (configuration byte), `setCounter1` and `getConfiguration`. The `inputConfigHelp` text object recalls the format of the configuration byte.

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Input counter** – payload `a00400000885`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "counter0": 2181
}
```

**Historised counter, 2 samples** – payload `a1003c04000008a400000885`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "counter0": [
    2212,
    2181
  ]
}
```

**Input state and counter** – payload `a001010400000885`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "counter0": 2181,
  "input_state0": 1
}
```

**Input change of state** – payload `a00111`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "input_state0": "switched high"
}
```

**Extended measurement frame (LTE-M / NB-IoT)** – payload `8900000100010002003c040000003e0000003c`, fPort 1

```json
{
  "frame_type": "Extended measurement frame",
  "frame_index": 256,
  "period": 60,
  "counter0": [
    62,
    60
  ]
}
```

**Keep alive frame** – payload `810d240c68`, fPort 1

```json
{
  "frame_type": "Keep alive frame",
  "voltagec": 3.176,
  "voltagev": 3.364
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

**Movement detected by the accelerometer** – payload `8e019e`, fPort 1

```json
{
  "frame_type": "Error frame",
  "error": "Movement or theft detected on the product"
}
```

**Configuration accepted** – payload `8600`, fPort 1

```json
{
  "frame_type": "Response to a configuration frame",
  "configuration_accepted": 1,
  "rejected_parameters": []
}
```

**Input configuration read-back (single input)** – payload `87041e52`, fPort 1

```json
{
  "frame_type": "Response to a command frame",
  "command": 4,
  "config_input1": "Counter, pull-up, rising edge"
}
```

**Downlink error: unknown parameter** – payload `8803`, fPort 1

```json
{
  "frame_type": "Response to an invalid frame",
  "downlink_error": "Unknown parameter"
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
| Set the input to counter, pull-up, rising edge (factory setting) | `{"setInput1Config":{"mode":"counter","pull":"up","trigger":"rising"}}` | `1e52` | 1 |
| Set the input to digital input, pull-up, rising and falling edges | `{"setInput1Config":{"mode":"edge","pull":"up","trigger":"both"}}` | `1ed1` | 1 |
| Disable the input | `{"setInput1Config":{"mode":"disabled"}}` | `1e00` | 1 |
| Set the counter to 1000 | `{"setCounter1":1000}` | `c1061101e8030000` | 1 |
| Read the configuration back | `{"getConfiguration":true}` | `c10504030b141e` | 1 |
