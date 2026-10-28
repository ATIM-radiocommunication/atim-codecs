# ACW-GENERIC – Generic decoder for the ACW range

Decoder for the ACW products that have no dedicated codec in this repository (for example the ACW-LVL), or to read a frame from an unknown product. It decodes every frame of the ACW range, new generation and legacy products, without knowing the product: fields are named after the measurement type and the channel.

When the product has its own codec, use it instead: its fields have the name and unit of that product (for example `VOC` on the ACW-THAQ instead of `rate0`), and it encodes the commands of that product.

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-generic-codec.js](acw-generic-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/generique/acw-generic](../../../fr/generique/acw-generic).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md). The trailing digit is the channel of the measurement (0 to 3), read from the frame.

### Measurement, test and alert frames

| Field | Measurement type | Description | Unit |
|---|---|---|---|
| `temperature0` … `temperature3` | 0x08 | Temperature | Cel |
| `humidity0` … `humidity3` | 0x09 | Humidity | %RH |
| `counter0` … `counter3` | 0x04, 0x03 | Counter index (32 bits; 16 bits for the PIR detection counter, type 0x03) | |
| `input_state0` … `input_state3` | 0x01 | Digital input state: 1/0, or `"switched high"`, `"switched low"`, `"high"`, `"low"` in change-of-state frames | |
| `voltage0` … `voltage3` | 0x0A | Voltage | V |
| `current0` … `current3` | 0x0B | Current, in hundredths of the product unit: A on the ACW-CTS, mA on the ACW-MIO | A or mA |
| `rate0` … `rate3` | 0x0C | Raw value, whose meaning depends on the product: level in % (ACW-GAUG), VOC (ACW-THAQ), hundredths of % (ACW-MIO) | |
| `CO2` | 0x0D | CO2 | ppm |
| `lux` | 0x05 | Illuminance | lx |
| `distance` | 0x07 | Distance | mm |
| `differential_pressure` | 0x06 | Differential pressure | Pa |
| `cable_cut` | | Cable cut specific frame: 1 = cable cut, 0 = cable restored | |
| `period` | | Datalogging period | minute |
| `voltagec` | | Voltage under load (during transmission), keep alive frame | V |
| `voltagev` | | Idle voltage, keep alive frame | V |
| `frame_type` | | Frame type | |
| `alert` | | Threshold alert, for example "High threshold exceeded on current channel 0" | |
| `error` | | Error reported by the product | |
| `timestamp` | | Frame timestamp (ISO 8601 UTC) | |

A sample the sensor could not measure is `"error"` (temperature, humidity, CO2).

Over LTE-M and NB-IoT, the extended measurement frame adds `frame_index`, and the keep alive frame can carry the GPS position (`gps_status`, `latitude`, `longitude`). See [output format](../../docs/output-format.md#lte-m--nb-iot-products).

### Command responses

| Field | Description | Type |
|---|---|---|
| `configuration_accepted` | 1 when every parameter was accepted, 0 otherwise | number |
| `rejected_parameters` | Position (from 1) of the rejected parameters in the sent frame | list |
| `downlink_error` | Downlink frame rejected: cause | string |
| `command` | Number of the command the product answers | number |
| `keep_alive_period` | Keep alive period read back | string |
| `timestamp_enabled` | Uplink timestamp read back: 0 or 1 | number |
| `history_depth`, `samples_per_frame`, `transmission_period` | Datalogging read back | number |
| `parameter<n>` | Other parameter read back (product specific), as hex | string |
| `response` | Response to another command, as hex | string |

### Legacy products

The frame type (`frame_type`) is the label of the frame, for example "Digital inputs and temperature frame".

| Field | Product | Description | Unit |
|---|---|---|---|
| `input_state0` … `input_state15` | DIND | Digital inputs (1/0) | |
| `output_state0` … `output_state7` | DIND | Digital outputs (1/0) | |
| `temperature0` | DIND | Temperature | Cel |
| `counter0` … `counter8` | DIND, MR2 | Counters | |
| `voltage`, `current_analog`, `logic_level_dinda` | DINDA | 0-10 V input (V), 4-20 mA input (mA), raw logic level | V, mA |
| `temperature0`, `temperature1` | TM1D, TM2D | Temperatures of the S1 and S2 probes | Cel |
| `index0` … `index5` | MR2 | Indexes of the LoRaWAN ECO counter frame (0 = most recent) | |
| `counter_init`, `delta1` … `delta5` | MR2 | Counter and deltas of the Sigfox ECO counter frames | |
| `logic_level0`, `logic_level1`, `wirecut` | MR2 | Input levels and cable cut | |
| `type_frame`, `box`, `sensor_dq`, `counter_pir`, `temperature_pir` | PIR | PIR frame | |

## Downlink commands

Only the commands common to the range are encoded. Pass one or more of these keys in `input.data` of `encodeDownlink`. See [downlink commands](../../docs/downlink-commands.md).

| Key | Description | Type | Accepted values |
|---|---|---|---|
| `setKeepAlivePeriod` | Keep alive period | string | Disable, Once every hour, Once every day… (see [downlink commands](../../docs/downlink-commands.md)) |
| `setDataloggingPeriod` | Datalogging period in minutes | number | 1 – 65535 minutes |
| `setTimestamp` | Uplink timestamp: 0 = disabled, 1 = enabled | number | 0 – 1 |

## BACnet

The generic decoder has no BACnet files: a BACnet definition declares the properties of one given product. Use the BACnet files of the product codec.

## Examples

Every test case is in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Temperature and humidity** – payload `a00808850917de`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "temperature0": 21.81,
  "humidity0": 61.1
}
```

**Two temperature and humidity channels** – payload `a00808850917de180870191794`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "temperature0": 21.81,
  "temperature1": 21.6,
  "humidity0": 61.1,
  "humidity1": 60.36
}
```

**Timestamped test frame: CO2, rate, humidity and temperature** – payload `c5646239dc0809080905040c01020d0f08`, fPort 1

```json
{
  "frame_type": "Test frame",
  "temperature0": 23.12,
  "humidity0": 12.84,
  "rate0": 258,
  "CO2": 3848,
  "timestamp": "2023-05-15T13:55:40.000Z"
}
```

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

**Digital input change of state** – payload `a00111`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "input_state0": "switched high",
  "input_state1": "low",
  "input_state2": "low",
  "input_state3": "low"
}
```

**Historised current and voltage, 2 samples** – payload `a1003c0b03e804b01a09600974`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "period": 60,
  "voltage1": [
    2.4,
    2.42
  ],
  "current0": [
    10,
    12
  ]
}
```

**Distance** – payload `a00704d2`, fPort 1

```json
{
  "frame_type": "Measurement frame",
  "distance": 1234
}
```

**Alert: high threshold exceeded, current of channel 0** – payload `8d4b03e8`, fPort 1

```json
{
  "frame_type": "Alert frame",
  "alert": "High threshold exceeded on current channel 0",
  "current0": 10
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

**Cable cut detected** – payload `8f1c20`, fPort 1

```json
{
  "frame_type": "Specific frame",
  "cable_cut": 1
}
```

**Common parameters read-back, and a product parameter in hex** – payload `870403060b019400113c001a16`, fPort 1

```json
{
  "frame_type": "Response to a command frame",
  "command": 4,
  "keep_alive_period": "Once every day",
  "timestamp_enabled": 1,
  "history_depth": 1,
  "samples_per_frame": 2,
  "transmission_period": 60,
  "parameter26": "16"
}
```

**Legacy product: digital inputs/outputs, temperature and counter** – payload `6efd0100fa00017ce6`, fPort 1

```json
{
  "frame_type": "Digital inputs/outputs, temperature and counter 1 frame",
  "temperature0": 25,
  "counter1": 97510,
  "output_state0": 1,
  "output_state1": 0,
  "output_state2": 0,
  "output_state3": 0,
  "output_state4": 0,
  "output_state5": 0,
  "output_state6": 0,
  "output_state7": 0,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 1,
  "input_state3": 1,
  "input_state4": 1,
  "input_state5": 1,
  "input_state6": 1,
  "input_state7": 1
}
```

**Legacy product: ECO counter frame (LoRaWAN, six 32-bit indexes)** – payload `30000000050000000400000003000000020000000100000000`, fPort 1

```json
{
  "frame_type": "ECO mode counter frame (counter 1, six 32-bit indexes, LoRaWAN)",
  "index5": 5,
  "index4": 4,
  "index3": 3,
  "index2": 2,
  "index1": 1,
  "index0": 0
}
```

**Legacy product: TM2D periodic report of two temperatures** – payload `1a0190ff70`, fPort 1

```json
{
  "frame_type": "Two temperatures periodic report frame",
  "temperature0": 25,
  "temperature1": -9
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
