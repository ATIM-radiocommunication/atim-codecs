# Format de sortie

Cette page décrit ce que renvoie `decodeUplink` dans les codecs français.

## Objet résultat

```js
{
  data: { ... },      // champs décodés
  errors: [ ... ],    // vide si le décodage a réussi
  warnings: [ ... ]
}
```

| Situation | `data` | `errors` |
|---|---|---|
| Trame valide | Champs décodés | `[]` |
| Payload vide | `{}` | `["Empty payload"]` |
| Payload illisible | `{}` | `["Unsupported payload: <hex>"]` |
| Type de trame inconnu | `{ frame_type: "Type de trame inconnu" }` | `["Unknown frame type for payload <hex>"]` |

Les messages de `errors` sont en anglais dans les deux versions. Certains serveurs réseau ignorent `data` quand `errors` n’est pas vide.

## Valeurs des champs

- **Une mesure est un nombre.** Une trame à un seul échantillon donne `temperature0: 21.81`.
- **Une trame historisée donne un tableau**, échantillon le plus récent en premier : `temperature0: [23.12, 23.05, 22.98]`.
  Testez `Array.isArray()` si votre application doit gérer les deux cas.
- **Erreur capteur** : un échantillon que le capteur n’a pas pu mesurer vaut la chaîne `"erreur"`.
- **Entrées digitales** dans les trames de changement d’état : un libellé plutôt que 0/1.
  - `"mise à l'état haut"` / `"mise à l'état bas"` : un front a été détecté sur cette entrée ;
  - `"état haut"` / `"état bas"` : pas de front, niveau courant.

## Champs communs

| Champ | Signification | Type / unité |
|---|---|---|
| `frame_type` | Type de trame, par exemple `"Trame de mesure"`, `"Trame de vie"`, `"Trame d'alerte"` | texte |
| `periode` | Période d’enregistrement | minutes |
| `horodatage` | Horodatage de la trame, présent quand l’horodatage est activé sur le produit (`setTimestamp`) | texte ISO 8601 UTC |
| `voltagec` | Tension en charge, pendant l’émission (trame de vie) | V |
| `voltagev` | Tension à vide (trame de vie) | V |
| `alerte` | Description de l’alerte (trames d’alerte). Plusieurs alertes sont séparées par ` \| ` | texte |
| `erreur` | Description de l’erreur (trames d’erreur) | texte |

Les champs propres à chaque produit sont listés dans son README.

## Produits en LTE-M / NB-IoT

En LTE-M et NB-IoT, les produits envoient des trames plus grandes. Les codecs décodent ces deux variantes, quel que soit le produit :

- **Trame de mesure étendue** (`frame_type: "Trame de mesure étendue"`) : mêmes mesures que la trame de mesure, avec jusqu’à 16 profondeurs d’historique et 256 échantillons. Elle ajoute :

  | Champ | Signification | Type |
  |---|---|---|
  | `index_trame` | Compteur des trames émises, incrémenté à chaque trame : un saut signale une trame perdue | nombre |
  | `periode` | Période d’émission, toujours présente | minutes |

- **Trame de vie avec position GPS** (si le GPS est activé) :

  | Champ | Signification | Type |
  |---|---|---|
  | `etat_gps` | `"Position trouvée"`, `"Position non trouvée"` ou `"Défaut matériel du GPS"` | texte |
  | `latitude`, `longitude` | Position en degrés décimaux (négatif au sud et à l’ouest), seulement quand la position est trouvée | nombre |

Ces trames arrivent par MQTT et non par un serveur réseau LoRaWAN. Elles ne passent donc pas par une passerelle BACnet.

## Exemples

```json
{ "frame_type": "Trame de mesure", "periode": 60, "temperature0": [23.12, 23.12, 23.12, 23.12], "horodatage": "2023-02-08T13:25:19.000Z" }
```

```json
{ "frame_type": "Trame de vie", "voltagec": 3.5, "voltagev": 3.6 }
```

```json
{ "frame_type": "Trame de mesure étendue", "index_trame": 1, "periode": 60, "temperature0": 21.81, "humidity0": 61.1 }
```

```json
{ "frame_type": "Trame de vie", "voltagec": 3.176, "voltagev": 3.364, "etat_gps": "Position trouvée", "latitude": 45.05135, "longitude": 5.5457 }
```

```json
{ "frame_type": "Trame d'erreur", "erreur": "EEPROM est corrompue" }
```

## Codecs français et anglais

Les [codecs anglais](../../en/README.md) reposent sur la même logique, avec des noms de champs et des libellés en anglais. Les noms de champs anglais sont une traduction mot à mot des noms français, dans le même ordre (`temperature_physique` → `temperature_physical`), sauf quelques termes usuels comme `differential_pressure` :

| Français | Anglais |
|---|---|
| `periode` | `period` |
| `horodatage` | `timestamp` |
| `index_trame` | `frame_index` |
| `etat_gps` | `gps_status` |
| `alerte` | `alert` |
| `erreur` | `error` |
| `compteur0`, `compteur1`… | `counter0`, `counter1`… |
| `courant` | `current` |
| `tension` | `voltage` |
| `current` (entrée 4-20 mA du DIND88) | `current_analog` |
| `pression_differentielle` | `differential_pressure` |
| `taux` | `rate` |
| `temperature_physique`, `temperature_inertielle` | `temperature_physical`, `temperature_inertial` |
| `humidity_physique`, `humidity_inertielle` | `humidity_physical`, `humidity_inertial` |
| `compteur_pir`, `temperature_pir` | `counter_pir`, `temperature_pir` |
| `boitier`, `capteur_dq`, `type_trame` | `box`, `sensor_dq`, `type_frame` |

Les autres champs (`temperature0`, `humidity0`, `voltagec`, `input_state0`, `index0`…) portent le même nom dans les deux versions.
