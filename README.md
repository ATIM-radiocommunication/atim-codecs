<img src="atim.png" alt="ATIM" height="60">

# ATIM LoRaWAN Codecs

Payload decoders and downlink encoders for the **ATIM ACW** range of LoRaWAN devices: one self-contained JavaScript file per product, for The Things Stack, ChirpStack, BACnet gateways (MultiTech) and Node.js.

Décodeurs de trames et encodeurs de commandes pour la gamme LoRaWAN **ATIM ACW** : un fichier JavaScript autonome par produit, pour The Things Stack, ChirpStack, les passerelles BACnet (MultiTech) et Node.js.

| | |
|---|---|
| 🇬🇧 **[English](en/README.md)** | Codecs with English field names and labels (`period`, `"Measurement frame"`) |
| 🇫🇷 **[Français](fr/README.md)** | Codecs avec champs et libellés en français (`periode`, `"Trame de mesure"`) |

Both versions decode the same frames with the same logic. Only the output language differs. Pick the one that matches your application.

Les deux versions décodent les mêmes trames avec la même logique. Seule la langue de sortie change : choisissez celle qui convient à votre application.

```
en/   English codecs and documentation
fr/   codecs et documentation en français
scripts/test.js   test runner / tests (npm test)
```

License / licence : [MIT](LICENSE)
