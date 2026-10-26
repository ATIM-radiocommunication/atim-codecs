/**
 * ATIM ACW-DINRSM-V2 – codec BACnet pour la passerelle MultiTech Conduit (mPower)
 * 1.0.1 – sortie en français
 *
 * Fichier à importer avec <produit>-bacnet-definition.json (Payload Management > Sensor Definitions).
 * Il contient le codec français, suivi d'une couche BACnet qui ne garde que les propriétés
 * déclarées et rend une seule valeur par propriété (échantillon le plus récent d'une trame historisée).
 * Généré par scripts/build-bacnet.js : modifiez le codec ou la définition, puis régénérez.
 *
 * Copyright (c) 2026 ATIM – SPDX-License-Identifier: MIT
 */

/* Lecture d'un entier non signe 16 bits big-endian, sans Buffer. */
function readUInt16BE(bytes, offset) {
    return ((bytes[offset] << 8) | bytes[offset + 1]) & 0xFFFF;
}

/* Octet a la position donnee, ou null s'il est absent. */
function byteAt(bytes, offset) {
    return offset < bytes.length ? bytes[offset] & 0xFF : null;
}

function toHex(bytes) {
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
        hex += ("0" + (bytes[i] & 0xFF).toString(16)).slice(-2);
    }
    return hex;
}

/* Cles en decimal : certains moteurs ES5 (ChirpStack v3) ne convertissent pas les cles hexadecimales. */
var MODBUS_ERRORS = {
    1: { type: "ILLEGAL_FUNCTION", source: "SERVER" },         // 0x01
    2: { type: "ILLEGAL_DATA_ADDRESS", source: "SERVER" },     // 0x02
    3: { type: "ILLEGAL_DATA_VALUE", source: "SERVER" },       // 0x03
    4: { type: "SERVER_FAILURE", source: "SERVER" },           // 0x04
    250: { type: "TIMEOUT", source: "DEVICE" },                // 0xFA
    251: { type: "CRC_ERROR", source: "DEVICE" },              // 0xFB
    252: { type: "MODBUS_PAYLOAD_ERROR", source: "DEVICE" },   // 0xFC
    253: { type: "MODBUS_BUFFER_OVERFLOW", source: "DEVICE" }, // 0xFD
    254: { type: "RADIO_BUFFER_OVERFLOW", source: "DEVICE" },  // 0xFE
    255: { type: "INTERNAL_ERROR", source: "DEVICE" }          // 0xFF
};

function decodeUplinkCodec(input) {
    var bytes = input.bytes || [];
    var result = { data: {}, errors: [], warnings: [] };

    if (bytes.length === 0) {
        result.errors.push("Empty payload");
        return result;
    }

    var frameType = bytes[0];

    if (frameType === 0x01) {
        /* Trame de vie : tensions au repos et en emission */
        if (bytes.length < 5) {
            result.errors.push("Payload too short for frame type 0x01");
            return result;
        }
        result.data = {
            frameType: "HEART_BEAT",
            radioIdleVoltage: readUInt16BE(bytes, 1),
            radioTransmitVoltage: readUInt16BE(bytes, 3)
        };
    } else if (frameType === 0x03) {
        /* Donnees Modbus periodiques, rendues en hexadecimal */
        result.data = {
            frameType: "PERIODIC_DATA",
            header: byteAt(bytes, 1),
            payload: toHex(Array.prototype.slice.call(bytes, 2))
        };
    } else if (frameType === 0x83) {
        /* Erreur Modbus */
        var errorCode = byteAt(bytes, 3);
        var error = MODBUS_ERRORS[errorCode] || { type: null, source: null };
        result.data = {
            frameType: "ERROR",
            parameter: byteAt(bytes, 1),
            radioHeader: byteAt(bytes, 2),
            errorCode: errorCode,
            errorType: error.type,
            errorSource: error.source,
            slave: byteAt(bytes, 4),
            functionCode: byteAt(bytes, 5),
            register_msb: byteAt(bytes, 6),
            register_lsb: byteAt(bytes, 7),
            register_nbr: byteAt(bytes, 8)
        };
    }

    return result;
}

/* ---------------------------------------------------------------------------
 * Couche BACnet : une valeur par propriété déclarée
 * ------------------------------------------------------------------------- */

var BACNET_PROPERTIES = {
    "frameType": "string",
    "radioIdleVoltage": "uint16",
    "radioTransmitVoltage": "uint16",
    "header": "uint8",
    "payload": "string",
    "parameter": "uint8",
    "radioHeader": "uint8",
    "errorCode": "uint8",
    "errorType": "string",
    "errorSource": "string",
    "slave": "uint8",
    "functionCode": "uint8",
    "register_msb": "uint8",
    "register_lsb": "uint8",
    "register_nbr": "uint8"
};

var BACNET_STATES = {
    "état haut": 1,
    "état bas": 0,
    "mise à l'état haut": 1,
    "mise à l'état bas": 0
};

function bacnetValue(value, type) {
    if (Object.prototype.toString.call(value) === "[object Array]") {
        value = value.length > 0 ? value[0] : undefined;
    }
    if (value === undefined || value === null) return undefined;
    if (type === "string") return typeof value === "object" ? JSON.stringify(value) : String(value);
    if (typeof value === "string" && Object.prototype.hasOwnProperty.call(BACNET_STATES, value)) {
        value = BACNET_STATES[value];
    }
    if (typeof value === "boolean") value = value ? 1 : 0;
    return typeof value === "number" && isFinite(value) ? value : undefined;
}

function decodeUplink(input) {
    var result = decodeUplinkCodec(input);
    var data = {};
    for (var key in result.data) {
        if (!Object.prototype.hasOwnProperty.call(result.data, key)) continue;
        if (!Object.prototype.hasOwnProperty.call(BACNET_PROPERTIES, key)) continue;
        var value = bacnetValue(result.data[key], BACNET_PROPERTIES[key]);
        if (value !== undefined) data[key] = value;
    }
    result.data = data;
    return result;
}

/* Node.js / CommonJS */
if (typeof module !== "undefined" && module.exports) {
    module.exports.decodeUplink = decodeUplink;
}
