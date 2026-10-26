# ACW-PW – Contrôle de chauffage par fil pilote

<img src="acw-pw.png" alt="ACW-PW" width="200">

Module LoRaWAN de pilotage des radiateurs électriques par fil pilote. Il applique un mode fixe ou un calendrier de 7 programmes hebdomadaires, et remonte la température et l’humidité ambiantes.

## Modèles couverts

- ACW-PW
- ACW/LW8-PW

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-PW | [PDF](https://atim.com/wp-content/uploads/documentation/ACW/ACW-PW/ATIM_ACW-PW_DS_FR.pdf) | [PDF](https://atim.com/wp-content/uploads/documentation/ACW/ACW-PW/ATIM_ACW-PW_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-pw-codec.js](acw-pw-codec.js) | 1.0.0 | `decodeUplink`, `encodeDownlink`, `decodeDownlink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/environment/acw-pw](../../../en/environment/acw-pw).

## Champs remontés

Une mesure est un nombre, ou un tableau (échantillon le plus récent en premier) quand la trame contient un historique. Voir [format de sortie](../../docs/format-de-sortie.md).

| Champ | Description | Type | Unité |
|---|---|---|---|
| `temperature0` | Température ambiante | nombre | Cel |
| `humidity0` | Humidité ambiante | nombre | %RH |
| `periode` | Période d’enregistrement | nombre | minute |
| `voltagec` | Tension en charge (pendant l’émission) | nombre | V |
| `voltagev` | Tension à vide | nombre | V |
| `frame_type` | Type de trame | texte |  |
| `alerte` | Alerte | texte |  |
| `erreur` | Erreur | texte |  |
| `horodatage` | Horodatage de la trame (ISO 8601 UTC) | texte |  |

### Réponses aux commandes

Le produit répond aux trames descendantes. Ces champs n’apparaissent que dans ces réponses.

| Champ | Description | Type | Unité |
|---|---|---|---|
| `configuration_acceptee` | 1 si tous les paramètres ont été acceptés, 0 sinon | nombre |  |
| `parametres_refuses` | Position (à partir de 1) des paramètres refusés dans la trame envoyée | liste |  |
| `erreur_downlink` | Trame descendante refusée : cause | texte |  |
| `commande` | Numéro de la commande à laquelle le produit répond | nombre |  |
| `mode_fil_pilote` | Mode du fil pilote relu (0 à 6) | nombre |  |
| `mode_fil_pilote_libelle` | Libellé du mode du fil pilote | texte |  |
| `mode_defaut_calendrier` | Mode appliqué par le calendrier en dehors des programmes (1 à 6) | nombre |  |
| `mode_defaut_calendrier_libelle` | Libellé du mode par défaut du calendrier | texte |  |
| `programme1` … `programme7` | Programme relu, au format des commandes `setProgram1` … `setProgram7` | texte |  |
| `programme1_libelle` … `programme7_libelle` | Programme en clair, par ex. « Lun, Mar · 08:00-18:00 UTC · Confort » | texte |  |
| `periode_trame_vie` | Période de la trame de vie relue | texte |  |
| `horodatage_active` | Horodatage des trames montantes relu : 0 ou 1 | nombre |  |

## Modes du fil pilote

| Valeur | Mode |
|---|---|
| 0 | Calendrier (uniquement pour `setPilotWireMode`) |
| 1 | Confort |
| 2 | Éco |
| 3 | Hors gel |
| 4 | Arrêt |
| 5 | Confort -1 °C |
| 6 | Confort -2 °C |

## Commandes descendantes

Passez une ou plusieurs de ces clés dans `input.data` de `encodeDownlink`. Voir [commandes descendantes](../../docs/commandes-descendantes.md).

| Clé | Description | Type | Valeurs acceptées |
|---|---|---|---|
| `setKeepAlivePeriod` | Période de la trame de vie | texte | Disable / Désactivé, Once every 10 mins / Toutes les 10 minutes, Once every hour / Toutes les heures, Once every 2 hours / Toutes les 2 heures, Once every 4 hours / Toutes les 4 heures, Once every 8 hours / Toutes les 8 heures, Once every day / Tous les jours, Once every 2 days / Tous les 2 jours, Once every 3 days / Tous les 3 jours, Once every 4 days / Tous les 4 jours, Once every week / Toutes les semaines, Once every month (30 days) / Tous les mois (30 jours) |
| `setDataloggingPeriod` | Période d’enregistrement en minutes | nombre | 1 – 65535 minutes |
| `setTimestamp` | Horodatage des trames montantes : 0 = désactivé, 1 = activé | nombre | 0 – 1 |
| `setPilotWireMode` | Mode du fil pilote : 0 = suivre le calendrier, 1 à 6 = mode fixe | nombre | 0 – 6 |
| `setPilotWireCalendarDefaultMode` | Mode appliqué par le calendrier en dehors des programmes | nombre | 1 – 6 |
| `setProgram1` … `setProgram7` | Programme du calendrier (voir ci-dessous) | texte | `"HH:MM-HH:MM;jours;mode"` ou `{ start, end, days, mode }` |
| `getPilotWireConfiguration` | Relire les modes et les 7 programmes. À envoyer seule. | nombre | 1 |

### Programmes

Un programme s’écrit `"HH:MM-HH:MM;jours;mode"`, par exemple `"08:00-18:00;31;1"` : confort de 8 h à 18 h, du lundi au vendredi. La forme objet `{ "start": "08:00", "end": "18:00", "days": 31, "mode": 1 }` est équivalente.

- **Heures en UTC.** Le produit ne connaît pas le fuseau horaire : en France, 08:00 UTC correspond à 09:00 en hiver et à 10:00 en été.
- **jours** : somme des jours actifs, 0 à 127. Lundi = 1, mardi = 2, mercredi = 4, jeudi = 8, vendredi = 16, samedi = 32, dimanche = 64. Du lundi au vendredi = 31, tous les jours = 127, 0 = programme désactivé.
- **mode** : 1 à 6 (voir le tableau des modes).
- Le calendrier ne s’applique que si `setPilotWireMode` vaut 0.

Pour vérifier la configuration, envoyez `{"getPilotWireConfiguration": 1}` : le produit répond par une ou plusieurs trames de réponse à une commande qui contiennent les champs `mode_fil_pilote`, `mode_defaut_calendrier` et `programme1` … `programme7`.

## BACnet (passerelle MultiTech Conduit)

Pour exposer ce produit en BACnet sur une passerelle MultiTech Conduit (mPower, licence Payload Management), importez ces deux fichiers dans **Payload Management > Sensor Definitions > Import** :

| Fichier | Rôle |
|---|---|
| [acw-pw-bacnet-definition.json](acw-pw-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-pw-bacnet-codec.js](acw-pw-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

Les commandes ci-dessus sont des objets en écriture. Pour aider à les remplir depuis la supervision, trois objets texte rappellent leur format : `scheduleFormatHelp`, `pilotWireModeHelp` et `pilotWireCalendarDefaultModeHelp`. Ils n’existent que dans le codec BACnet.

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

**Trame de vie** – payload `810d240c68`, fPort 1

```json
{
  "frame_type": "Trame de vie",
  "voltagec": 3.176,
  "voltagev": 3.364
}
```

**Alerte de dépassement de seuil** – payload `8d480a28`, fPort 1

```json
{
  "frame_type": "Trame d'alerte",
  "alerte": "Dépassement du seuil haut sur la température voie 0",
  "temperature0": 26
}
```

**Configuration acceptée** – payload `8600`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de configuration",
  "configuration_acceptee": 1,
  "parametres_refuses": []
}
```

**Configuration refusée pour les paramètres 1 et 3** – payload `8605`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de configuration",
  "configuration_acceptee": 0,
  "parametres_refuses": [
    1,
    3
  ]
}
```

**Relecture des modes du fil pilote** – payload `870425002603`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de commande",
  "commande": 4,
  "mode_fil_pilote": 0,
  "mode_fil_pilote_libelle": "Calendrier",
  "mode_defaut_calendrier": 3,
  "mode_defaut_calendrier_libelle": "Hors gel"
}
```

**Relecture du programme 1** – payload `8704de07001e04387f0103`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de commande",
  "commande": 4,
  "programme1": "08:00-18:00;127;1",
  "programme1_libelle": "Lun, Mar, Mer, Jeu, Ven, Sam, Dim · 08:00-18:00 UTC · Confort"
}
```

**Relecture du programme 2 (désactivé)** – payload `8704df07001e0438000303`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de commande",
  "commande": 4,
  "programme2": "08:00-18:00;0;3",
  "programme2_libelle": "Programme désactivé"
}
```

**Réponse à une commande, horodatée** – payload `c7653c1a00042501`, fPort 1

```json
{
  "frame_type": "Réponse à une trame de commande",
  "horodatage": "2023-10-27T20:13:52.000Z",
  "commande": 4,
  "mode_fil_pilote": 1,
  "mode_fil_pilote_libelle": "Confort"
}
```

**Erreur de commande : paramètre inconnu** – payload `8803`, fPort 1

```json
{
  "frame_type": "Réponse à une trame erronee",
  "erreur_downlink": "Paramètre inconnu"
}
```

### Trames descendantes

| Description | `input.data` | Octets (hex) | fPort |
|---|---|---|---|
| Trame de vie une fois par jour | `{"setKeepAlivePeriod":"Once every day"}` | `0306` | 1 |
| Période d'enregistrement à 300 minutes | `{"setDataloggingPeriod":300}` | `d403012c01` | 1 |
| Activer l'horodatage des trames montantes | `{"setTimestamp":1}` | `0b01` | 1 |
| Trame de vie une fois par jour (valeur en français) | `{"setKeepAlivePeriod":"Tous les jours"}` | `0306` | 1 |
| Mode fil pilote : confort | `{"setPilotWireMode":1}` | `2501` | 1 |
| Mode fil pilote : calendrier | `{"setPilotWireMode":0}` | `2500` | 1 |
| Mode par défaut du calendrier : hors gel | `{"setPilotWireCalendarDefaultMode":3}` | `2603` | 1 |
| Programme 1 : tous les jours, 08:00-18:00 UTC, confort | `{"setProgram1":"08:00-18:00;127;1"}` | `de07001e04387f0103` | 1 |
| Programme 1 : tous les jours, 09:15-20:00 UTC, confort | `{"setProgram1":"09:15-20:00;127;1"}` | `de070022b4b07f0103` | 1 |
| Programme 2 désactivé | `{"setProgram2":"08:00-18:00;0;3"}` | `df07001e0438000303` | 1 |
| Programme 1 sous forme d’objet, 08:01-18:00 UTC | `{"setProgram1":{"start":"08:01","end":"18:00","days":127,"mode":1}}` | `de07001e14387f0103` | 1 |
| Relire la configuration du fil pilote | `{"getPilotWireConfiguration":true}` | `c10a0425261e1f2021222324` | 1 |
