# ACW-DINDxx (DIND88) – Digital & analog input module

<img src="acw-dind88.png" alt="ACW-DINDxx (DIND88)" width="200">

Digital input module reporting dry contact states, pulse counter indexes, output states and analog inputs (0-10 V, 4-20 mA).

## Supported models

- ACW-DINDx0
- ACW-DINDxx

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-DIND88, DIND80, DIND160, DIND44 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-DIND%20(80%2C44%2C160%2C88)/ENGLISH/ATIM_ACW-DINDxxx_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-DIND%20(80%2C44%2C160%2C88)/ENGLISH/ATIM_ACW-DINDxxx_UG_EN.pdf) |

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-dind88-codec.js](acw-dind88-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/entrees-sorties/acw-dind88](../../../fr/entrees-sorties/acw-dind88).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `temperature0` | Temperature 1 | number | Cel |
| `voltage` | Voltage (0-10 V input) | number | V |
| `current_analog` | Current (4-20 mA input) | number | mA |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
| `counter0` | Counter 1 (Channel 0) | number |  |
| `counter1` | Counter 2 (Channel 1) | number |  |
| `counter2` | Counter 3 (Channel 2) | number |  |
| `counter3` | Counter 4 (Channel 3) | number |  |
| `counter4` | Counter 5 (Channel 4) | number |  |
| `counter5` | Counter 6 (Channel 5) | number |  |
| `counter6` | Counter 7 (Channel 6) | number |  |
| `counter7` | Counter 8 (Channel 7) | number |  |
| `input_state0` | Input 1 | number (0/1) |  |
| `input_state1` | Input 2 | number (0/1) |  |
| `input_state2` | Input 3 | number (0/1) |  |
| `input_state3` | Input 4 | number (0/1) |  |
| `input_state4` | Input 5 | number (0/1) |  |
| `input_state5` | Input 6 | number (0/1) |  |
| `input_state6` | Input 7 | number (0/1) |  |
| `input_state7` | Input 8 | number (0/1) |  |
| `input_state8` | Input 9 | number (0/1) |  |
| `input_state9` | Input 10 | number (0/1) |  |
| `input_state10` | Input 11 | number (0/1) |  |
| `input_state11` | Input 12 | number (0/1) |  |
| `input_state12` | Input 13 | number (0/1) |  |
| `input_state13` | Input 14 | number (0/1) |  |
| `input_state14` | Input 15 | number (0/1) |  |
| `input_state15` | Input 16 | number (0/1) |  |
| `output_state0` | Output 1 | number (0/1) |  |
| `output_state1` | Output 2 | number (0/1) |  |
| `output_state2` | Output 3 | number (0/1) |  |
| `output_state3` | Output 4 | number (0/1) |  |
| `output_state4` | Output 5 | number (0/1) |  |
| `output_state5` | Output 6 | number (0/1) |  |
| `output_state6` | Output 7 | number (0/1) |  |
| `output_state7` | Output 8 | number (0/1) |  |
| `frame_type` | Frame type | string |  |
| `alert` | Alert | string |  |
| `error` | Error | string |  |

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
| [acw-dind88-bacnet-definition.json](acw-dind88-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-dind88-bacnet-codec.js](acw-dind88-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

## Examples

All test vectors are in [examples.json](examples.json). They are run by `npm test`.

### Uplink

**Digital inputs, outputs and two counters** – payload `6ff50a00006386000d5454`, fPort 1

```json
{
  "frame_type": "Digital inputs/outputs, counter 1 and counter 2 frame",
  "counter1": 25478,
  "counter2": 873556,
  "output_state0": 0,
  "output_state1": 1,
  "output_state2": 0,
  "output_state3": 1,
  "output_state4": 0,
  "output_state5": 0,
  "output_state6": 0,
  "output_state7": 0,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 1,
  "input_state3": 0,
  "input_state4": 1,
  "input_state5": 1,
  "input_state6": 1,
  "input_state7": 1
}
```

**Digital inputs, temperature and counter** – payload `4ef5ff00fa00017ce6`, fPort 1

```json
{
  "frame_type": "Digital inputs, temperature and counter 1 frame",
  "temperature0": 25,
  "counter1": 97510,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 1,
  "input_state3": 0,
  "input_state4": 1,
  "input_state5": 1,
  "input_state6": 1,
  "input_state7": 1,
  "input_state8": 1,
  "input_state9": 1,
  "input_state10": 1,
  "input_state11": 1,
  "input_state12": 1,
  "input_state13": 1,
  "input_state14": 1,
  "input_state15": 1
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

**0-10 V analogue input** – payload `18007d78`, fPort 1

```json
{
  "frame_type": "0-10 V value periodic report frame",
  "logic_level_dinda": 0,
  "voltage": 5
}
```

**4-20 mA analogue input** – payload `19006f86`, fPort 1

```json
{
  "frame_type": "0-20 mA value periodic report frame",
  "logic_level_dinda": 0,
  "current_analog": 12
}
```

### Downlink

| Description | `input.data` | Bytes (hex) | fPort |
|---|---|---|---|
| Set the keep alive period to once a day | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Set the datalogging period to 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Enable the timestamp in uplinks | `{"setTimestamp":1}` | `0b01` | 1 |
