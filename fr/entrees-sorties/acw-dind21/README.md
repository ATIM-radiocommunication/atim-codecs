# ACW-DINDxx (DIND21) – Module d’entrées/sorties digitales

<img src="acw-dind21.png" alt="ACW-DINDxx (DIND21)" width="200">

Module d’entrées/sorties digitales : états de contacts secs, index de comptage et états des sorties.

## Modèles couverts

- ACW-DINDxx

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-DIND21 | [PDF (EN)](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-DIND21/ENGLISH/ATIM_ACW-DINDxxx_DS_EN.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-DIND21/FRANCAIS/ATIM_ACW-DIND21_UG_FR.pdf) |

Les documents marqués (EN) n’existent qu’en anglais.

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-dind21-codec.js](acw-dind21-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/io-modules/acw-dind21](../../../en/io-modules/acw-dind21).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `temperature0` | Température 1 | nombre | Cel |
| `voltagec` | Tension en charge (pendant l’émission) | nombre | V |
| `voltagev` | Tension à vide | nombre | V |
| `compteur0` | Compteur 1 (voie 0) | nombre |  |
| `compteur1` | Compteur 2 (voie 1) | nombre |  |
| `compteur2` | Compteur 3 (voie 2) | nombre |  |
| `input_state0` | Entrée 1 | nombre (0/1) |  |
| `input_state1` | Entrée 2 | nombre (0/1) |  |
| `input_state2` | Entrée 3 | nombre (0/1) |  |
| `input_state3` | Entrée 4 | nombre (0/1) |  |
| `input_state4` | Entrée 5 | nombre (0/1) |  |
| `input_state5` | Entrée 6 | nombre (0/1) |  |
| `input_state6` | Entrée 7 | nombre (0/1) |  |
| `input_state7` | Entrée 8 | nombre (0/1) |  |
| `input_state8` | Entrée 9 | nombre (0/1) |  |
| `input_state9` | Entrée 10 | nombre (0/1) |  |
| `input_state10` | Entrée 11 | nombre (0/1) |  |
| `input_state11` | Entrée 12 | nombre (0/1) |  |
| `input_state12` | Entrée 13 | nombre (0/1) |  |
| `input_state13` | Entrée 14 | nombre (0/1) |  |
| `input_state14` | Entrée 15 | nombre (0/1) |  |
| `input_state15` | Entrée 16 | nombre (0/1) |  |
| `output_state0` | Sortie 1 | nombre (0/1) |  |
| `output_state1` | Sortie 2 | nombre (0/1) |  |
| `output_state2` | Sortie 3 | nombre (0/1) |  |
| `output_state3` | Sortie 4 | nombre (0/1) |  |
| `output_state4` | Sortie 5 | nombre (0/1) |  |
| `output_state5` | Sortie 6 | nombre (0/1) |  |
| `output_state6` | Sortie 7 | nombre (0/1) |  |
| `output_state7` | Sortie 8 | nombre (0/1) |  |
| `frame_type` | Type de trame | texte |  |
| `alerte` | Alerte | texte |  |
| `erreur` | Erreur | texte |  |

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
| [acw-dind21-bacnet-definition.json](acw-dind21-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-dind21-bacnet-codec.js](acw-dind21-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Entrées et sorties digitales, température et compteur** – payload `6efd0100fa00017ce6`, fPort 1

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

**Trame de vie** – payload `810e100dac`, fPort 1

```json
{
  "frame_type": "Trame de vie",
  "voltagec": 3.5,
  "voltagev": 3.6
}
```

**Entrées digitales, température négative et compteur** – payload `4ef5fffff600017ce6`, fPort 1

```json
{
  "frame_type": "Trame d’entrées digitales,température et compteur 1",
  "temperature0": -1,
  "compteur1": 97510,
  "input_state0": 1,
  "input_state1": 0,
  "input_state2": 1,
  "input_state3": 0,
  "input_state4": 1,
  "input_state5": 1,
  "input_state6": 1,
  "input_state7": 1,
  "input_state8": 1,
  "input_state9": 1,
  "input_state10": 1,
  "input_state11": 1,
  "input_state12": 1,
  "input_state13": 1,
  "input_state14": 1,
  "input_state15": 1
}
```

**Trame de mesure de température** – payload `a0080885`, fPort 1

```json
{
  "frame_type": "Trame de mesure",
  "temperature0": 21.81
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
