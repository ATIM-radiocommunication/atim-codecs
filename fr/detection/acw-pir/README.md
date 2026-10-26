# ACW-PIRxx – Détecteur de mouvement

<img src="acw-pir.png" alt="ACW-PIRxx" width="200">

Détecteur de mouvement infrarouge passif, avec modes alarme et comptage. Certaines variantes remontent aussi la température et l’humidité.

## Modèles couverts

- ACW-PIRxx

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-PIR | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-PIR/FRANCAIS/ATIM_ACW-PIR_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-PIR/FRANCAIS/ATIM_ACW-PIR_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-pir-codec.js](acw-pir-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/detection/acw-pir](../../../en/detection/acw-pir).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `temperature0` | Température 1 | nombre | Cel |
| `humidity0` | Humidité 1 | nombre | %RH |
| `compteur0` | Compteur 1 (détections) | nombre |  |
| `compteur_pir` | Compteur de détections PIR | nombre |  |
| `temperature_pir` | Sortie du capteur PIR | nombre | mV |
| `type_trame` | Ancienne trame PIR : « Trame d'ouverture boitier », « Trame alarme » ou « Trame de comptage » | texte |  |
| `boitier` | Ancienne trame PIR : « boitier ouvert » ou « boitier ferme » | texte |  |
| `capteur_dq` | Ancienne trame PIR : capteur DQ « Active », « Desactive » ou « Non utilise » | texte |  |
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
| [acw-pir-bacnet-definition.json](acw-pir-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-pir-bacnet-codec.js](acw-pir-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Température, humidité et compteur de détections** – payload `a00808850917de030005`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "temperature0": 21.81,
  "compteur0": 5,
  "humidity0": 61.1
}
```

**Température, humidité et compteur de détections historisés** – payload `a1003c0808a408850917a217de03000f000c`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "periode": 60,
  "temperature0": [
    22.12,
    21.81
  ],
  "compteur0": [
    15,
    12
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

**Trame produit PIR (ouverture du boîtier, compteur de détections)** – payload `3201000123002a0885`, fPort 1

```json
{
  "frame_type": "Produit PIR",
  "type_trame": "Trame d'ouverture boitier",
  "capteur_dq": "Non utilise",
  "compteur_pir": 42,
  "temperature_pir": 2181,
  "boitier": "boitier ouvert"
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
