# ACW-WLL – Détecteur de fuite (ancienne génération)

<img src="acw-wll.png" alt="ACW-WLL" width="200">

Détection de fuite d’eau par câble (CAB-WL, CAB-WLL avec localisation, CAB-WLL-OIL pour le fuel) ou par électrodes, avec deux sondes de température en option. La version intérieure WL-I a un buzzer de 100 dB ; la version extérieure WL-O est étanche IP66.

## Modèles couverts

- ACW/LW8-WL-I, ACW/SF8-WL-I (intérieur, avec buzzer)
- ACW/LW8-WL-O, ACW/SF8-WL-O (extérieur, IP66)

La tension `tension` est mesurée sur le câble ou entre les électrodes. Sur câble, elle reste proche de 0 au sec et monte en présence d’eau ; sur électrodes, c’est l’inverse. Le seuil d’alerte se règle dans le configurateur (500 mV par défaut, soit 0,5 V dans ce codec).

Le détecteur de fuite actuel, l’ACW/MIO-WLK, fait partie de la gamme MIO : son codec est [ACW-MIO](../../entrees-sorties/acw-mio).

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-WLL (WL-I, WL-O) | [PDF](https://atim.com/wp-content/uploads/documentation/ACW/ACW-WLL/FRANCAIS/ATIM_ACW-WLL_DS_FR.pdf) | [PDF](https://atim.com/wp-content/uploads/documentation/ACW/ACW-WLL/FRANCAIS/ATIM_ACW-WLL_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-wll-codec.js](acw-wll-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/detection/acw-wll](../../../en/detection/acw-wll).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `tension` | Tension mesurée sur le câble ou entre les électrodes | nombre | V |
| `temperature0` | Température 1 (sonde 1) | nombre | Cel |
| `temperature1` | Température 2 (sonde 2) | nombre | Cel |
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
| [acw-wll-bacnet-definition.json](acw-wll-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-wll-bacnet-codec.js](acw-wll-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Tension du câble de détection et deux températures** – payload `a00a000c0809341807da`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "tension": 0.012,
  "temperature0": 23.56,
  "temperature1": 20.1
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

**Tension du câble de détection historisée** – payload `a1003c0a000c000b`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "periode": 60,
  "tension": [
    0.012,
    0.011
  ]
}
```

**Trame de test au démarrage, câble au sec** – payload `850a00000809341807da`, fPort 1

```json
{
  "frame_type": "Trame de test",
  "tension": 0,
  "temperature0": 23.56,
  "temperature1": 20.1
}
```

**Fuite détectée (dépassement du seuil haut)** – payload `8d4a02c9`, fPort 1

```json
{
  "frame_type": "Trame d'alerte",
  "tension": 0.713,
  "alerte": "Dépassement du seuil haut sur la tension"
}
```

**Fin d’alerte de fuite** – payload `8d0a0010`, fPort 1

```json
{
  "frame_type": "Trame d'alerte",
  "tension": 0.016,
  "alerte": "Retour entre les seuils sur la tension"
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
