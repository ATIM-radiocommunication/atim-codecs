# ACW-MR2-EX – Compteur d’impulsions ATEX

<img src="acw-mr2-ex.png" alt="ACW-MR2-EX" width="200">

Télérelève d’un ou deux compteurs à sortie impulsionnelle (contacts secs), certifié ATEX. Ce codec couvre aussi l’ancien ACW-MR2.

## Modèles couverts

- ACW-MR2-EX
- ACW-MR2

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-MR2-EX | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR2-EX/FRANCAIS/ATIM_ACW-MR2-EX_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-MR2-EX/FRANCAIS/ATIM_ACW-MR2-EX_UG_FR.pdf) |
| ACW-MR2 | [PDF (EN)](https://www.atim.com/wp-content/uploads/documentation/ACW/OLD%20PRODUCTS/MR2/ENGLISH/ATIM_ACW-MR2_DS_EN_V1.7.pdf) | [PDF (EN)](https://www.atim.com/wp-content/uploads/documentation/ACW/OLD%20PRODUCTS/MR2/ENGLISH/ATIM_ACW-MR2_UG_EN_V1.0.pdf) |

Les documents marqués (EN) n’existent qu’en anglais.

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-mr2-ex-codec.js](acw-mr2-ex-codec.js) | 2.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/metering/acw-mr2-ex](../../../en/metering/acw-mr2-ex).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `wirecut` | Coupure de câble | nombre (0/1) |  |
| `counter_init` | Index de référence | nombre |  |
| `periode` | Période d’enregistrement | nombre | minute |
| `voltagec` | Tension en charge (pendant l’émission) | nombre | V |
| `voltagev` | Tension à vide | nombre | V |
| `compteur1` | Compteur 1 (trames standard et de test) | nombre |  |
| `index0` | Compteur 1, index 0 (le plus récent) | nombre |  |
| `index1` | Compteur 1, index 1 | nombre |  |
| `index2` | Compteur 1, index 2 | nombre |  |
| `index3` | Compteur 1, index 3 | nombre |  |
| `index4` | Compteur 1, index 4 | nombre |  |
| `index5` | Compteur 1, index 5 (le plus ancien) | nombre |  |
| `compteur2` | Compteur 2 | nombre |  |
| `logic_level0` | Entrée 1 | nombre (0/1) |  |
| `logic_level1` | Entrée 2 | nombre (0/1) |  |
| `delta1` | Delta 1 | nombre |  |
| `delta2` | Delta 2 | nombre |  |
| `delta3` | Delta 3 | nombre |  |
| `delta4` | Delta 4 | nombre |  |
| `delta5` | Delta 5 | nombre |  |
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
| [acw-mr2-ex-bacnet-definition.json](acw-mr2-ex-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-mr2-ex-bacnet-codec.js](acw-mr2-ex-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Changement d'état des entrées** – payload `090003`, fPort 1

```json
{
  "frame_type": "Trame de détection de changement d'état (TOR)",
  "wirecut": 0,
  "logic_level1": 1,
  "logic_level0": 1
}
```

**Trame compteur ECO (LoRaWAN, six index 32 bits)** – payload `30000000050000000400000003000000020000000100000000`, fPort 1

```json
{
  "frame_type": "Trame Compteur mode ECO (Compteur 1 6 index 32 bits LoraWan)",
  "index0": 0,
  "index1": 1,
  "index2": 2,
  "index3": 3,
  "index4": 4,
  "index5": 5
}
```

**Trame compteur ECO (Sigfox, cinq deltas 12 bits)** – payload `3b003e8005004003002001`, fPort 1

```json
{
  "frame_type": "Trame 3B Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)",
  "counter_init": 1000,
  "delta1": 5,
  "delta2": 4,
  "delta3": 3,
  "delta4": 2,
  "delta5": 1
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

**Trame de mesure historisée** – payload `a1003c`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "periode": 60
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
