# ACW-PW – Pilot wire heating control

<img src="acw-pw.png" alt="ACW-PW" width="200">

LoRaWAN module controlling electric heaters through the pilot wire. It applies a fixed mode or a calendar of 7 weekly programs, and reports the room temperature and humidity.

## Supported models

- ACW-PW
- ACW/LW8-PW

## Documentation

| Model | Datasheet | User guide |
|---|---|---|
| ACW-PW | [PDF (FR)](https://atim.com/wp-content/uploads/documentation/ACW/ACW-PW/ATIM_ACW-PW_DS_FR.pdf) | [PDF (FR)](https://atim.com/wp-content/uploads/documentation/ACW/ACW-PW/ATIM_ACW-PW_UG_FR.pdf) |

Documents marked (FR) are only available in French.

## Codec

| File | Version | Entry points |
|---|---|---|
| [acw-pw-codec.js](acw-pw-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

The same file can be pasted as is into The Things Stack (TTN v3), ChirpStack v4 and ChirpStack v3. See [platform integration](../../docs/platforms.md).

French version of this codec (French field names and labels): [../../../fr/environnement/acw-pw](../../../fr/environnement/acw-pw).

## Uplink fields

Measurements are returned as a number, or as an array (most recent sample first) when the frame carries history. See [output format](../../docs/output-format.md).

| Field | Description | Type | Unit |
|---|---|---|---|
| `temperature0` | Room temperature | number | Cel |
| `humidity0` | Room humidity | number | %RH |
| `period` | Datalogging period | number | minute |
| `voltagec` | Voltage under load (during transmission) | number | V |
| `voltagev` | Idle voltage | number | V |
| `frame_type` | Frame type | string |  |
| `alert` | Alert | string |  |
| `error` | Error | string |  |
| `timestamp` | Frame timestamp (ISO 8601 UTC) | string |  |

### Command responses

The product answers downlink frames. These fields only appear in those responses.

| Field | Description | Type | Unit |
|---|---|---|---|
| `configuration_accepted` | 1 if every parameter was accepted, 0 otherwise | number |  |
| `rejected_parameters` | Position (from 1) of the rejected parameters in the sent frame | list |  |
| `downlink_error` | Downlink frame rejected: reason | string |  |
| `command` | Number of the command the product answers | number |  |
| `pilot_wire_mode` | Pilot wire mode read back (0 to 6) | number |  |
| `pilot_wire_mode_label` | Pilot wire mode label | string |  |
| `calendar_default_mode` | Mode applied by the calendar outside the programs (1 to 6) | number |  |
| `calendar_default_mode_label` | Calendar default mode label | string |  |
| `program1` … `program7` | Program read back, in the format of the `setProgram1` … `setProgram7` commands | string |  |
| `program1_label` … `program7_label` | Readable program, e.g. "Mon, Tue · 08:00-18:00 UTC · Comfort" | string |  |
| `keep_alive_period` | Keep alive period read back | string |  |
| `timestamp_enabled` | Uplink timestamp read back: 0 or 1 | number |  |

## Pilot wire modes

| Value | Mode |
|---|---|
| 0 | Calendar (`setPilotWireMode` only) |
| 1 | Comfort |
| 2 | Eco |
| 3 | Frost protection |
| 4 | Off |
| 5 | Comfort -1 °C |
| 6 | Comfort -2 °C |

## Downlink commands

Pass one or more of these keys in `input.data` of `encodeDownlink`. See [downlink commands](../../docs/downlink-commands.md).

| Key | Description | Type | Accepted values |
|---|---|---|---|
| `setKeepAlivePeriod` | Keep alive period | string | Disable, Once every 10 mins, Once every hour, Once every 2 hours, Once every 4 hours, Once every 8 hours, Once every day, Once every 2 days, Once every 3 days, Once every 4 days, Once every week, Once every month (30 days) |
| `setDataloggingPeriod` | Datalogging period in minutes | number | 1 – 65535 minute |
| `setTimestamp` | Timestamp in uplinks: 0 = disabled, 1 = enabled | number | 0 – 1 |
| `setPilotWireMode` | Pilot wire mode: 0 = follow the calendar, 1 to 6 = fixed mode | number | 0 – 6 |
| `setPilotWireCalendarDefaultMode` | Mode applied by the calendar outside the programs | number | 1 – 6 |
| `setProgram1` … `setProgram7` | Calendar program (see below) | string | `"HH:MM-HH:MM;days;mode"` or `{ start, end, days, mode }` |
| `getPilotWireConfiguration` | Read back the modes and the 7 programs. Send it alone. | number | 1 |

### Programs

A program is written `"HH:MM-HH:MM;days;mode"`, for example `"08:00-18:00;31;1"`: comfort from 8 am to 6 pm, Monday to Friday. The object form `{ "start": "08:00", "end": "18:00", "days": 31, "mode": 1 }` is equivalent.

- **Times are in UTC.** The product does not know the time zone: in Paris, 08:00 UTC is 09:00 in winter and 10:00 in summer.
- **days**: sum of the active days, 0 to 127. Monday = 1, Tuesday = 2, Wednesday = 4, Thursday = 8, Friday = 16, Saturday = 32, Sunday = 64. Monday to Friday = 31, every day = 127, 0 = program disabled.
- **mode**: 1 to 6 (see the modes table).
- The calendar only applies when `setPilotWireMode` is 0.

To check the configuration, send `{"getPilotWireConfiguration": 1}`: the product answers with one or more command response frames carrying the `pilot_wire_mode`, `calendar_default_mode` and `program1` … `program7` fields.

## BACnet (MultiTech Conduit gateway)

To expose this product over BACnet on a MultiTech Conduit gateway (mPower, Payload Management license), import these two files in **Payload Management > Sensor Definitions > Import**:

| File | Role |
|---|---|
| [acw-pw-bacnet-definition.json](acw-pw-bacnet-definition.json) | Definition: BACnet properties, types, units, writable objects |
| [acw-pw-bacnet-codec.js](acw-pw-bacnet-codec.js) | Decoder/encoder: this codec, with one value per property |

Each uplink field becomes a readable BACnet object. A historised frame gives its most recent sample. See [BACnet](../../docs/bacnet.md).

The commands above are writable objects. To help fill them in from the building management system, three text objects recall their format: `scheduleFormatHelp`, `pilotWireModeHelp` and `pilotWireCalendarDefaultModeHelp`. They only exist in the BACnet codec.

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

**Keep alive frame** – payload `810d240c68`, fPort 1

```json
{
  "frame_type": "Keep alive frame",
  "voltagec": 3.176,
  "voltagev": 3.364
}
```

**Threshold alert** – payload `8d480a28`, fPort 1

```json
{
  "frame_type": "Alert frame",
  "alert": "High threshold exceeded on temperature channel 0",
  "temperature0": 26
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

**Configuration rejected for parameters 1 and 3** – payload `8605`, fPort 1

```json
{
  "frame_type": "Response to a configuration frame",
  "configuration_accepted": 0,
  "rejected_parameters": [
    1,
    3
  ]
}
```

**Pilot wire modes read-back** – payload `870425002603`, fPort 1

```json
{
  "frame_type": "Response to a command frame",
  "command": 4,
  "pilot_wire_mode": 0,
  "pilot_wire_mode_label": "Calendar",
  "calendar_default_mode": 3,
  "calendar_default_mode_label": "Frost protection"
}
```

**Program 1 read-back** – payload `8704de07001e04387f0103`, fPort 1

```json
{
  "frame_type": "Response to a command frame",
  "command": 4,
  "program1": "08:00-18:00;127;1",
  "program1_label": "Mon, Tue, Wed, Thu, Fri, Sat, Sun · 08:00-18:00 UTC · Comfort"
}
```

**Program 2 read-back (disabled)** – payload `8704df07001e0438000303`, fPort 1

```json
{
  "frame_type": "Response to a command frame",
  "command": 4,
  "program2": "08:00-18:00;0;3",
  "program2_label": "Program disabled"
}
```

**Timestamped command response** – payload `c7653c1a00042501`, fPort 1

```json
{
  "frame_type": "Response to a command frame",
  "timestamp": "2023-10-27T20:13:52.000Z",
  "command": 4,
  "pilot_wire_mode": 1,
  "pilot_wire_mode_label": "Comfort"
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
| Pilot wire mode: comfort | `{"setPilotWireMode":1}` | `2501` | 1 |
| Pilot wire mode: calendar | `{"setPilotWireMode":0}` | `2500` | 1 |
| Calendar default mode: frost protection | `{"setPilotWireCalendarDefaultMode":3}` | `2603` | 1 |
| Program 1: every day, 08:00-18:00 UTC, comfort | `{"setProgram1":"08:00-18:00;127;1"}` | `de07001e04387f0103` | 1 |
| Program 1: every day, 09:15-20:00 UTC, comfort | `{"setProgram1":"09:15-20:00;127;1"}` | `de070022b4b07f0103` | 1 |
| Program 2 disabled | `{"setProgram2":"08:00-18:00;0;3"}` | `df07001e0438000303` | 1 |
| Program 1 as an object, 08:01-18:00 UTC | `{"setProgram1":{"start":"08:01","end":"18:00","days":127,"mode":1}}` | `de07001e14387f0103` | 1 |
| Read the pilot wire configuration | `{"getPilotWireConfiguration":true}` | `c10a0425261e1f2021222324` | 1 |
