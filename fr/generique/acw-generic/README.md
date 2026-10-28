# ACW-GENERIC – Décodeur générique de la gamme ACW

Décodeur pour les produits ACW qui n’ont pas de codec dédié dans ce dépôt (par exemple l’ACW-LVL), ou pour lire une trame dont on ne connaît pas le produit. Il décode toutes les trames de la gamme ACW, nouvelle génération et anciens produits, sans connaître le produit : les champs sont nommés par type de mesure et par voie.

Quand le produit a son propre codec, utilisez plutôt celui-ci : ses champs ont le nom et l’unité propres au produit (par exemple `VOC` sur l’ACW-THAQ au lieu de `taux0`), et il encode les commandes propres au produit.

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-generic-codec.js](acw-generic-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/generic/acw-generic](../../../en/generic/acw-generic).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md). Le chiffre final est la voie de la mesure (0 à 3), lue dans la trame.

### Trames de mesure, de test et d’alerte

| Champ | Type de mesure | Description | Unité |
|---|---|---|---|
| `temperature0` … `temperature3` | 0x08 | Température | Cel |
| `humidity0` … `humidity3` | 0x09 | Humidité | %RH |
| `compteur0` … `compteur3` | 0x04, 0x03 | Index de compteur (32 bits ; 16 bits pour le compteur de détections du PIR, type 0x03) | |
| `input_state0` … `input_state3` | 0x01 | État des entrées TOR : 1/0, ou `"mise à l'état haut"`, `"mise à l'état bas"`, `"état haut"`, `"état bas"` dans les trames de changement d’état | |
| `tension0` … `tension3` | 0x0A | Tension | V |
| `courant0` … `courant3` | 0x0B | Courant, en centièmes de l’unité du produit : A sur l’ACW-CTS, mA sur l’ACW-MIO | A ou mA |
| `taux0` … `taux3` | 0x0C | Valeur brute, dont le sens dépend du produit : niveau en % (ACW-GAUG), COV (ACW-THAQ), centièmes de % (ACW-MIO) | |
| `CO2` | 0x0D | CO2 | ppm |
| `lux` | 0x05 | Luminosité | lx |
| `distance` | 0x07 | Distance | mm |
| `pression_differentielle` | 0x06 | Pression différentielle | Pa |
| `cable_coupe` | | Trame spécifique de coupure de câble : 1 = câble coupé, 0 = câble rétabli | |
| `periode` | | Période d’enregistrement | minute |
| `voltagec` | | Tension en charge (pendant l’émission), trame de vie | V |
| `voltagev` | | Tension à vide, trame de vie | V |
| `frame_type` | | Type de trame | |
| `alerte` | | Alerte de seuil, par exemple « Dépassement du seuil haut sur le courant voie 0 » | |
| `erreur` | | Erreur signalée par le produit | |
| `horodatage` | | Horodatage de la trame (ISO 8601 UTC) | |

Un échantillon que le capteur n’a pas pu mesurer vaut `"erreur"` (température, humidité, CO2).

En LTE-M et NB-IoT, la trame de mesure étendue ajoute `index_trame`, et la trame de vie peut contenir la position GPS (`etat_gps`, `latitude`, `longitude`). Voir [format de sortie](../../docs/format-de-sortie.md#produits-en-lte-m--nb-iot).

### Réponses aux commandes

| Champ | Description | Type |
|---|---|---|
| `configuration_acceptee` | 1 si tous les paramètres ont été acceptés, 0 sinon | nombre |
| `parametres_refuses` | Position (à partir de 1) des paramètres refusés dans la trame envoyée | liste |
| `erreur_downlink` | Trame descendante refusée : cause | texte |
| `commande` | Numéro de la commande à laquelle le produit répond | nombre |
| `periode_trame_vie` | Période de la trame de vie relue | texte |
| `horodatage_active` | Horodatage des trames montantes relu : 0 ou 1 | nombre |
| `profondeur_historique`, `nombre_echantillons`, `periode_emission` | Enregistrement relu | nombre |
| `parametre<n>` | Autre paramètre relu (propre au produit), en hexadécimal | texte |
| `reponse` | Réponse à une autre commande, en hexadécimal | texte |

### Anciens produits

Le type de trame (`frame_type`) est le libellé de la trame, par exemple « Trame d’entrées digitales et température ».

| Champ | Produit | Description | Unité |
|---|---|---|---|
| `input_state0` … `input_state15` | DIND | Entrées TOR (1/0) | |
| `output_state0` … `output_state7` | DIND | Sorties TOR (1/0) | |
| `temperature0` | DIND | Température | Cel |
| `compteur0` … `compteur8` | DIND, MR2 | Compteurs | |
| `tension`, `current`, `logic_level_dinda` | DINDA | Entrée 0-10 V (V), entrée 4-20 mA (mA), niveau logique brut | V, mA |
| `temperature0`, `temperature1` | TM1D, TM2D | Températures des sondes S1 et S2 | Cel |
| `index0` … `index5` | MR2 | Index de la trame compteur ECO LoRaWAN (0 = le plus récent) | |
| `counter_init`, `delta1` … `delta5` | MR2 | Compteur et deltas des trames compteur ECO Sigfox | |
| `logic_level0`, `logic_level1`, `wirecut` | MR2 | Niveaux des entrées et coupure de câble | |
| `type_trame`, `boitier`, `capteur_dq`, `compteur_pir`, `temperature_pir` | PIR | Trame PIR | |

## Commandes descendantes

Seules les commandes communes à la gamme sont encodées. Passez une ou plusieurs de ces clés dans `input.data` de `encodeDownlink`. Voir [commandes descendantes](../../docs/commandes-descendantes.md).

| Clé | Description | Type | Valeurs acceptées |
|---|---|---|---|
| `setKeepAlivePeriod` | Période de la trame de vie | texte | Disable / Désactivé, Once every hour / Toutes les heures, Once every day / Tous les jours… (voir [commandes descendantes](../../docs/commandes-descendantes.md)) |
| `setDataloggingPeriod` | Période d’enregistrement en minutes | nombre | 1 – 65535 minutes |
| `setTimestamp` | Horodatage des trames montantes : 0 = désactivé, 1 = activé | nombre | 0 – 1 |

## BACnet

Le décodeur générique n’a pas de fichiers BACnet : une définition BACnet déclare les propriétés d’un produit donné. Utilisez les fichiers BACnet du codec du produit.

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

**Deux voies de température et d’humidité** – payload `a00808850917de180870191794`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "temperature0": 21.81,
  "temperature1": 21.6,
  "humidity0": 61.1,
  "humidity1": 60.36
}
```

**Trame de test horodatée : CO2, taux, humidité et température** – payload `c5646239dc0809080905040c01020d0f08`, fPort 1

```json
{
  "frame_type": "Trame de test",
  "temperature0": 23.12,
  "humidity0": 12.84,
  "taux0": 258,
  "CO2": 3848,
  "horodatage": "2023-05-15T13:55:40.000Z"
}
```

**Entrées digitales et compteur** – payload `a001010400000052`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "compteur0": 82,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 0,
  "input_state3": 0
}
```

**Changement d'état des entrées** – payload `a00111`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "input_state0": "mise à l'état haut",
  "input_state1": "état bas",
  "input_state2": "état bas",
  "input_state3": "état bas"
}
```

**Courant et tension historisés, 2 échantillons** – payload `a1003c0b03e804b01a09600974`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "periode": 60,
  "tension1": [
    2.4,
    2.42
  ],
  "courant0": [
    10,
    12
  ]
}
```

**Distance** – payload `a00704d2`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "distance": 1234
}
```

**Alerte : dépassement du seuil haut, courant de la voie 0** – payload `8d4b03e8`, fPort 1

```json
{
  "frame_type": "Trame d'alerte",
  "alerte": "Dépassement du seuil haut sur le courant voie 0",
  "courant0": 10
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

**Coupure de câble détectée** – payload `8f1c20`, fPort 1

```json
{
  "frame_type": "Trame spécifique",
  "cable_coupe": 1
}
```

**Relecture des paramètres communs, et d’un paramètre propre au produit en hexadécimal** – payload `870403060b019400113c001a16`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de commande",
  "commande": 4,
  "periode_trame_vie": "Tous les jours",
  "horodatage_active": 1,
  "profondeur_historique": 1,
  "nombre_echantillons": 2,
  "periode_emission": 60,
  "parametre26": "16"
}
```

**Ancien produit : entrées et sorties digitales, température et compteur** – payload `6efd0100fa00017ce6`, fPort 1

```json
{
  "frame_type": "Trame d’entrées/sorties digitales, température et compteur 1",
  "temperature0": 25,
  "compteur1": 97510,
  "output_state0": 1,
  "output_state1": 0,
  "output_state2": 0,
  "output_state3": 0,
  "output_state4": 0,
  "output_state5": 0,
  "output_state6": 0,
  "output_state7": 0,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 1,
  "input_state3": 1,
  "input_state4": 1,
  "input_state5": 1,
  "input_state6": 1,
  "input_state7": 1
}
```

**Ancien produit : trame compteur ECO (LoRaWAN, six index 32 bits)** – payload `30000000050000000400000003000000020000000100000000`, fPort 1

```json
{
  "frame_type": "Trame Compteur mode ECO (Compteur 1 6 index 32 bits LoraWan)",
  "index5": 5,
  "index4": 4,
  "index3": 3,
  "index2": 2,
  "index1": 1,
  "index0": 0
}
```

**Ancien produit : relevé périodique des deux températures du TM2D** – payload `1a0190ff70`, fPort 1

```json
{
  "frame_type": "Trame de relevé périodique de deux temperatures",
  "temperature0": 25,
  "temperature1": -9
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
