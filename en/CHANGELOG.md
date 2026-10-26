# Changelog

## 2026-10-16 – Initial public release

First public release of the ATIM codecs.

- Two versions of every codec: English output (`en/`) and French output (`fr/`, the reference). The French keep alive values (`"Tous les jours"`…) are accepted by the French codecs, in addition to the English ones.
- BACnet files for the MultiTech Conduit gateway in every product folder (definition and BACnet codec, one value per property).
- The codecs are ES5 and are tested in the engines of The Things Stack (goja), ChirpStack v3 (otto) and ChirpStack v4 (QuickJS).
- **ACW-DINRSM-V2**: rewritten without Node.js APIs (`Buffer`, `??`), so it now runs on TTN and ChirpStack. The output is unchanged for valid frames. Empty payloads now fill `errors`, and short keep alive frames no longer throw.
- **LTE-M / NB-IoT** (every product except the DINRSM-V2): the extended measurement frame (type 0x09) is decoded as described in the user guide: frame index (`frame_index`), history depth and 2-byte number of samples, period. Before, these header bytes were read at the wrong offsets and the measurements were wrong. The keep alive frame decodes the GPS position (`gps_status`, `latitude`, `longitude`).
- **ACW-DIND21 / ACW-DIND88**: the period (`period`) and the timestamp (`timestamp`) of measurement frames are converted; they were returned as raw bytes.
- **ACW-MIO** (C0, C1, 1M8, 2M8, MT1, WLK): new codec. Current, voltage and percentage of each analog input, digital inputs, counters, temperature and humidity, cable cut, LTE-M extended frame. Commands: input roles, analog thresholds and calibration, temperature calibration, counter preset, configuration read-back.
- **Voltages in volts**: the voltage of analog channels (`voltage`, type 0x0A) is returned in V on the ACW-CTS, ACW-WLL and ACW-MIO, like the battery voltages. The product sends it in mV.
- **Alert labels**: "on counter" for a counter alert (it said "on CO2").
- **ACW-PW** (pilot wire): new codec. Pilot wire mode, calendar default mode and the 7 calendar programs can be set (`setPilotWireMode`, `setPilotWireCalendarDefaultMode`, `setProgram1..7`) and read back (`getPilotWireConfiguration`). The responses to downlink frames are decoded (accepted configuration, rejected parameters, read-back values, downlink errors).
- **ACW-MT1**: new codec. Same frames as the MIO (counter, input state, movement detected by the accelerometer, LTE-M), with the parameter numbers of this product (input = parameter 30): input setting, counter preset, configuration read-back. The MIO-MT1 keeps the ACW-MIO codec.
- **ACW-MIO**: the "Counter" labels of the input read-back are translated in the English codec.
- **ACW-PIR**: the product has no light sensor; the `lux` field is removed from the codec and the BACnet definition. The frame sub-type (`type_frame`), the DQ sensor (`sensor_dq`) and the box state (`box`) are declared in the BACnet definition.

Changes compared with the previous ATIM BACnet codecs:

- **All codecs**
  - Measurements are returned as numbers (or arrays for historised frames) instead of `"v1, v2"` strings.
  - The datalogging period is read on 16 bits (only the low byte was read before).
  - The timestamp is an ISO 8601 UTC string. Before, it was a `dd/mm/yyyy` string with a hard-coded time zone.
  - `errors` is filled for empty, unsupported or unknown frames.
  - A single `encodeDownlink` per file. The raw-hex variant was dead code, shadowed by the second definition.
  - No implicit global variables: the codecs run in strict mode.
- **Counters (ACW-MR4, MR4-OPTO, TMxP, PTMxP, DIND21, DIND88)**: 32-bit counter indexes above 2,147,483,647 are no longer returned as negative numbers.
- **ACW-DIND21 / ACW-DIND88**: temperature is decoded (it was returned raw) and negative values are handled. The legacy digital input frames (0x4x family) are decoded into `input_state0..15`. The 4-20 mA current is scaled on DIND88.
- **ACW-MR2-EX (codec 2.0.0, breaking change)**: the LoRaWAN ECO frame (0x30) returns `index0` (most recent) to `index5` (oldest) instead of `counter0..5`. The Sigfox ECO frames (0x39–0x3B) return `counter_init` and `delta1..delta5` instead of `delta0..delta4`.
- **ACW-MR4 / ACW-TMxP / ACW-PTMxP**: in change-of-state frames, an input without an edge reports its level (`"high"` / `"low"`) instead of "no movement".
- **ACW-PIR**: the legacy PIR frame is decoded (`type_frame`, `box`, `sensor_dq`, `counter_pir`, `temperature_pir`).
- **ACW-PW**: temperature and humidity are numbers instead of strings.
- **ACW-WLL**: fixed a crash on every frame. The current leak detector, the ACW/MIO-WLK, is decoded by the ACW-MIO codec.
- **ACW-TMxP / ACW-PTMxP**: fixed a crash on some measurement frames. PTMxP no longer adds the raw payload as a `data` field.
