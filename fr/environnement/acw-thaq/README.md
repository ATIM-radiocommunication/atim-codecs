# ACW-THAQ – Capteur de qualité d’air intérieur

<img src="acw-thaq.png" alt="ACW-THAQ" width="200">

Capteur de qualité d’air intérieur : température, humidité, CO2 (NDIR) et COV.

## Modèles couverts

- ACW-THAQ

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-THAQ | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THAQ/FRANCAIS/ATIM_ACW-THAQ_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-THAQ/FRANCAIS/ATIM_ACW-THAQ_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-thaq-codec.js](acw-thaq-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/environment/acw-thaq](../../../en/environment/acw-thaq).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `temperature0` | Température 1 | nombre | Cel |
| `humidity0` | Humidité 1 | nombre | %RH |
| `CO2` | CO2 | nombre | ppm |
| `VOC` | COV | nombre |  |
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
| [acw-thaq-bacnet-definition.json](acw-thaq-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-thaq-bacnet-codec.js](acw-thaq-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

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

**Température, humidité et COV** – payload `a00808850917de0c00a0`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "temperature0": 21.81,
  "humidity0": 61.1,
  "VOC": 160
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

**Trame de test horodatée : CO2, COV, humidité et température** – payload `c5646239dc0809080905040c01020d0f08`, fPort 1

```json
{
  "frame_type": "Trame de test",
  "temperature0": 23.12,
  "humidity0": 12.84,
  "VOC": 258,
  "CO2": 3848,
  "horodatage": "2023-05-15T13:55:40.000Z"
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

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
