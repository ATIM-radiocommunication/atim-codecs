# BACnet (MultiTech Conduit)

Une passerelle MultiTech Conduit avec la licence **Payload Management** (mPower 6.3.2 ou plus récent) décode les trames LoRaWAN et expose les valeurs décodées sous forme d’objets BACnet. Chaque dossier produit contient les deux fichiers dont la passerelle a besoin :

| Fichier | Rôle |
|---|---|
| `<produit>-bacnet-definition.json` | Définition du capteur : les propriétés BACnet du produit |
| `<produit>-bacnet-codec.js` | Décodeur/encodeur référencé par la définition |

## Importer un produit

1. Dans l’interface web de la passerelle, ouvrez **Payload Management > Sensor Definitions**, onglet **Import**.
2. Saisissez le fabricant (`ATIM`) et le type de capteur (par exemple `ACW-THX`).
3. Sélectionnez le fichier de définition et le fichier codec du produit, puis cliquez sur **Import**.

Les erreurs de décodage apparaissent dans **Status & Logs > Payload Management**. En SSH, un codec se teste sur la passerelle avec `packet-decoder-cli --js-uplink-decoder <fichier> --port 1 --packet <hex> --stdout`.

Prenez les fichiers de la langue souhaitée pour les noms des objets BACnet : `fr/` donne `periode`, `"Trame de mesure"`…, `en/` donne `period`, `"Measurement frame"`…

## Fichier de définition

```json
{
    "description": "ACW-THX: Capteur de température et d’humidité",
    "version": "1.0.0",
    "properties": {
        "temperature0": { "type": "float", "units": "celsius" },
        "periode": { "type": "uint16", "units": "minutes" },
        "frame_type": { "type": "string" },
        "uplinkRSSI": { "name": "uplinkRSSI", "type": "int16", "units": "decibels-millivolt" },
        "setKeepAlivePeriod": { "type": "string", "downlink": true }
    },
    "decoder": "acw-thx-bacnet-codec.js",
    "encoder": "acw-thx-bacnet-codec.js"
}
```

- Chaque propriété devient un objet BACnet, qui porte le nom du champ décodé.
- `type` vaut `float`, `int16`, `uint8`, `uint16`, `uint32` ou `string`.
- `units` vaut `celsius`, `percent`, `volts`, `millivolts`, `amperes`, `milliamperes`, `pascal`, `ppm`, `lux`, `minutes`, `decibels` ou `decibels-millivolt`.
- Les propriétés marquées `"downlink": true` sont des objets **en écriture**. Écrire une valeur appelle `encodeDownlink` et envoie la commande sur le fPort 1. Voir [commandes descendantes](commandes-descendantes.md).
- `uplinkFCnt`, `uplinkRSSI`, `uplinkSNR` et `scheduleDownlinkStatus` (avec une clé `name`) sont renseignés par la passerelle, pas par le codec.

## Ce que renvoie le codec BACnet

Le codec BACnet est le codec du produit suivi d’une petite couche, car un objet BACnet ne contient qu’une seule valeur :

| Sortie du codec | Valeur BACnet |
|---|---|
| Nombre | Inchangé |
| Tableau (trame historisée) | L’échantillon le plus récent (premier élément) |
| `"état haut"` / `"mise à l'état haut"` | `1` |
| `"état bas"` / `"mise à l'état bas"` | `0` |
| Valeur non numérique pour une propriété numérique (par exemple `"erreur"`) | Non envoyée : l’objet BACnet n’est pas mis à jour par cette trame |
| Champ absent de la définition | Non envoyé |

```js
// codec :        { frame_type: "Trame de mesure", periode: 60, temperature0: [23.12, 23.05, 22.98] }
// codec BACnet : { frame_type: "Trame de mesure", periode: 60, temperature0: 23.12 }
```

## Modifier une définition

La définition française (`fr/<famille>/<produit>/<produit>-bacnet-definition.json`) est la référence. Après l’avoir modifiée, ou après avoir modifié un codec français, lancez `npm run build` : il écrit la définition anglaise et les codecs BACnet des deux langues. `npm test` vérifie qu’ils sont à jour et fait passer tous les exemples dans les codecs BACnet.
