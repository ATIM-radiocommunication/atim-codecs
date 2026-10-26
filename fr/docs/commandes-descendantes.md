# Commandes descendantes

Tous les codecs, sauf celui de l’ACW-DINRSM-V2, partagent le même `encodeDownlink`. Il accepte une ou plusieurs des clés ci-dessous dans `input.data`. Plusieurs clés dans un même appel sont concaténées en une seule trame descendante, envoyée sur le **fPort 1**.

```js
encodeDownlink({ data: { setKeepAlivePeriod: "Tous les jours", setTimestamp: 1 } });
// -> { bytes: [0x0b, 0x01, 0x03, 0x06], fPort: 1, errors: [], warnings: [] }
```

## `setKeepAlivePeriod`

Période de la trame de vie. Trame : `03 <code>`. Les codecs français acceptent la valeur française ou la valeur anglaise.

| Valeur française | Valeur anglaise | Code |
|---|---|---|
| `"Désactivé"` | `"Disable"` | `00` |
| `"Toutes les 10 minutes"` | `"Once every 10 mins"` | `04` |
| `"Toutes les heures"` | `"Once every hour"` | `05` |
| `"Toutes les 2 heures"` | `"Once every 2 hours"` | `0a` |
| `"Toutes les 4 heures"` | `"Once every 4 hours"` | `0b` |
| `"Toutes les 8 heures"` | `"Once every 8 hours"` | `0c` |
| `"Tous les jours"` | `"Once every day"` | `06` |
| `"Tous les 2 jours"` | `"Once every 2 days"` | `0d` |
| `"Tous les 3 jours"` | `"Once every 3 days"` | `0e` |
| `"Tous les 4 jours"` | `"Once every 4 days"` | `0f` |
| `"Toutes les semaines"` | `"Once every week"` | `07` |
| `"Tous les mois (30 jours)"` | `"Once every month (30 days)"` | `08` |

La valeur doit correspondre exactement. Toute autre valeur est encodée comme `"Toutes les heures"`.

## `setDataloggingPeriod`

Période d’enregistrement en minutes, de 1 à 65535. Trame : `d4 03 01 <octet de poids faible> <octet de poids fort>`.

```js
encodeDownlink({ data: { setDataloggingPeriod: 300 } });   // -> d4 03 01 2c 01
```

## `setTimestamp`

Ajoute un horodatage aux trames montantes, décodé ensuite dans `horodatage`. `1` l’active, `0` le désactive. Trame : `0b <valeur>`.

```js
encodeDownlink({ data: { setTimestamp: 1 } });   // -> 0b 01
```

Pour les autres commandes de configuration, reportez-vous au guide utilisateur du produit.
