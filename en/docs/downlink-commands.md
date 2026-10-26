# Downlink commands

All codecs except ACW-DINRSM-V2 share the same `encodeDownlink`. It accepts one or more of the keys below in `input.data`. Several keys in one call are concatenated into a single downlink, sent on **fPort 1**.

```js
encodeDownlink({ data: { setKeepAlivePeriod: "Once every day", setTimestamp: 1 } });
// -> { bytes: [0x0b, 0x01, 0x03, 0x06], fPort: 1, errors: [], warnings: [] }
```

## `setKeepAlivePeriod`

Period of the keep alive frame. Frame: `03 <code>`.

| Value | Code |
|---|---|
| `"Disable"` | `00` |
| `"Once every 10 mins"` | `04` |
| `"Once every hour"` | `05` |
| `"Once every 2 hours"` | `0a` |
| `"Once every 4 hours"` | `0b` |
| `"Once every 8 hours"` | `0c` |
| `"Once every day"` | `06` |
| `"Once every 2 days"` | `0d` |
| `"Once every 3 days"` | `0e` |
| `"Once every 4 days"` | `0f` |
| `"Once every week"` | `07` |
| `"Once every month (30 days)"` | `08` |

The value must match exactly. Any other value is encoded as `"Once every hour"`.

## `setDataloggingPeriod`

Datalogging period in minutes, from 1 to 65535. Frame: `d4 03 01 <LSB> <MSB>`.

```js
encodeDownlink({ data: { setDataloggingPeriod: 300 } });   // -> d4 03 01 2c 01
```

## `setTimestamp`

Adds a timestamp to uplinks, which is then decoded as `timestamp`. `1` enables it and `0` disables it. Frame: `0b <value>`.

```js
encodeDownlink({ data: { setTimestamp: 1 } });   // -> 0b 01
```

For other configuration commands, see the product user guide.
