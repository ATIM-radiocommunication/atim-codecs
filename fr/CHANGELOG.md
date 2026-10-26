# Historique des versions

## 2026-10-16 – Première version publique

Première version publique des codecs ATIM.

- Deux versions de chaque codec : sortie en anglais (`en/`) et sortie en français (`fr/`, la référence). Les codecs français acceptent les périodes de trame de vie en français (`"Tous les jours"`…), en plus des valeurs anglaises.
- Fichiers BACnet pour la passerelle MultiTech Conduit dans chaque dossier produit (définition et codec BACnet, une valeur par propriété).
- Les codecs sont en ES5 et testés dans les moteurs de The Things Stack (goja), ChirpStack v3 (otto) et ChirpStack v4 (QuickJS).
- **ACW-DINRSM-V2** : réécrit sans API Node.js (`Buffer`, `??`), il fonctionne désormais sur TTN et ChirpStack. La sortie est inchangée pour les trames valides. Un payload vide renseigne maintenant `errors`, et une trame de vie trop courte ne provoque plus d’exception.
- **LTE-M / NB-IoT** (tous les produits sauf le DINRSM-V2) : la trame de mesure étendue (type 0x09) est décodée selon le guide utilisateur : index de trame (`index_trame`), profondeur d’historique et nombre d’échantillons sur 2 octets, période. Avant, ces octets d’en-tête étaient mal placés et les mesures fausses. La trame de vie décode la position GPS (`etat_gps`, `latitude`, `longitude`).
- **ACW-DIND21 / ACW-DIND88** : la période (`periode`) et l’horodatage (`horodatage`) des trames de mesure sont convertis ; ils étaient rendus en octets bruts.
- **ACW-MIO** (C0, C1, 1M8, 2M8, MT1, WLK) : nouveau codec. Courant, tension et pourcentage de chaque entrée analogique, entrées TOR, compteurs, température et humidité, coupure de câble, trame étendue LTE-M. Commandes : rôle des entrées, seuils et calibration analogiques, calibration de la température, forçage des compteurs, relecture de la configuration.
- **Tensions en volts** : la tension des voies analogiques (`tension`, type 0x0A) est rendue en V sur l’ACW-CTS, l’ACW-WLL et l’ACW-MIO, comme les tensions de pile. Le produit l’envoie en mV.
- **Libellés d’alerte** : « sur le courant » (au lieu de « sur la courant ») et « sur le compteur » pour une alerte de compteur (au lieu de « sur le CO2 »).
- **ACW-PW** (fil pilote) : nouveau codec. Le mode du fil pilote, le mode par défaut du calendrier et les 7 programmes du calendrier se règlent (`setPilotWireMode`, `setPilotWireCalendarDefaultMode`, `setProgram1..7`) et se relisent (`getPilotWireConfiguration`). Les réponses aux trames descendantes sont décodées (configuration acceptée, paramètres refusés, valeurs relues, erreurs).
- **ACW-MT1** : nouveau codec. Mêmes trames que le MIO (compteur, état de l’entrée, déplacement détecté par l’accéléromètre, LTE-M), avec les numéros de paramètres propres à ce produit (entrée = paramètre 30) : réglage de l’entrée, forçage du compteur, relecture de la configuration. Le MIO-MT1 garde le codec ACW-MIO.
- **ACW-MIO** : les libellés « Compteur » de la relecture des entrées sont traduits dans le codec anglais.
- **ACW-PIR** : le produit n’a pas de capteur de luminosité ; le champ `lux` est retiré du codec et de la définition BACnet. Le sous-type de trame (`type_trame`), le capteur DQ (`capteur_dq`) et l’état du boîtier (`boitier`) sont déclarés dans la définition BACnet.

Changements par rapport aux précédents codecs BACnet ATIM :

- **Tous les codecs**
  - Les mesures sont des nombres (ou des tableaux pour les trames historisées) au lieu de chaînes `"v1, v2"`.
  - `periode` est lu sur 16 bits (seul l’octet de poids faible était lu auparavant).
  - `horodatage` est une chaîne ISO 8601 en UTC, au lieu d’une chaîne `jj/mm/aaaa` avec un fuseau horaire codé en dur.
  - `errors` est renseigné pour les trames vides, illisibles ou de type inconnu.
  - Une seule fonction `encodeDownlink` par fichier : la variante hexadécimale brute était du code mort, masqué par la seconde définition.
  - Plus de variable globale implicite : les codecs fonctionnent en mode strict.
- **Compteurs (ACW-MR4, MR4-OPTO, TMxP, PTMxP, DIND21, DIND88)** : les index de compteur 32 bits supérieurs à 2 147 483 647 ne sont plus renvoyés en négatif.
- **ACW-DIND21 / ACW-DIND88** : la température est décodée (elle était rendue brute) et les valeurs négatives sont gérées. Les trames `entree_ancien` (famille 0x4x) sont décodées en `input_state0..15`. Le courant 4-20 mA est mis à l’échelle sur le DIND88.
- **ACW-MR2-EX (codec 2.0.0, changement incompatible)** : la trame ECO LoRaWAN (0x30) donne `index0` (le plus récent) à `index5` (le plus ancien) au lieu de `compteur0..5`. Les trames ECO Sigfox (0x39–0x3B) donnent `counter_init` et `delta1..delta5` au lieu de `delta0..delta4`.
- **ACW-MR4 / ACW-TMxP / ACW-PTMxP** : dans les trames de changement d’état, une entrée sans front rend son niveau (`"état haut"` / `"état bas"`) au lieu de `"pas de mouvement"`.
- **ACW-PIR** : l’ancienne trame PIR est décodée (`type_trame`, `boitier`, `capteur_dq`, `compteur_pir`, `temperature_pir`).
- **ACW-PW** : la température et l’humidité sont des nombres et non plus des chaînes.
- **ACW-WLL** : correction d’une exception sur toutes les trames. Le détecteur de fuite actuel, l’ACW/MIO-WLK, est décodé par le codec ACW-MIO.
- **ACW-TMxP / ACW-PTMxP** : correction d’une exception sur certaines trames de mesure. Le PTMxP n’ajoute plus le payload brut dans un champ `data`.
