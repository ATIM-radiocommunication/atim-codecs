# Intégration aux plateformes

Chaque fichier codec (`<produit>-codec.js`) s’utilise tel quel : pas de compilation, pas de dépendance.

## The Things Stack (TTN v3)

1. Ouvrez votre application, puis **Payload formatters → Uplink**.
2. Choisissez **Custom Javascript formatter** et collez le contenu du fichier codec.
3. Collez le même fichier dans **Payload formatters → Downlink** pour utiliser `encodeDownlink`.
4. Vérifiez le résultat avec **Test** et une trame tirée du `examples.json` du produit.

Le formatter peut aussi être défini par équipement, ce qui est pratique quand une application mélange plusieurs produits ATIM.

## ChirpStack v4

1. Ouvrez **Device profiles** et sélectionnez le profil de vos équipements ATIM.
2. Dans l’onglet **Codec**, choisissez **JavaScript functions**.
3. Collez le contenu du fichier codec et enregistrez.

ChirpStack v4 appelle directement `decodeUplink` et `encodeDownlink`.

## ChirpStack v3

1. Ouvrez **Device-profiles** et sélectionnez le profil.
2. Dans l’onglet **Codec**, choisissez **Custom JavaScript codec functions**.
3. Collez le contenu du fichier codec dans les deux champs (décodage et encodage) et enregistrez.

ChirpStack v3 appelle `Decode(fPort, bytes, variables)` et `Encode(fPort, obj, variables)`. Ces adaptateurs sont définis à la fin de chaque fichier codec.

## Node.js

```js
const { decodeUplink, encodeDownlink } = require("./comptage/acw-mr4/acw-mr4-codec.js");

const result = decodeUplink({ bytes: [0x81, 0x0e, 0x10, 0x0d, 0xac], fPort: 1 });
```

## Construction des fichiers codec

Comme dans la plupart des dépôts de codecs LoRaWAN, chaque fichier contient la logique de décodage et de petits points d’entrée par plateforme :

| Fonction | Utilisée par |
|---|---|
| `decodeUplink(input)`, `encodeDownlink(input)` | TTN v3, ChirpStack v4, toute plateforme conforme TS013 |
| `Decode(fPort, bytes, variables)`, `Encode(fPort, obj, variables)` | ChirpStack v3 |
| `module.exports` (uniquement si `module` existe) | Node.js |

Les codecs n’utilisent que du JavaScript standard (ni `Buffer`, ni `require`, ni autre API Node.js) : le même fichier fonctionne partout.
