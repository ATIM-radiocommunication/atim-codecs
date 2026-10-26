# ACW-TCR – Sonde de température et d’humidité à inertie

<img src="acw-tcr.png" alt="ACW-TCR" width="200">

Sonde de température et d’humidité qui remonte la valeur instantanée (physique) et une valeur inertielle, représentative de la température des produits stockés.

## Modèles couverts

- ACW-TCR

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-TCR | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TCR/FRANCAIS/ATIM_ACW-TCR_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-TCR/FRANCAIS/ATIM_ACW-TCR_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-tcr-codec.js](acw-tcr-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/environment/acw-tcr](../../../en/environment/acw-tcr).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `temperature_physique` | Température physique | nombre | Cel |
| `temperature_inertielle` | Température inertielle | nombre | Cel |
| `humidity_physique` | Humidité physique | nombre | %RH |
| `humidity_inertielle` | Humidité inertielle | nombre | %RH |
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
| [acw-tcr-bacnet-definition.json](acw-tcr-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-tcr-bacnet-codec.js](acw-tcr-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Température et humidité physiques et inertielles** – payload `a00808850917de180870191794`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "temperature_physique": 21.81,
  "temperature_inertielle": 21.6,
  "humidity_physique": 61.1,
  "humidity_inertielle": 60.36
}
```

**Température et humidité physiques et inertielles historisées** – payload `a1003c0808a408850917a217de1808ac089819178417c0`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "periode": 60,
  "temperature_physique": [
    22.12,
    21.81
  ],
  "temperature_inertielle": [
    22.2,
    22
  ],
  "humidity_physique": [
    60.5,
    61.1
  ],
  "humidity_inertielle": [
    60.2,
    60.8
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

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
