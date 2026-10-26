# ACW-THX – Capteur de température et d’humidité

<img src="acw-thx.png" alt="ACW-THX" width="200">

Capteurs de température et d’humidité intérieurs et extérieurs, pour suivre le confort, l’efficacité énergétique et les conditions de stockage.

## Modèles couverts

- ACW-TH
- ACW-TH Indoor v2
- ACW-THX-I
- ACW-TH-O

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-THX v2 (TH-I v2) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX/FRANCAIS/ATIM_ACW-THX_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX/FRANCAIS/ATIM_ACW-THX-V2_UG_FR.pdf) |
| ACW-THX-O v2 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX-O-V2/FRANCAIS/ATIM_ACW-THX-O_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THX-O-V2/FRANCAIS/ATIM_ACW-THX-O_V2_UG_FR.pdf) |
| ACW-TH-I | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-I/FRANCAIS/ATIM_ACW-TH-I_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-I/FRANCAIS/ATIM_ACW-TH-I_UG_FR.pdf) |
| ACW-TH-O | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-O/FRANCAIS/ATIM_ACW-TH-O_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TH-O/FRANCAIS/ATIM_ACW-TH-O_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-thx-codec.js](acw-thx-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/environment/acw-thx](../../../en/environment/acw-thx).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `temperature0` | Température 1 | nombre | Cel |
| `humidity0` | Humidité 1 | nombre | %RH |
| `periode` | Période d’enregistrement | nombre | minute |
| `voltagec` | Tension en charge (pendant l’émission) | nombre | V |
| `voltagev` | Tension à vide | nombre | V |
| `frame_type` | Type de trame | texte |  |
| `alerte` | Alerte | texte |  |
| `erreur` | Erreur | texte |  |
| `horodatage` | Horodatage de la trame (ISO 8601 UTC) | texte |  |

## Commandes descendantes

Passez une ou plusieurs de ces clés dans `input.data` de `encodeDownlink`. Voir [commandes descendantes](../../docs/commandes-descendantes.md).

| Clé | Description | Type | Valeurs acceptées |
|---|---|---|---|
| `setKeepAlivePeriod` | Période de la trame de vie | texte | Disable / Désactivé, Once every 10 mins / Toutes les 10 minutes, Once every hour / Toutes les heures, Once every 2 hours / Toutes les 2 heures, Once every 4 hours / Toutes les 4 heures, Once every 8 hours / Toutes les 8 heures, Once every day / Tous les jours, Once every 2 days / Tous les 2 jours, Once every 3 days / Tous les 3 jours, Once every 4 days / Tous les 4 jours, Once every week / Toutes les semaines, Once every month (30 days) / Tous les mois (30 jours) |
| `setDataloggingPeriod` | Période d’enregistrement en minutes | nombre | 1 – 65535 minutes |
| `setTimestamp` | Horodatage des trames montantes : 0 = désactivé, 1 = activé | nombre | 0 – 1 |

## BACnet (passerelle MultiTech Conduit)

Pour exposer ce produit en BACnet sur une passerelle MultiTech Conduit (mPower, licence Payload Management), importez ces deux fichiers dans **Payload Management > Sensor Definitions > Import** :

| Fichier | Rôle |
|---|---|
| [acw-thx-bacnet-definition.json](acw-thx-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-thx-bacnet-codec.js](acw-thx-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Température et humidité** – payload `a00808850917de`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "temperature0": 21.81,
  "humidity0": 61.1
}
```

**Température et humidité historisées** – payload `a1003c0808a408850917a217de`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "periode": 60,
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

**Trame de vie** – payload `810e100dac`, fPort 1

```json
{
  "frame_type": "Trame de vie",
  "voltagec": 3.5,
  "voltagev": 3.6
}
```

**Trame de mesure étendue (LTE-M / NB-IoT)** – payload `8900000001010001003c0808850917de`, fPort 1

```json
{
  "frame_type": "Trame de mesure étendue",
  "index_trame": 1,
  "periode": 60,
  "temperature0": 21.81,
  "humidity0": 61.1
}
```

**Trame de mesure étendue horodatée, 2 échantillons** – payload `c96a803ba600000002010002003c08088508fc0917de1388`, fPort 1

```json
{
  "frame_type": "Trame de mesure étendue",
  "index_trame": 2,
  "periode": 60,
  "temperature0": [
    21.81,
    23
  ],
  "humidity0": [
    61.1,
    50
  ],
  "horodatage": "2026-08-15T10:12:54.000Z"
}
```

**Trame de vie avec position GPS (LTE-M / NB-IoT)** – payload `810d240c6803293ee90513c6`, fPort 1

```json
{
  "frame_type": "Trame de vie",
  "voltagec": 3.176,
  "voltagev": 3.364,
  "etat_gps": "Position trouvée",
  "latitude": 45.05135,
  "longitude": 5.5457
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
