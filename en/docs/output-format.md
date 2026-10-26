# Output format

This page describes what `decodeUplink` returns in the English codecs.

## Result object

```js
{
  data: { ... },      // decoded fields
  errors: [ ... ],    // empty when decoding succeeded
  warnings: [ ... ]
}
```

| Situation | `data` | `errors` |
|---|---|---|
| Valid frame | Decoded fields | `[]` |
| Empty payload | `{}` | `["Empty payload"]` |
| Payload that cannot be parsed | `{}` | `["Unsupported payload: <hex>"]` |
| Unknown frame type | `{ frame_type: "Unknown frame type" }` | `["Unknown frame type for payload <hex>"]` |

Some network servers drop `data` when `errors` is not empty.

## Field values

- **Measurements are numbers.** A frame with a single sample gives `temperature0: 21.81`.
- **Historised frames give arrays**, most recent sample first: `temperature0: [23.12, 23.05, 22.98]`.
  Check `Array.isArray()` if your application handles both cases.
- **Sensor errors**: a sample the sensor could not measure is the string `"error"`.
- **Digital inputs** in change-of-state frames give a label rather than 0/1:
  - `"switched high"` / `"switched low"`: an edge was detected on that input;
  - `"high"` / `"low"`: no edge, current level.

## Common fields

| Field | Meaning | Type / unit |
|---|---|---|
| `frame_type` | Frame type, for example `"Measurement frame"`, `"Keep alive frame"`, `"Alert frame"` | string |
| `period` | Datalogging period | minutes |
| `timestamp` | Frame timestamp, present when the timestamp is enabled on the device (`setTimestamp`) | ISO 8601 UTC string |
| `voltagec` | Voltage under load, during transmission (keep alive frame) | V |
| `voltagev` | Idle voltage (keep alive frame) | V |
| `alert` | Alert description (alert frames). Several alerts are separated by ` \| ` | string |
| `error` | Error description (error frames) | string |

Product-specific fields are listed in each product README.

## LTE-M / NB-IoT products

Over LTE-M and NB-IoT, the products send larger frames. The codecs decode both variants, whatever the product:

- **Extended measurement frame** (`frame_type: "Extended measurement frame"`): the same measurements as the measurement frame, with up to 16 history depths and 256 samples. It adds:

  | Field | Meaning | Type |
  |---|---|---|
  | `frame_index` | Counter of the sent frames, incremented on every frame: a gap means a lost frame | number |
  | `period` | Transmission period, always present | minutes |

- **Keep alive frame with GPS position** (when GPS is enabled):

  | Field | Meaning | Type |
  |---|---|---|
  | `gps_status` | `"Position found"`, `"Position not found"` or `"GPS hardware fault"` | string |
  | `latitude`, `longitude` | Position in decimal degrees (negative south and west), only when the position is found | number |

These frames arrive over MQTT, not through a LoRaWAN network server, so they never go through a BACnet gateway.

## Examples

```json
{ "frame_type": "Measurement frame", "period": 60, "temperature0": [23.12, 23.12, 23.12, 23.12], "timestamp": "2023-02-08T13:25:19.000Z" }
```

```json
{ "frame_type": "Keep alive frame", "voltagec": 3.5, "voltagev": 3.6 }
```

```json
{ "frame_type": "Extended measurement frame", "frame_index": 1, "period": 60, "temperature0": 21.81, "humidity0": 61.1 }
```

```json
{ "frame_type": "Keep alive frame", "voltagec": 3.176, "voltagev": 3.364, "gps_status": "Position found", "latitude": 45.05135, "longitude": 5.5457 }
```

```json
{ "frame_type": "Error frame", "error": "EEPROM is corrupted" }
```

## English and French codecs

The [French codecs](../../fr/README.md) use the same logic. Their field names and labels are in French. English field names are a word-by-word translation of the French ones, in the same order (`temperature_physique` → `temperature_physical`), except for a few usual terms such as `differential_pressure`:

| English | French |
|---|---|
| `period` | `periode` |
| `timestamp` | `horodatage` |
| `frame_index` | `index_trame` |
| `gps_status` | `etat_gps` |
| `alert` | `alerte` |
| `error` | `erreur` |
| `counter0`, `counter1`… | `compteur0`, `compteur1`… |
| `current` | `courant` |
| `voltage` | `tension` |
| `current_analog` (DIND88 4-20 mA input) | `current` |
| `differential_pressure` | `pression_differentielle` |
| `rate` | `taux` |
| `temperature_physical`, `temperature_inertial` | `temperature_physique`, `temperature_inertielle` |
| `humidity_physical`, `humidity_inertial` | `humidity_physique`, `humidity_inertielle` |
| `counter_pir`, `temperature_pir` | `compteur_pir`, `temperature_pir` |
| `box`, `sensor_dq`, `type_frame` | `boitier`, `capteur_dq`, `type_trame` |

The other fields (`temperature0`, `humidity0`, `voltagec`, `input_state0`, `index0`…) have the same name in both versions.
