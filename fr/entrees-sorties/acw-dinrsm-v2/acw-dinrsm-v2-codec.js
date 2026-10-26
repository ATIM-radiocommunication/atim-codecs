/**
 * ATIM ACW-DINRSM-V2 – Passerelle maître Modbus
 * Version du codec : 1.0.1 – sortie en français
 *
 * Points d'entrée LoRaWAN Payload Codec API (TS013) :
 *   decodeUplink(input)
 *
 * Utilisable tel quel sur The Things Stack (TTN v3), ChirpStack v4 et v3, et Node.js.
 * Documentation et exemples : README.md et examples.json dans ce dossier.
 * Codec de référence : la version anglaise (en/) est générée à partir de ce fichier (npm run build:en).
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

function decodeUplink(input) {
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
 * Adaptateurs de plateformes
 * ------------------------------------------------------------------------- */

/* ChirpStack v3 */
function Decode(fPort, bytes, variables) {
    return decodeUplink({ bytes: bytes, fPort: fPort, variables: variables }).data;
}

/* Node.js / CommonJS */
if (typeof module !== "undefined" && module.exports) {
    module.exports.decodeUplink = decodeUplink;
}
