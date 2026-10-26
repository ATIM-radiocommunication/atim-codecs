# ACW-DINRSM-V2 – Passerelle maître Modbus

<img src="acw-dinrsm-v2.png" alt="ACW-DINRSM-V2" width="200">

Passerelle maître Modbus. Le codec décode les trames de vie, les données Modbus périodiques (rendues en hexadécimal brut) et les trames d’erreur Modbus.

## Modèles couverts

- ACW-DINRSM-V2

## Documentation

| Modèle | Fiche technique | Guide utilisateur |
|---|---|---|
| ACW-DINRSM-V2 | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-DINRSM/FRANCAIS/ATIM_ACW-DINRSM_V2_DS_FR.pdf) | [PDF](https://www.atim.com/wp-content/uploads/documentation/ACW/ACW-DINRSM/FRANCAIS/ATIM_ACW-DINRSM_V2_UG_FR.pdf) |

## Codec

| Fichier | Version | Points d’entrée |
|---|---|---|
| [acw-dinrsm-v2-codec.js](acw-dinrsm-v2-codec.js) | 1.0.1 | `decodeUplink` |

Le même fichier se colle tel quel dans The Things Stack (TTN v3), ChirpStack v4 et ChirpStack v3. Voir [intégration aux plateformes](../../docs/plateformes.md).

Version anglaise de ce codec (champs et libellés en anglais) : [../../../en/io-modules/acw-dinrsm-v2](../../../en/io-modules/acw-dinrsm-v2).

## BACnet (passerelle MultiTech Conduit)

Pour exposer ce produit en BACnet sur une passerelle MultiTech Conduit (mPower, licence Payload Management), importez ces deux fichiers dans **Payload Management > Sensor Definitions > Import** :

| Fichier | Rôle |
|---|---|
| [acw-dinrsm-v2-bacnet-definition.json](acw-dinrsm-v2-bacnet-definition.json) | Définition : propriétés BACnet, types, unités, objets en écriture |
| [acw-dinrsm-v2-bacnet-codec.js](acw-dinrsm-v2-bacnet-codec.js) | Décodeur/encodeur : ce codec, avec une seule valeur par propriété |

Chaque champ remonté devient un objet BACnet en lecture. Une trame historisée donne l’échantillon le plus récent. Voir [BACnet](../../docs/bacnet.md).

## Exemples

Tous les cas de test sont dans [examples.json](examples.json). Ils sont exécutés par `npm test`.

### Trames montantes

**Exemple 0x01 (trame de vie)** – payload `010e100dac64`, fPort 1

```json
{
  "frameType": "HEART_BEAT",
  "radioIdleVoltage": 3600,
  "radioTransmitVoltage": 3500
}
```

**Exemple 0x03 (données Modbus)** – payload `0340010203`, fPort 1

```json
{
  "frameType": "PERIODIC_DATA",
  "header": 64,
  "payload": "010203"
}
```

**Exemple 0x83 (erreur Modbus)** – payload `830110fa2132195305`, fPort 1

```json
{
  "errorCode": 250,
  "errorSource": "DEVICE",
  "errorType": "TIMEOUT",
  "frameType": "ERROR",
  "functionCode": 50,
  "parameter": 1,
  "radioHeader": 16,
  "register_lsb": 83,
  "register_msb": 25,
  "register_nbr": 5,
  "slave": 33
}
```
