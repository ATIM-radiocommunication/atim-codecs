# Contribuer

*English version: [../en/CONTRIBUTING.md](../en/CONTRIBUTING.md)*

## Signaler un problème de décodage

Ouvrez une issue avec :

- le produit et sa version de firmware ;
- le payload en hexadécimal et le fPort ;
- la sortie obtenue et la sortie attendue.

## Synchronisation des deux langues

Les **codecs français (`fr/`) sont la référence**. Les codecs anglais (`en/`) en sont générés par `npm run build` :

- les libellés et commentaires français sont traduits avec les tables de [`scripts/lib/i18n.js`](../scripts/lib/i18n.js). Les identifiants (variables, fonctions, noms de champs) sont traduits mot à mot avec son dictionnaire `WORDS`, en gardant l’ordre, les séparateurs et la casse (`valeur_hum0` → `value_hum0`, `voieTemp` → `channelTemp`) : le codec anglais est du code en anglais qui produit directement des champs anglais (`periode` → `period`, `compteur0` → `counter0`…) ;
- la génération s’arrête si une traduction donnait le même nom anglais à deux noms français différents d’un même fichier ;
- `en/<family>/<produit>/examples.json` est dérivé des exemples français.

Les fichiers BACnet (`<produit>-bacnet-definition.json`, `<produit>-bacnet-codec.js`) sont générés de la même façon : la définition française est la référence, voir [docs/bacnet.md](docs/bacnet.md).

`npm run build` écrit tous les fichiers générés. `npm test` échoue si l’un d’eux n’est pas à jour.

## Modifier un codec

1. Modifiez le codec français `fr/<famille>/<produit>/<produit>-codec.js`.
2. Ajoutez au `examples.json` français un cas de test pour ce que vous avez corrigé :

   ```json
   {
     "description": "Description courte de la trame",
     "type": "uplink",
     "input": { "bytes": "a00808850917de", "fPort": 1 },
     "output": { "data": { ... }, "errors": [], "warnings": [] }
   }
   ```

   Les cas descendants utilisent `"type": "downlink-encode"`, avec `input.data` et `output.bytes` en hexadécimal.
3. Si vous avez ajouté un libellé, un commentaire, une variable, une fonction, un champ de sortie ou une description d’exemple en français, ajoutez sa traduction anglaise dans `scripts/lib/i18n.js`.
4. Lancez `npm run build`, puis `npm test`. Chaque codec doit passer sous Node.js et dans le bac à sable, qui ne fournit ni `require`, ni `module`, ni `Buffer`, ni `process`. Lancez ensuite `npm run test:lns` (ou laissez la CI le faire) pour vérifier le codec dans les moteurs de TTN, ChirpStack v3 et ChirpStack v4.
5. Incrémentez `version` dans le `product.json` français et dans l’en-tête du codec français. Ajoutez une entrée dans les deux `CHANGELOG.md`. Un changement de sortie (champ renommé, type modifié) est un changement incompatible : incrémentez la version majeure.

## Ajouter un produit

1. Créez `fr/<famille>/<produit>/` avec le codec, `examples.json`, `product.json`, la définition BACnet, la photo et un README, et ajoutez le produit dans `fr/products.json`.
2. Lancez `npm run build` : il crée le codec, les exemples, le `product.json` et la définition BACnet anglais, ainsi que les codecs BACnet des deux langues.
3. Rédigez le `README.md` anglais et le `summary` anglais de `en/.../product.json`, puis ajoutez le produit aux deux README principaux (`en/README.md`, `fr/README.md`).

## Règles pour les fichiers codec

- Un fichier autonome par produit, sans dépendance.
- Exposer `decodeUplink` et, si le produit l’accepte, `encodeDownlink`, selon la LoRaWAN Payload Codec API (TS013).
- Ne pas utiliser d’API propre à Node.js (`Buffer`, `require`) : le fichier doit fonctionner dans TTN et ChirpStack.
- Écrire en ES5 (`var`, pas de fonctions fléchées, ni `let` / `const`, ni gabarits de chaînes, clés d’objet en décimal) : ChirpStack v3 n’accepte que l’ES5.
- Garder les adaptateurs de plateformes à la fin du fichier (`Decode` / `Encode` pour ChirpStack v3, `module.exports` pour Node.js).
