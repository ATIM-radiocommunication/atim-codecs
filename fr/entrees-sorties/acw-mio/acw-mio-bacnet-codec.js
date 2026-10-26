/**
 * ATIM ACW-MIO – codec BACnet pour la passerelle MultiTech Conduit (mPower)
 * 1.0.0 – sortie en français
 *
 * Fichier à importer avec <produit>-bacnet-definition.json (Payload Management > Sensor Definitions).
 * Il contient le codec français, suivi d'une couche BACnet qui ne garde que les propriétés
 * déclarées et rend une seule valeur par propriété (échantillon le plus récent d'une trame historisée).
 * Généré par scripts/build-bacnet.js : modifiez le codec ou la définition, puis régénérez.
 *
 * Copyright (c) 2026 ATIM – SPDX-License-Identifier: MIT
 */

/* Un echantillon -> nombre ; plusieurs -> tableau. */
function atimValue(samples) {
    if (!Array.isArray(samples)) return samples;
    return samples.length === 1 ? samples[0] : samples;
}

/* Epoch ATIM (secondes UTC) -> ISO 8601. */
function atimTimestamp(bytes) {
    var epoch = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    return new Date(epoch * 1000).toISOString();
}

function decodeUplinkCodec(input) {
    var errors = [];
    var warnings = [];

    if (!input.bytes || input.bytes.length === 0) {
        return { data: {}, errors: ["Empty payload"], warnings: warnings };
    }

    var hexStringInput = "";
    for (var i = 0; i < input.bytes.length; i++) {
        var hex = input.bytes[i].toString(16);
        if (hex.length === 1) {
            hex = "0" + hex;
        }
        hexStringInput += hex;
    }

    var res;
    try {
        var data = decode_pay(hexStringInput);
        var decoded = decode_json(data.data, hexStringInput);
        res = postProcess(data, JSON.parse(decoded));
        decodeReponse(input.bytes, res);
    } catch (e) {
        return { data: {}, errors: ["Unsupported payload: " + hexStringInput], warnings: warnings };
    }

    if (res.frame_type === "Type de trame inconnu" || res.frame_type === "Trame vide") {
        errors.push("Unknown frame type for payload " + hexStringInput);
    }

    return { data: res, errors: errors, warnings: warnings };
}

////// DECODER //////




function postProcess(data, decoded) {
    /*gamme acw*/
    postProcessTypeErreur(decoded, data);
    postProcessTypeAlerte(decoded, data);
    postProcessFrameType(decoded, data);
    postProcessTensionC(decoded, data);
    postProcessTensionV(decoded, data);
    postProcessCompteur(decoded, data);
    postProcessEntree(decoded, data);
    postProcessAnalogique(decoded, data);
    postProcessTemperatureHumidite(decoded, data);
    postProcessCable(decoded);
    postProcessHorodatage(decoded, data);
    postProcessPeriode(decoded, data)

    postProcessTrameEtendue(decoded);
    postProcessGps(decoded);
    return decoded;
}

/* Trame étendue : index de trame sur 4 octets (compteur des trames émises) */
function postProcessTrameEtendue(decoded) {
    if (decoded.index_trame != undefined) {
        var valeur_index = decoded.index_trame;
        decoded.index_trame = ((valeur_index[0] << 24) | (valeur_index[1] << 16) | (valeur_index[2] << 8) | valeur_index[3]) >>> 0;
    }
    delete decoded.histo_echan;
}

/* Position GPS de la trame de vie : latitude et longitude en millièmes de minute d'arc, converties en degrés */
function postProcessGps(decoded) {
    if (decoded.gps == undefined) return;
    var valeur_gps = decoded.gps;
    delete decoded.gps;
    var latitude = (valeur_gps[1] << 16) | (valeur_gps[2] << 8) | valeur_gps[3];
    var longitude = (valeur_gps[4] << 16) | (valeur_gps[5] << 8) | valeur_gps[6];
    if (valeur_gps[0] & 0x80) {
        decoded.etat_gps = "Défaut matériel du GPS";
    } else if (latitude === 0xFFFFFF || longitude === 0xFFFFFF) {
        decoded.etat_gps = "Position non trouvée";
    } else {
        decoded.etat_gps = "Position trouvée";
        decoded.latitude = Math.round(latitude / 60000 * 1000000) / 1000000 * ((valeur_gps[0] & 0x02) ? 1 : -1);
        decoded.longitude = Math.round(longitude / 60000 * 1000000) / 1000000 * ((valeur_gps[0] & 0x01) ? 1 : -1);
    }
}

/*******************************************************************************************************************************/
/*******************************************************************************************************************************/
/*PARTIE AFFICHAGE*/
/*******************************************************************************************************************************/
/*******************************************************************************************************************************/

/***********/
/*ACW*/
/***********/

function postProcessTypeErreur(decoded,data){
    if(data.typeErreur != undefined){
        decoded.erreur = data.typeErreur[0];
    }
}

function postProcessTypeAlerte(decoded, data) {
    if (data.typeAlerte != undefined) {
        var res = "";
        for (var i = 0; i < data.nbrData; i++) {
            res += data.typeAlerte[i];
            if ((data.nbrData > 1) && (i < data.nbrData - 1)) {
                res += " | ";
            }
        }
        delete decoded.typeAlerte;
        decoded.alerte = res;
    }
}

function postProcessFrameType(decoded,data){
    if(decoded.frame_type != undefined){
        decoded.frame_type = data.frame_type;
    }
}

function postProcessTensionC(decoded, data) {
    if (decoded.tensionc != undefined) {
        decoded.voltagec = (decoded.tensionc[0] << 8 | decoded.tensionc[1]) / 1000;
        delete decoded.tensionc;
    }
}

function postProcessTensionV(decoded, data) {
    if (decoded.tensionv != undefined) {
        decoded.voltagev = (decoded.tensionv[0] << 8 | decoded.tensionv[1]) / 1000;
        delete decoded.tensionv;
    }
}

function postProcessCompteur(decoded,data){
    var valeur_echan_hist = (data.echan * data.historique);
    var valeur_compte0 = [];
    var valeur_compte1 = [];
    var valeur_compte2 = [];
    var valeur_compte3 = [];

    if(decoded.compte0 != undefined){
        for(var i=0;i<valeur_echan_hist;i++){
            valeur_compte0.push((decoded.compte0[1+i*4]<<24 | decoded.compte0[2+i*4]<<16 | decoded.compte0[3+i*4]<<8 | decoded.compte0[4+i*4]) >>> 0);
        }
        delete decoded.compte0;
        decoded.compteur0 = atimValue(valeur_compte0);
    }
    if(decoded.compte1 != undefined){
        for(var i=0;i<valeur_echan_hist;i++){
            valeur_compte1.push((decoded.compte1[1+i*4]<<24 | decoded.compte1[2+i*4]<<16 | decoded.compte1[3+i*4]<<8 | decoded.compte1[4+i*4]) >>> 0);
        }
        delete decoded.compte1;
        decoded.compteur1 = atimValue(valeur_compte1);
    }
    if(decoded.compte2 != undefined){
        for(var i=0;i<valeur_echan_hist;i++){
                valeur_compte2.push((decoded.compte2[1+i*4]<<24 | decoded.compte2[2+i*4]<<16 | decoded.compte2[3+i*4]<<8 | decoded.compte2[4+i*4]) >>> 0);
        }
        delete decoded.compte2;
        decoded.compteur2 = atimValue(valeur_compte2);
    }
    if(decoded.compte3 != undefined){
        for(var i=0;i<valeur_echan_hist;i++){
             valeur_compte3.push((decoded.compte3[1+i*4]<<24 | decoded.compte3[2+i*4]<<16 | decoded.compte3[3+i*4]<<8 | decoded.compte3[4+i*4]) >>> 0);
        }
        delete decoded.compte3;
        decoded.compteur3 = atimValue(valeur_compte3);
    }
}

function postProcessEntree(decoded,data){
    var valeur_entree = [];
    valeur_entree[0] = [];
    valeur_entree[1] = [];
    valeur_entree[2] = [];
    valeur_entree[3] = [];

    var valeur_echan_hist = (data.echan * data.historique);

    if(decoded.entree != undefined){
       for(var i=0;i<valeur_echan_hist;i++){
            var bin1 = (parseInt((decoded.entree[i+1]-0).toString(16),16)).toString(2);
            if(decoded.entree[i+1]<=15){
                var taille_bin = bin1.length+1;
                if(taille_bin<5){
                   if(bin1.length!=4){
                      bin1 = bin1.split('').reverse().join('');
                      for(var j=0;j<(5-(taille_bin));j++){
                           bin1 =  bin1 + '0' ;
                      }
                   }
                }else{
                  bin1 = bin1.split('').reverse().join('');
                }

               for(var j=0;j<4;j++){
                   if(bin1[j] === '1'){
                        valeur_entree[j].push(1);
                   }else{
                        valeur_entree[j].push(0);
                   }
               }

            }else{
                var taille_bin = bin1.length;
                if(taille_bin<=8){
                    for(var j=0;j<(8-(taille_bin));j++){
                        bin1 = '0'+bin1 ;
                    }
                }
                if(bin1[3] === "1" ){
                    if(bin1[7] === "1"){
                        valeur_entree[0].push("mise à l'état haut");
                    }
                    else{
                        valeur_entree[0].push("mise à l'état bas");
                    }
                }else{
                    valeur_entree[0].push(bin1[7] === "1" ? "état haut" : "état bas");
                }
                if(bin1[2] === "1"){
                    if(bin1[6] === "1"){
                        valeur_entree[1].push("mise à l'état haut");
                    }
                    else{
                        valeur_entree[1].push("mise à l'état bas");
                    }
                }else{
                    valeur_entree[1].push(bin1[6] === "1" ? "état haut" : "état bas");
                }
                if(bin1[1] === "1"){
                    if(bin1[5] === "1"){
                        valeur_entree[2].push("mise à l'état haut");
                    }
                    else{
                        valeur_entree[2].push("mise à l'état bas");
                    }
                }else{
                    valeur_entree[2].push(bin1[5] === "1" ? "état haut" : "état bas");
                }
                if(bin1[0] === "1"){
                    if(bin1[4] === "1"){
                        valeur_entree[3].push("mise à l'état haut");
                    }
                    else{
                        valeur_entree[3].push("mise à l'état bas");
                    }
                }else{
                    valeur_entree[3].push(bin1[4] === "1" ? "état haut" : "état bas");
                }

            }

       }
       delete decoded.entree;
       decoded.input_state0 = atimValue(valeur_entree[0]);
       decoded.input_state1 = atimValue(valeur_entree[1]);
       decoded.input_state2 = atimValue(valeur_entree[2]);
       decoded.input_state3 = atimValue(valeur_entree[3]);
    }
}

function postProcessPeriode(decoded,data){
    if(decoded.periode != undefined){
        decoded.periode = (decoded.periode[0] << 8) | decoded.periode[1];
   }
}



/*******************************************************************************************************************************/
/*******************************************************************************************************************************/
/*PARTIE DECODEUR*/
/*******************************************************************************************************************************/
/*******************************************************************************************************************************/
function decode_pay(encoded) {
    var frame_type = getFrameType(encoded);
    var data = {};
    /*Décode pour savoir si il a de l'horodatage*/
    var avec_horodatage = 0;
    var fram_0 = parseInt(encoded[0], 16);
    var bin_frame_0 = (parseInt((fram_0 - 0).toString(16), 16)).toString(2);
    if (bin_frame_0[1] === "1") {
        avec_horodatage = 1;
    }
    var alerte = 0;
    if (frame_type === "Trame de mesure" || frame_type === "Trame de test" || frame_type === "Trame de mesure étendue") {
        data = decode_trame_test_mesure(encoded, frame_type, avec_horodatage, alerte);
    } else if (frame_type === "Trame de vie") {
        data = decode_trame_vie(encoded, avec_horodatage);
    } else if (frame_type === "Trame d'alerte") {
        alerte = 1;
        data = decode_trame_test_mesure(encoded, frame_type, avec_horodatage, alerte);
        decode_alerte(encoded, avec_horodatage, data);
    } else if (frame_type === "Trame d'erreur") {
        data = decode_trame_erreur(encoded, avec_horodatage);
    } else if (frame_type === "Ancien produit") {
        frame_type = frame_type_ancien(encoded);
        data = decode_trame_ancien(encoded, frame_type);
    } else if (frame_type === "Trame spécifique") {
        data.data = 'byte frame_type;' + (avec_horodatage ? 'ubyte[4] horo;' : '') + 'ubyte[2] cable;';
    }
    else {
        data.data = 'byte frame_type;';
    }
    data.frame_type = frame_type;
    return data;
}

function getFrameType(encoded) {

    /*Recuperation des 2 premier octet de la trame*/
    var oct1 = parseInt(encoded[0], 16);
    var oct2 = parseInt(encoded[1], 16);

    /*decomposition en binaire pour avoir 4 bits sinon js enléve les 0 de droite inutile*/
    var bin1 = (parseInt((oct1 - 0).toString(16), 16)).toString(2);
    var taille = bin1.length + 1;
    if (taille <= 5) {
        if (bin1.length != 4) {
            for (var i = 0; i < (5 - (taille)); i++) {
                bin1 = "0" + bin1;
            }
        }
    }
    /*suivent oct ça renvoie le type de trame associer*/
    var frameType = bin1;
    if (bin1[0] === "0") {
        frameType = "Ancien produit";
    }
    else if (bin1[2] === "1") {
        frameType = "Trame de mesure";
    }
    else if (oct2 === 0x1) {
        frameType = "Trame de vie";
    } else if (oct2 === 0x2) {
        frameType = "Trame de test reseau";
    } else if (oct2 === 0x5) {
        frameType = "Trame de test";
    } else if (oct2 === 0xD) {
        frameType = "Trame d'alerte";
    } else if (oct2 === 0xE) {
        frameType = "Trame d'erreur";
    } else if (oct2 === 0xF) {
        frameType = "Trame spécifique";
    } else if (oct2 === 0x6) {
        frameType = "Réponse à une trame de configuration";
    } else if (oct2 === 0x7) {
        frameType = "Réponse à une trame de commande";
    } else if (oct2 === 0x8) {
        frameType = "Réponse à une trame erronee";
    } else if (oct2 === 0x9) {
        frameType = "Trame de mesure étendue";
    } else {
        frameType = "Type de trame inconnu";
    }
    if (encoded === "") {
        frameType = "Trame vide";
    }
    return frameType;
}

function decode_alerte(encoded, avec_horodatage, data) {
    var k = 0;
    data.typeAlerte = [];
    for (var i = 0; i < data.nbrData; i++) {
        if (avec_horodatage) {
            var dframe1 = parseInt(encoded.substr(i + 10 + k, 2), 16);
            var bin1_dframe = (parseInt((dframe1 - 0).toString(16), 16)).toString(2);
        } else {
            var dframe1 = parseInt(encoded.substr(i + 2 + k, 2), 16);
            var bin1_dframe = (parseInt((dframe1 - 0).toString(16), 16)).toString(2);
        }
        var taille_bin = bin1_dframe.length;
        if (taille_bin <= 8) {
            for (var j = 0; j < (8 - (taille_bin)); j++) {
                bin1_dframe = "0" + bin1_dframe;
            }
        }
        var nbr = bin1_dframe[0] << 1 | bin1_dframe[1];
        if (nbr === 0) {
            data.typeAlerte[i] = "Retour entre les seuils";
        }
        else if (nbr === 1) {
            data.typeAlerte[i] = "Dépassement du seuil haut";
        }
        else if (nbr === 2) {
            data.typeAlerte[i] = "Dépassement du seuil bas";
        }
        var type_data = dframe1 & 0x0F;
        if (data.typeAlerte != undefined) {
            if (type_data === 0x08) {
                k = k + 5;
                data.typeAlerte[i] += " sur la température";
                data.typeAlerte[i] += " voie " + data.voieTemp[i];
            }
            else if (type_data === 0x06) {
                data.typeAlerte[i] += " sur la pression différentiel";
                k = k + 5;
            }
            else if (type_data === 0x09) {
                k = k + 5;
                data.typeAlerte[i] += " sur l'humidité";
                data.typeAlerte[i] += " voie " + data.voieRh[i];
            }
            else if (type_data === 0x0c) {
                data.typeAlerte[i] += " sur le taux";
                data.typeAlerte[i] += " voie " + ((dframe1 >> 4) & 0x03);
                k = k + 5;
            }
            else if (type_data === 0x0d) {
                data.typeAlerte[i] += " sur le CO2";
                k = k + 5;
            }
            else if (type_data === 0x05) {
                data.typeAlerte[i] += " sur la luminosité";
                k = k + 5;
            }
            else if (type_data === 0x04) {
                k = k + 11;
                data.typeAlerte[i] += " sur le compteur";
                data.typeAlerte[i] += " voie " + data.voieComptage[i];
            }
            else if (type_data === 0x07) {
                data.typeAlerte[i] += " sur la distance";
                k = k + 5;
            }
            else if (type_data === 0x0a) {
                data.typeAlerte[i] += " sur la tension";
                data.typeAlerte[i] += " voie " + ((dframe1 >> 4) & 0x03);
                k = k + 5;
            }
            else if (type_data === 0x0b) {
                data.typeAlerte[i] += " sur le courant";
                data.typeAlerte[i] += " voie " + ((dframe1 >> 4) & 0x03);
                k = k + 5;
            }
        }
    }

}

function decode_trame_vie(encoded, avec_horodatage) {
    var data = {};
    var res_str = 'byte frame_type;';
    var taille_sans_gps = 10;
    if (avec_horodatage) {
        res_str = res_str + 'ubyte[4] horo;';
        taille_sans_gps += 8;
    }
    res_str = res_str + 'ubyte[2] tensionv;' + 'ubyte[2] tensionc;';
    /* LTE-M / NB-IoT : position GPS (7 octets) à la suite des tensions */
    if (encoded.length >= taille_sans_gps + 14) {
        res_str = res_str + 'ubyte[7] gps;';
    }
    data.data = res_str;
    return data;
}

function decode_trame_test_mesure(encoded, frame_type, avec_horodatage, alerte) {
    var fram_0 = parseInt(encoded[0], 16);
    var fram_1 = parseInt(encoded[1], 16);
    var bin_frame_0 = (parseInt((fram_0 - 0).toString(16), 16)).toString(2);
    var bin_frame_1 = (parseInt((fram_1 - 0).toString(16), 16)).toString(2);

    var taille_0 = bin_frame_0.length + 1;
    if (taille_0 <= 5) {
        if (bin_frame_0.length != 4) {
            for (var i = 0; i < (5 - (taille_0)); i++) {
                bin_frame_0 = "0" + bin_frame_0;
            }
        }
    }

    var taille_1 = bin_frame_1.length + 1;
    if (taille_1 <= 5) {
        if (bin_frame_1.length != 4) {
            for (var i = 0; i < (5 - (taille_1)); i++) {
                bin_frame_1 = "0" + bin_frame_1;
            }
        }
    }

    var historique = 0;
    var echan = 0;
    if (frame_type === "Trame de mesure") {
        if (bin_frame_0[3] === "1" || bin_frame_1[0] === "1") {
            var bin_hist = bin_frame_0[3] + bin_frame_1[0];
            historique = parseInt(bin_hist, 2) + 1;
        }
        if (bin_frame_1[1] === "1" || bin_frame_1[2] === "1" || bin_frame_1[3] === "1") {
            var bin_ech = bin_frame_1[1] + bin_frame_1[2] + bin_frame_1[3];
            echan = parseInt(bin_ech, 2) + 1;
        }
        var data = decodeFrame(encoded, historique, echan, avec_horodatage, alerte, 0);
    }
    if (frame_type === "Trame de mesure étendue") {
        /* En-tête étendu après l'horodatage : index de trame (4 octets), profondeur d'historique (1), nombre d'échantillons (2) */
        var debut_etendu = avec_horodatage ? 18 : 10;
        historique = parseInt(encoded.substr(debut_etendu, 2), 16);
        echan = parseInt(encoded.substr(debut_etendu + 2, 4), 16);
        var data = decodeFrame(encoded, historique, echan, avec_horodatage, alerte, 1);
    }
    if (frame_type === "Trame de test") {
        var data = decodeFrame(encoded, 0, 0, avec_horodatage, alerte, 0);
    }
    if (alerte === 1) {
        var data = decodeFrame(encoded, 0, 0, avec_horodatage, alerte, 0);
    }

    return data;
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function decodeFrame(frame, historique, echan, avec_horodatage, alerte, etendu) {
    var bytes = hexToBytes(frame);
    var res_str = 'byte frame_type;';
    var start_bcl = 1;
    var data = {};
    var k = 0;
    data.nbrData = 0;
    data.voieTemp = []; data.voieRh = []; data.voieEntree = []; data.voieComptage = [];
    var ctn_voie_temp = 0; var ctn_voie_rh = 0; var ctn_voie_comptage = 0;
    var taille_comptage = 0;

    if (avec_horodatage === 1) {
        res_str = res_str + 'ubyte[4] horo;';
        start_bcl += 4;
    }
    if (etendu) {
        /* Trame étendue (LTE-M / NB-IoT) : index de trame, profondeur d'historique et nombre d'échantillons, puis la période */
        res_str = res_str + 'ubyte[4] index_trame;' + 'ubyte[3] histo_echan;' + 'ubyte[2] periode;';
        start_bcl += 9;
    } else if (historique >= 1 | echan >= 1) {
        res_str = res_str + 'ubyte[2] periode;';
        start_bcl += 2;
    }
    if (historique < 1) {
        historique = 1;
    }
    if (echan < 1) {
        echan = 1;
    }

    data.echan = echan;
    data.historique = historique;
    /*var alerte = 0;*/

    var i = start_bcl;
    while (i < bytes.length) {
        var voie = 0;
        var var_inter = bytes[i] & 0x0F;
        if (var_inter != bytes[i]) {
            if (alerte) {
                voie = bytes[i] & 0x30;
                if (voie === 16) {
                    voie = 1;
                } else if (voie === 32) {
                    voie = 2;
                } else if (voie === 48) {
                    voie = 3;
                }
            } else {
                voie = (bytes[i] & 0xF0);
                if (voie === 16) {
                    voie = 1;
                } else if (voie === 32) {
                    voie = 2;
                } else if (voie === 48) {
                    voie = 3;
                }
            }
            bytes[i] = var_inter;
        }
        switch (bytes[i]) {
            case 0x08:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 2;
                    i += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] temp' + voie.toString() + ';';
                i++;
                data.voieTemp[ctn_voie_temp] = voie.toString();
                ctn_voie_temp++;
                break;

            case 0x09:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 2;
                    i += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] hum' + voie.toString() + ';';
                i++;
                data.voieRh[ctn_voie_rh] = voie.toString();
                ctn_voie_rh++;
                break;
            case 0x0c:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 2;
                    i += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] taux' + voie.toString() + ';';
                i++;
                break;
            case 0x0d:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 2;
                    i += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] co2;';
                i++;
                break;
            case 0x05:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 2;
                    i += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] lux;';
                i++;
                break;
            case 0x01:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 1;
                    i += 1;
                }
                res_str = res_str + 'ubyte[' + k + '] entree;';
                i++;
                break;
            case 0x07:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    k += 2;
                    i += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] dist;';
                i++;
                break;

            case 0x06:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    i += 2;
                    k += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] dp;';
                i++;
                break;
            case 0x04:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    i += 4;
                    k += 4;
                }
                res_str = res_str + 'ubyte[' + k + '] compte' + voie.toString() + ';';
                i++;
                data.voieComptage[ctn_voie_comptage] = voie;
                ctn_voie_comptage++;
                break;

            case 0x0a:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    i += 2;
                    k += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] tension' + voie.toString() + ';';
                i++;
                break;
            case 0x0b:
                k = 1;
                for (var j = 0; j < (historique * echan); j++) {
                    i += 2;
                    k += 2;
                }
                res_str = res_str + 'ubyte[' + k + '] courant' + voie.toString() + ';';
                i++;
                break;
            default:
                i++;
        }
        data.nbrData++;
    }
    data.data = res_str;
    return data;
}

function decode_trame_erreur(encoded, avec_horodatage) {
    var res_str = 'byte frame_type;';
    var data = {};
    data.typeErreur = [];

    var ERR_SENSOR_NO_DATA = 0x81; /*Impossible de lire une température/humidité sur le capteur.*/
    var ERR_BUF_SMALLER = 0x82; /*Le tableau de données est plein, impossible d’y écrire des données supplémentaires*/
    var ERR_DEPTH_HISTORIC_OUT_OF_RANGE = 0x83; /*La profondeur d’historique est trop grande ou trop petite pour la trame*/
    var ERR_NB_SAMPLE_OUT_OF_RANGE = 0x84; /*Le nombre d’échantillon est trop grand ou trop petit pour la trame*/
    var ERR_NWAY_OUT_OF_RANGE = 0x85; /*Le nombre de voie dans l’entête de la trame est trop grand ou trop petit*/
    var ERR_TYPEWAY_OUT_OF_RANGE = 0x86; /*Le type de mesure dans l’entête de la trame est trop grand ou trop petit*/
    var ERR_SAMPLING_PERIOD = 0x87; /*Mauvaise structure de période d’échantillonnage*/
    var ERR_SUBTASK_END = 0x88; /*Fin d’une sous tache après être sortie d’une boucle infinie*/
    var ERR_NULL_POINTER = 0x89; /*Pointeur avec valeur “NULL”*/
    var ERR_BATTERY_LEVEL_DEAD = 0x8A; /*Niveau de batterie critique*/
    var ERR_EEPROM = 0x8B; /*EEPROM est corrompue*/
    var ERR_ROM = 0x8C; /*ROM est corrompue*/
    var ERR_RAM = 0x8D; /*RAM est corrompue*/
    var ERR_ARM_INIT_FAIL = 0x8E; /*L’initialisation du module radio a échoué*/
    var ERR_ARM_BUSY = 0x8F; /*Le module est déjà occupé (possiblement non initialisé)*/
    var ERR_ARM_BRIDGE_ENABLE = 0x90; /*Le module est en mode bridge, impossible d’envoyer desdonnées par radio*/
    var ERR_RADIO_QUEUE_FULL = 0x91; /*Le buffer de la radio est plein*/
    var ERR_CFG_BOX_INIT_FAIL = 0x92; /*Erreur lors de l’initialisation de la black box*/
    var ERR_KEEP_ALIVE_PERIOD = 0x93; /*Mauvaise structure de période de trame de vie*/
    var ERR_ENTER_DEEP_SLEEP = 0x94; /*Le produit est passé en mode veille profonde*/
    var ERR_BATTERY_LEVEL_LOW = 0x95; /*Niveau de batterie faible*/
    var ERR_ARM_TRANSMISSION = 0x96; /*Une transmission a été initialisé mais une erreur est survenue*/
    var ERR_ARM_PAYLOAD_BIGGER = 0x97; /*La taille du message est trop grande par rapport à la capacité du réseau*/
    var ERR_RADIO_PAIRING_TIMEOUT = 0x98; /*Impossible de s’appairer à un réseau avant le temps imparti*/
    var ERR_SENSORS_TIMEOUT = 0x99; /*Un timeout a été atteint sur le capteur*/
    var ERR_SENSOR_STOP = 0x9A; /*Le capteur n’a pas retourné de valeur lors d’une lecture*/
    var ERR_SENSORS_INIT_FAIL = 0x9B; /*Le capteur de température humidité n’est pas détecté au démarrage*/
    var ERR_BOX_OPENED = 0X9C; /*Ouverture du boitier*/
    var ERR_BOX_CLOSED = 0X9D; /*Fermeture du boitier*/
    var ERR_SENSORS_MOVE = 0x9E; /*Détection d’un déplacement/vol sur le produit*/
    var ERR_SENSOR_CRC_KO = 0x9F; /*Données du capteur de température humidité corrompues*/

    var cpt = 0;
    var taille_trame = encoded.length;
    var start_boucle = 2;
    if (avec_horodatage) {
        res_str += 'ubyte[4] horo;';
        start_boucle += 8;
    }
    for (var i = start_boucle; i < taille_trame; i += 2) {

        var taille_erreur = parseInt(encoded.substr(i, 2), 16) & 0x0F;
        i += 2;
        var frameErreurCode = (parseInt(encoded.substr(i, 2), 16));
        switch (frameErreurCode) {
            case ERR_SENSOR_NO_DATA:
                data.typeErreur[cpt] = "Erreur inconnue";
                break;
            case ERR_BUF_SMALLER:
                data.typeErreur[cpt] = "Le tableau de données est plein, impossible d’y écrire des données supplémentaires";
                break;
            case ERR_DEPTH_HISTORIC_OUT_OF_RANGE:
                data.typeErreur[cpt] = " La profondeur d’historique est trop grande ou trop petite pour la trame";
                break;
            case ERR_NB_SAMPLE_OUT_OF_RANGE:
                data.typeErreur[cpt] = "Le nombre d’échantillon est trop grand ou trop petit pour la trame";
                break;
            case ERR_NWAY_OUT_OF_RANGE:
                data.typeErreur[cpt] = "Le nombre de voie dans l’entête de la trame est trop grand ou trop petit";
                break;
            case ERR_TYPEWAY_OUT_OF_RANGE:
                data.typeErreur[cpt] = "Le type de mesure dans l’entête de la trame est trop grand ou trop petit";
                break;
            case ERR_SAMPLING_PERIOD:
                data.typeErreur[cpt] = "Mauvaise structure de période d’échantillonnage";
                break;
            case ERR_SUBTASK_END:
                data.typeErreur[cpt] = "Fin d’une sous tache après être sortie d’une boucle infinie";
                break;
            case ERR_NULL_POINTER:
                data.typeErreur[cpt] = "Pointeur avec valeur “NULL”";
                break;
            case ERR_BATTERY_LEVEL_DEAD:
                data.typeErreur[cpt] = "Niveau de batterie critique";
                data.battery = parseInt(encoded.substr(i + 2, 4), 16) / 1000;
                break;
            case ERR_EEPROM:
                data.typeErreur[cpt] = "EEPROM est corrompue";
                break;
            case ERR_ROM:
                data.typeErreur[cpt] = "ROM est corrompue";
                break;
            case ERR_RAM:
                data.typeErreur[cpt] = "RAM est corrompue";
                break;
            case ERR_ARM_INIT_FAIL:
                data.typeErreur[cpt] = "L'initialisation du module radio a échoué";
                break;
            case ERR_ARM_BUSY:
                data.typeErreur[cpt] = "Le module est déjà occupé (possiblement non initialisé)";
                break;
            case ERR_ARM_BRIDGE_ENABLE:
                data.typeErreur[cpt] = "Le module est en mode bridge, impossible d'envoyer des données par radio";
                break;
            case ERR_RADIO_QUEUE_FULL:
                data.typeErreur[cpt] = "Le buffer de la radio est plein";
                break;
            case ERR_CFG_BOX_INIT_FAIL:
                data.typeErreur[cpt] = "Erreur lors de l'initialisation de la black box";
                break;
            case ERR_KEEP_ALIVE_PERIOD:
                data.typeErreur[cpt] = "Mauvaise structure de période de trame de vie";
                break;
            case ERR_ENTER_DEEP_SLEEP:
                data.typeErreur[cpt] = "Le produit est passé en mode veille profonde";
                break;
            case ERR_BATTERY_LEVEL_LOW:
                data.typeErreur[cpt] = "Niveau de batterie faible";
                data.battery = parseInt(encoded.substr(i + 2, 4), 16) / 1000;
                break;
            case ERR_ARM_TRANSMISSION:
                data.typeErreur[cpt] = "Une transmission a été initialisée mais une erreur est survenue";
                break;
            case ERR_ARM_PAYLOAD_BIGGER:
                data.typeErreur[cpt] = "La taille du message est trop grande par rapport à la capacité du réseau";
                break;
            case ERR_RADIO_PAIRING_TIMEOUT:
                data.typeErreur[cpt] = "Impossible de s'appairer à un réseau avant le temps imparti";
                break;
            case ERR_SENSORS_TIMEOUT:
                data.typeErreur[cpt] = "Un timeout a été atteint sur le capteur";
                break;
            case ERR_SENSOR_STOP:
                data.typeErreur[cpt] = "Le capteur n'a pas retourné de valeur lors d'une lecture";
                break;
            case ERR_SENSORS_INIT_FAIL:
                data.typeErreur[cpt] = "Le capteur a cessé de fonctionner";
                break;
            case ERR_BOX_OPENED:
                data.typeErreur[cpt] = "Ouverture du boitier";
                break;
            case ERR_BOX_CLOSED:
                data.typeErreur[cpt] = "Fermeture du boititer";
                break;
            case ERR_SENSORS_MOVE:
                data.typeErreur[cpt] = "Détection d’un déplacement/vol sur le produit";
                break;
            case ERR_SENSOR_CRC_KO:
                data.typeErreur[cpt] = "Données du capteur de température humidité corrompues";
                break;
            default:
                data.typeErreur[cpt] = "Erreur inconnue";
        }
        cpt++;
        if (taille_erreur > 1) {
            i += 2 * taille_erreur - 1;
        }
    }
    data.data = res_str;
    return data;
}

/***********/
/*Ancien produit*/
/***********/

function frame_type_ancien(encoded) {
    var frameType;
    var oct1 = parseInt(encoded.substr(0, 2), 16);
    if (oct1 === 0x01) {
        frameType = "Trame de vie";
    } else if (oct1 === 0x05) {
        frameType = "Trame de test";
    } else if (oct1 === 0x42) {
        frameType = "Trame d’entrées digitales";
    } else if (oct1 === 0x41) {
        frameType = "Trame d’entrées digitales et température";
    } else if (oct1 === 0x4E) {
        frameType = "Trame d’entrées digitales,température et compteur 1";
    } else if (oct1 === 0x4F) {
        frameType = "Trame d’entrées digitales, compteur 1 et compteur 2 ";
    } else if (oct1 === 0x52) {
        frameType = "Trame d’entrées digitales et compteur 1 ";
    } else if (oct1 === 0x50) {
        frameType = "Trame du compteur 1 et 2";
    } else if (oct1 === 0x51) {
        frameType = "Trame du compteur 3 et 4";
    } else if (oct1 === 0x5F) {
        frameType = "Trame du compteur 5 et 6";
    } else if (oct1 === 0x60) {
        frameType = "Trame du compteur 7 et 8";
    } else if (oct1 === 0x5D) {
        frameType = "Trame d’entrées digitales,température et compteurs";
    } else if (oct1 === 0x5E) {
        frameType = "Trame d’entrées digitales et compteurs";
    } else if (oct1 === 0x43) {
        frameType = "Trame alarme ou chocs";
    } else if (oct1 === 0x62) {
        frameType = "Trame d’entrées/sorties digitales";
    } else if (oct1 === 0x61) {
        frameType = "Trame d’entrées/sorties digitales et température";
    } else if (oct1 === 0x6E) {
        frameType = "Trame d’entrées/sorties digitales, température et compteur 1";
    } else if (oct1 === 0x6F) {
        frameType = "Trame d’entrées/sorties digitales, compteur 1 et compteur 2";
    } else if (oct1 === 0x72) {
        frameType = "Trame d’entrées/sorties digitales et compteur 1";
    } else if (oct1 === 0x7D) {
        frameType = "Trame d’entrées/sorties digitales, température et compteurs";
    } else if (oct1 === 0x7E) {
        frameType = "Trame d’entrées/sorties digitales et compteurs";
    } else if (oct1 === 0x32) {
        frameType = "Produit PIR";
    } else if (oct1 === 0x14) {
        frameType = "Trame de compteur standard";
    } else if (oct1 === 0x37) {
        frameType = "Trame alerte état câble coupé";
    } else if (oct1 === 0x09) {
        frameType = "Trame de détection de changement d'état (TOR)";
    } else if (oct1 === 0x30) {
        frameType = "Trame Compteur mode ECO (Compteur 1 22 bits et 5 deltas 32 bits LoraWan )";
    } else if (oct1 === 0x31) {
        frameType = "Trame Test LoraWan";
    } else if (oct1 === 0x39) {
        frameType = "Trame 39 Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)";
    } else if (oct1 === 0x3a) {
        frameType = "Trame 3A Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)";
    } else if (oct1 === 0x3b) {
        frameType = "Trame 3B Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)";
    } else if (oct1 === 0x18) {
        frameType = "Trame de relevé périodique d'une valeur 0-10V";
    } else if (oct1 === 0x19) {
        frameType = "Trame de relevé périodique d'une valeur 0- 20mA";
    } else if (oct1 === 0x1e) {
        frameType = "Trame d'alerte BAS d'une valeur 0-10V";
    } else if (oct1 === 0x22) {
        frameType = "Trame d'alerte BAS d'une valeur 4-20mA";
    } else if (oct1 === 0x1f) {
        frameType = "Trame defin d'alerte BAS d'une valeur 0-10V";
    } else if (oct1 === 0x23) {
        frameType = "Trame de fin d'alerte BAS d'une valeur 4-20mA";
    } else if (oct1 === 0x20) {
        frameType = "Trame d'alerte HAUT d'une valeur 0-10V";
    } else if (oct1 === 0x24) {
        frameType = "Trame d'alerte HAUT d'une valeur 4-20mA";
    } else if (oct1 === 0x21) {
        frameType = "Trame de fin d’alerte HAUT d’une valeur 0-10V";
    } else if (oct1 === 0x25) {
        frameType = "Trame de fin d'alerte HAUT d'une valeur 4-20mA";
    } else if (oct1 === 0x53) {
        frameType = "Température S1 < seuil bas et température S2 < seuil bas";
    } else if (oct1 === 0x54) {
        frameType = "Température S1 < seuil bas et température S2 entre les seuils";
    } else if (oct1 === 0x55) {
        frameType = "Température S1 < seuil bas et température S2 > seuil haut";
    } else if (oct1 === 0x56) {
        frameType = "Température S1 entre les seuils et température S2 < seuil bas";
    } else if (oct1 === 0x57) {
        frameType = "Température S1 entre les seuils et température S2 entre les seuils";
    } else if (oct1 === 0x58) {
        frameType = "Température S1 entre les seuils et température S2 > seuil haut";
    } else if (oct1 === 0x59) {
        frameType = "Température S1 > seuil haut et température S2 < seuil bas";
    } else if (oct1 === 0x5A) {
        frameType = "Température S1 > seuil haut et température S2 entre les seuils";
    } else if (oct1 === 0x5B) {
        frameType = "Température S1 > seuil haut et température S2 > seuil haut";
    } else if (oct1 === 0x1A) {
        frameType = "Trame de relevé périodique de deux temperatures";
    } else if (oct1 === 0x1B) {
        frameType = "Trame de relevé périodique de la température";
    } else if (oct1 === 0x26) {
        frameType = "Dépassement de seuil bas détecté TM2D";
    } else if (oct1 === 0x27) {
        frameType = "Dépassement de seuil bas terminé TM2D";
    } else if (oct1 === 0x28) {
        frameType = "Dépassement de seuil haut détecté TM2D";
    } else if (oct1 === 0x29) {
        frameType = "Dépassement de seuil haut terminé TM2D";
    } else if (oct1 === 0x2A) {
        frameType = "Dépassement de seuil bas détecté TM1D";
    } else if (oct1 === 0x2B) {
        frameType = "Dépassement de seuil bas terminé TM1D";
    } else if (oct1 === 0x2C) {
        frameType = "Dépassement de seuil haut détecté TM1D";
    } else if (oct1 === 0x2D) {
        frameType = "Dépassement de seuil haut terminé TM1D";
    } else {
        frameType = "Type de trame inconnu";
    }
    return frameType;
}
function decode_trame_ancien(encoded, frame_type) {
    var bytes = hexToBytes(encoded);
    var res_str = 'byte frame_type;';
    var data = {};
    switch (frame_type) {
        case "Trame de vie":
            res_str = res_str + 'ubyte[2] tensionc;';
            break;
        case "Trame de test":
            res_str = res_str + 'ubyte ancien_compteur;';
            break;

        case "Trame d’entrées digitales":
            res_str = res_str + 'ubyte[2] entree_ancien;';
            break;

        case "Trame d’entrées digitales et température":
            res_str = res_str + 'ubyte[2] entree_ancien;' + 'ubyte[2] temperature;';
            break;

        case "Trame d’entrées digitales,température et compteur 1":
            res_str = res_str + 'ubyte[2] entree_ancien;' + 'ubyte[2] temperature;' + 'ubyte[4] ancien_compteur1;';
            break;

        case "Trame d’entrées digitales, compteur 1 et compteur 2 ":
            res_str = res_str + 'ubyte[2] entree_ancien;' + 'ubyte[4] ancien_compteur1;' + 'ubyte[4] ancien_compteur2;';
            break;

        case "Trame d’entrées digitales et compteur 1 ":
            res_str = res_str + 'ubyte[2] entree_ancien;' + 'ubyte[4] ancien_compteur1;';
            break;

        case "Trame du compteur 1 et 2":
            res_str = res_str + 'ubyte[4] ancien_compteur1;' + 'ubyte[4] ancien_compteur2;';
            break;

        case "Trame du compteur 3 et 4":
            res_str = res_str + 'ubyte[4] ancien_compteur3;' + 'ubyte[4] ancien_compteur4;';

            break;

        case "Trame du compteur 5 et 6":
            res_str = res_str + 'ubyte[4] ancien_compteur5;' + 'ubyte[4] ancien_compteur6;';
            break;

        case "Trame du compteur 7 et 8":
            res_str = res_str + 'ubyte[4] ancien_compteur7;' + 'ubyte[4] ancien_compteur8;';
            break;

        case "Trame d’entrées digitales,température et compteurs":
            res_str = res_str + 'ubyte[2] entree_ancien;' + 'ubyte[2] temperature;';
            var taille_bytes = (bytes.length - 5) / 4;
            for (var j = 0; j < taille_bytes; j++) {
                res_str = res_str + 'ubyte[4] ancien_compteur' + j + ';';
            }
            break;
        case "Trame d’entrées digitales et compteurs":
            res_str = res_str + 'ubyte[2] entree_ancien;';
            var taille_bytes = (bytes.length - 3) / 4;
            for (var j = 0; j < taille_bytes; j++) {
                res_str = res_str + 'ubyte[4] ancien_compteur' + j + ';';
            }
            break;

        case "Trame alarme ou chocs":
            res_str = res_str + 'ubyte ancien_compteur;';
            break;

        case "Trame d’entrées/sorties digitales":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;';
            break;

        case "Trame d’entrées/sorties digitales et température":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;' + 'ubyte[2] temperature;';
            break;

        case "Trame d’entrées/sorties digitales, température et compteur 1":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;' + 'ubyte[2] temperature;' + 'ubyte[4] ancien_compteur1;';
            break;

        case "Trame d’entrées/sorties digitales, compteur 1 et compteur 2":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;' + 'ubyte[4] ancien_compteur1;' + 'ubyte[4] ancien_compteur2;';
            break;

        case "Trame d’entrées/sorties digitales et compteur 1":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;' + 'ubyte[4] ancien_compteur1;';
            break;

        case "Trame d’entrées/sorties digitales, température et compteurs":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;' + 'ubyte[2] temperature;';
            var taille_bytes = (bytes.length - 5) / 4;
            for (var j = 0; j < taille_bytes; j++) {
                res_str = res_str + 'ubyte[4] ancien_compteur' + j + ';';
            }
            break;

        case "Trame d’entrées/sorties digitales et compteurs":
            res_str = res_str + 'ubyte entree_digital;' + 'ubyte sortie_digital;';
            var taille_bytes = (bytes.length - 3) / 4;
            for (var j = 0; j < taille_bytes; j++) {
                res_str = res_str + 'ubyte[4] ancien_compteur' + j + ';';
            }
            break;

        case "Produit PIR":
            res_str = res_str + 'ubyte type_trame;' + 'ubyte ouverture_boitier;' + 'ubyte[2] capteur_dq;' + 'ubyte[2] compteur_pir;' + 'ubyte[2] temperature_pir;';
            break; res_str = res_str + 'ubyte[2] temperature_TMXD_S1;';
            break;
        case "Trame de compteur standard":
            res_str = res_str + 'ubyte wirecut;' + 'ubyte[4] ancien_compteur1;' + 'ubyte[4] ancien_compteur2;';
            break;
        case "Trame alerte état câble coupé":
            res_str = res_str + 'ubyte wirecut;';
            break;
        case "Trame de détection de changement d'état (TOR)":
            res_str = res_str + 'ubyte[2] logic_level;';
            break;
        case "Trame Compteur mode ECO (Compteur 1 22 bits et 5 deltas 32 bits LoraWan )":
            res_str = res_str + 'ubyte[4] ancien_compteur5;' + 'ubyte[4] ancien_compteur4;' + 'ubyte[4] ancien_compteur3;' + 'ubyte[4] ancien_compteur2;' + 'ubyte[4] ancien_compteur1;' + 'ubyte[4] ancien_compteur0;';
            break;
        case "Trame Test LoraWan":
            res_str = res_str + 'ubyte[4] ancien_compteur1;';
            break;
        case "Trame 39 Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)":
            res_str = res_str + 'ubyte[10] sigfox;';
            break;
        case "Trame 3A Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)":
            res_str = res_str + 'ubyte[10] sigfox;';
            break;
        case "Trame 3B Compteur mode ECO (Compteur 1 20 bits et 5 deltas 12 bits concaténés SIGFOX)":
            res_str = res_str + 'ubyte[10] sigfox;';
            break;
        case "Trame de relevé périodique d'une valeur 0-10V":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] voltage;';
            break;
        case "Trame de relevé périodique d'une valeur 0- 20mA":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] current;';
            break;
        case "Trame d'alerte BAS d'une valeur 0-10V":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] voltage;';
            break;
        case "Trame d'alerte BAS d'une valeur 4-20mA":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] current;' + 'ubyte offset;';
            break;
        case "Trame defin d'alerte BAS d'une valeur 0-10V":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] voltage;';
            break;
        case "Trame de fin d'alerte BAS d'une valeur 4-20mA":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] current;' + 'ubyte offset;';
            break;
        case "Trame d'alerte HAUT d'une valeur 0-10V":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] voltage;';
            break;
        case "Trame d'alerte HAUT d'une valeur 4-20mA":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] current;' + 'ubyte offset;';
            break;
        case "Trame de fin d’alerte HAUT d’une valeur 0-10V":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] voltage;';
            break;
        case "Trame de fin d'alerte HAUT d'une valeur 4-20mA":
            res_str = res_str + 'ubyte logic_level_dinda;' + 'ubyte[2] current;' + 'ubyte offset;';
            break;

        case "Température S1 < seuil bas et température S2 < seuil bas":
        case "Température S1 < seuil bas et température S2 entre les seuils":
        case "Température S1 < seuil bas et température S2 > seuil haut":
        case "Température S1 entre les seuils et température S2 < seuil bas":
        case "Température S1 entre les seuils et température S2 entre les seuils":
        case "Température S1 entre les seuils et température S2 > seuil haut":
        case "Température S1 > seuil haut et température S2 < seuil bas":
        case "Température S1 > seuil haut et température S2 entre les seuils":
        case "Température S1 > seuil haut et température S2 > seuil haut":
            res_str = res_str + 'ubyte[2] temperature_TMXD_S1;' + 'ubyte[2] temperature_TMXD_S2;';
            break;

        //TM1D
        case "Trame de relevé périodique de la température":
        case "Trame de relevé périodique de la température":
        case "Dépassement de seuil bas détecté TM2D":
        case "Dépassement de seuil bas terminé TM2D":
        case "Dépassement de seuil haut détecté TM2D":
        case "Dépassement de seuil haut terminé TM2D":
            res_str = res_str + 'ubyte[2] temperature_TMXD_S1;' + 'ubyte[2] temperature_TMXD_S2;';
            break;

        //TM2D
        case "Trame de relevé périodique de deux temperatures":
        case "Dépassement de seuil bas détecté TM1D":
        case "Dépassement de seuil bas terminé TM1D":
        case "Dépassement de seuil haut détecté TM1D":
        case "Dépassement de seuil haut terminé TM1D":
            res_str = res_str + 'ubyte[2] temperature_TMXD_S1;';
            break;

    }
    data.data = res_str;
    return data;
}

function decode_json(data_json, frame) {

    var declarationString = data_json;
    var str = declarationString.split(';');
    var inputString = frame;

    //console.log(str);
    var length_pred = 0;
    var data = {};

    for (var w = 0; w < str.length; w++) {
        declarationString = str[w];
        declarationString = declarationString.split(' ');

        // Extraire les types et les noms des variables de la déclaration
        var variables = [];
        if (isNaN(parseInt(declarationString[0][6]))) {
            var length = 1;
        } else if (isNaN(parseInt(declarationString[0][7]))) {
            var length = parseInt(declarationString[0][6]);
        } else {
            var length = parseInt(parseInt(declarationString[0][6]) * 10 + parseInt(declarationString[0][7]));
        }
        var variable = {
            type: declarationString[0],
            name: declarationString[1],
            length: length
        };
        variables.push(variable);

        // Décomposer la chaîne de caractères en utilisant les informations sur les variables
        var currentIndex = length_pred;
        for (var i = 0; i < variables.length; i++) {
            var variable = variables[i];
            var bytesHex = inputString.substr(currentIndex, variable.length * 2);
            currentIndex += variable.length * 2;

            var bytesDecimal = [];
            for (var j = 0; j < bytesHex.length; j += 2) {
                bytesDecimal.push(parseInt(bytesHex.substr(j, 2), 16));
            }

            if (variable.length === 1) {
                data[variable.name] = bytesDecimal[0];
            } else {
                data[variable.name] = bytesDecimal;
            }

        }
        length_pred += variable.length * 2;
    }

    var output = {};
    for (var key in data) {
        if (data.hasOwnProperty(key) && key !== "undefined") {
            output[key] = data[key];
        }
    }
    return JSON.stringify(output);
}




///// ENCODER /////

// --------------------------
// ACW_CFG_PARAM_INx
// --------------------------
//Event mode                                        byte 0 - b0,2
var ACW_CFG_PARAM_IN_EVENT_DISABLE = 0x00;
var ACW_CFG_PARAM_IN_EVENT_EDGE = 0x01;
var ACW_CFG_PARAM_IN_EVENT_COUNTER1 = 0x02;
var ACW_CFG_PARAM_IN_EVENT_COUNTER2 = 0x03;
var ACW_CFG_PARAM_IN_EVENT_COUNTER3 = 0x04;
var ACW_CFG_PARAM_IN_EVENT_COUNTER4 = 0x05;
var ACW_CFG_PARAM_IN_EVENT_ANALOG = 0x06;
var ACW_CFG_PARAM_IN_EVENT_I2C = 0x07;
var ACW_CFG_PARAM_IN_EVENT_UART = 0x08;

//Pull type                             					  byte 0 - b5,4
var ACW_CFG_PARAM_IN_PULL_UP = 0x10;
var ACW_CFG_PARAM_IN_PULL_DOWN = 0x20;

//Trigger mode                          					  byte 0 - b6,7
var ACW_CFG_PARAM_IN_TRIGGER_RISING = 0x40;
var ACW_CFG_PARAM_IN_TRIGGER_FALLING = 0x80;
var ACW_CFG_PARAM_IN_TRIGGER_RISING_FALLING = 0xc0;

//ANALOG MODE
var ACW_CFG_PARAM_IN_ANALOG_420 = (1 << 0 << 4);
var ACW_CFG_PARAM_IN_ANALOG_010 = (1 << 1 << 4);
var ACW_CFG_PARAM_IN_ANALOG_36 = (1 << 2 << 4);

// --------------------------
// ACW_CFG_PARAM_SENSORS_ENABLED -> 1 byte
// --------------------------
var ACW_CFG_PARAM_NO_SENSOR_ACTIVATED = 0x00;
var ACW_CFG_PARAM_SENSOR_INTERNAL_SHT30_ACTIVATED = 0x01;
var ACW_CFG_PARAM_SENSOR_EXTERNAL_SHT30_ACTIVATED = 0x02;
var ACW_CFG_PARAM_SENSOR_ACC_ACTIVATED = 0x04;
var ACW_CFG_PARAM_BOTH_SENSORS_ACTIVATED = ((ACW_CFG_PARAM_SENSOR_INTERNAL_SHT30_ACTIVATED) | (ACW_CFG_PARAM_SENSOR_EXTERNAL_SHT30_ACTIVATED) | (ACW_CFG_PARAM_SENSOR_ACC_ACTIVATED));
var ACW_CFG_PARAM_BOTH_SENSORS_SHT30_ACTIVATED = ((ACW_CFG_PARAM_SENSOR_INTERNAL_SHT30_ACTIVATED) | (ACW_CFG_PARAM_SENSOR_EXTERNAL_SHT30_ACTIVATED));

// --------------------------
// ACW_CFG_PARAM_RADIO
// --------------------------
var WDGRADIO_LOCAL_SF7 = 0x70;
var WDGRADIO_LOCAL_SF8 = 0x80;
var WDGRADIO_LOCAL_SF9 = 0x90;
var WDGRADIO_LOCAL_SF10 = 0xA0;
var WDGRADIO_LOCAL_SF11 = 0xB0;
var WDGRADIO_LOCAL_SF12 = 0xC0;

// ---------------------------------------
// ACW_CFG_PARAM_SENSORS_ENBLED
// ---------------------------------------
var ACW_CFG_PARAM_SENSORS_TH_BIT = 0;
var ACW_CFG_PARAM_SENSORS_TH_MASK = (1 << ACW_CFG_PARAM_SENSORS_TH_BIT);

var ACW_CFG_PARAM_SENSORS_VOC_BIT = 1;
var ACW_CFG_PARAM_SENSORS_VOC_MASK = (1 << ACW_CFG_PARAM_SENSORS_VOC_BIT);

var ACW_CFG_PARAM_SENSORS_LUM_BIT = 2;
var ACW_CFG_PARAM_SENSORS_LUM_MASK = (1 << ACW_CFG_PARAM_SENSORS_LUM_BIT);

var ACW_CFG_PARAM_SENSORS_CO2_BIT = 3;
var ACW_CFG_PARAM_SENSORS_CO2_MASK = (1 << ACW_CFG_PARAM_SENSORS_CO2_BIT);

var ACW_CFG_PARAM_SENSORS_ALL_MASK = (ACW_CFG_PARAM_SENSORS_TH_MASK | ACW_CFG_PARAM_SENSORS_VOC_MASK | ACW_CFG_PARAM_SENSORS_LUM_MASK | ACW_CFG_PARAM_SENSORS_CO2_MASK)

function encodeDownlink(input) {
    var bytes = [];
    var errors = [];

    if("setTimestamp" in input.data)
    {
        bytes.push(0x0B);
        bytes.push(input.data.setTimestamp);
    }

    if("setKeepAlivePeriod" in input.data)
    {
        bytes.push(0x03);
        switch (input.data.setKeepAlivePeriod) {
            case "Disable":
            case "Désactivé":
                bytes.push(0x00);
                break;
            case "Once every 10 mins":
            case "Toutes les 10 minutes":
                bytes.push(0x04);
                break;
            case "Once every hour":
            case "Toutes les heures":
                bytes.push(0x05);
                break;
            case "Once every 2 hours":
            case "Toutes les 2 heures":
                bytes.push(0x0a);
                break;
            case "Once every 4 hours":
            case "Toutes les 4 heures":
                bytes.push(0x0b);
                break;
            case "Once every 8 hours":
            case "Toutes les 8 heures":
                bytes.push(0x0c);
                break;
            case "Once every day":
            case "Tous les jours":
                bytes.push(0x06);
                break;
            case "Once every 2 days":
            case "Tous les 2 jours":
                bytes.push(0x0d);
                break;
            case "Once every 3 days":
            case "Tous les 3 jours":
                bytes.push(0x0e);
                break;
            case "Once every 4 days":
            case "Tous les 4 jours":
                bytes.push(0x0f);
                break;
            case "Once every week":
            case "Toutes les semaines":
                bytes.push(0x07);
                break;
            case "Once every month (30 days)":
            case "Tous les mois (30 jours)":
                bytes.push(0x08);
                break;
            default:
                bytes.push(0x05);
                break;
        }
    }

    if("setDataloggingPeriod" in input.data)
    {
        bytes.push(0xD4);
        bytes.push(0x03);
        bytes.push(0x01);
        bytes.push(input.data.setDataloggingPeriod & 0xFF);
        bytes.push(input.data.setDataloggingPeriod >> 8);
    }

    encodeMio(input.data, bytes, errors);

    return {
        bytes: bytes,
        fPort: 1,
        warnings: [],
        errors: errors,
    };
}

function decodeDownlink(input) {
    return {
        data: {
            bytes: input.bytes,
        },
        warnings: [],
        errors: [],
    };
}

function postProcessHorodatage(decoded, data) {
    if (decoded.horo !== undefined) {
        decoded.horodatage = atimTimestamp(decoded.horo);
        delete decoded.horo;
    }
}

/*******************************************************************************************************************************/
/*******************************************************************************************************************************/
/*GAMME MIO*/
/*******************************************************************************************************************************/
/*******************************************************************************************************************************/

/* Paramètres du protocole downlink ATIM propres au MIO */
var PARAM_TRAME_VIE = 3;
var PARAM_HORODATAGE = 11;
var PARAM_DATALOGGING = 20;
var PARAM_SEUIL_ANALOGIQUE_1 = 21;
var PARAM_CALIBRATION_ANALOGIQUE = 24;
var PARAM_CALIBRATION_TEMPERATURE = 25;
var PARAM_SEUIL_ANALOGIQUE_2 = 36;
var PARAM_ENTREES = [26, 27, 33, 34];
var COMMANDE_LIRE_PARAMETRES = 4;
var COMMANDE_FORCER_COMPTEUR = 0x11;

/* Octet de configuration d'une entrée : rôle (bits 0-2), puis type analogique (bits 4-6) ou tirage (bits 4-5) et front (bits 6-7) */
var ROLES_ENTREE = { disabled: 0x00, edge: 0x01, counter: 0x02, analog: 0x06, wirecut: 0x07 };
var TYPES_ANALOGIQUES = { "4-20mA": 0x01, "0-10V": 0x02, "0-100%": 0x04 };
var TIRAGES = { none: 0x00, up: 0x01, down: 0x02 };
var FRONTS = { rising: 0x01, falling: 0x02, both: 0x03 };

/* Mise à l'échelle des seuils et de l'offset de calibration : unité de la trame (mV, centièmes de mA, centièmes de %) */
var ECHELLES_ANALOGIQUES = { "4-20mA": 100, "0-10V": 1000, "0-100%": 100 };

var LIBELLES_ROLES = ["Désactivée", "Entrée TOR", "Compteur", "Compteur", "Compteur", "Compteur", "Entrée analogique", "Coupure de câble"];
var LIBELLES_ANALOGIQUES = { 1: "4-20 mA", 2: "0-10 V", 4: "0-100 %" };
var LIBELLES_TIRAGES = ["sans tirage", "tirage haut", "tirage bas"];
var LIBELLES_FRONTS = ["", "front montant", "front descendant", "fronts montant et descendant"];

var PERIODES_TRAME_VIE = {
    0: "Désactivé",
    4: "Toutes les 10 minutes",
    5: "Toutes les heures",
    10: "Toutes les 2 heures",
    11: "Toutes les 4 heures",
    12: "Toutes les 8 heures",
    6: "Tous les jours",
    13: "Tous les 2 jours",
    14: "Tous les 3 jours",
    15: "Tous les 4 jours",
    7: "Toutes les semaines",
    8: "Tous les mois (30 jours)"
};

var ERREURS_DOWNLINK = {
    1: "Trame de commande incorrecte",
    2: "Commande inconnue ou incohérente",
    3: "Paramètre inconnu",
    4: "Erreur lors de l'exécution de la commande",
    5: "Paramètre bufferisé erroné"
};

/* Voies analogiques : tension en mV -> V, courant en centièmes de mA, pourcentage en centièmes de % */
function postProcessAnalogique(decoded, data) {
    var valeur_echan_hist = (data.echan * data.historique);
    var grandeurs = [["tension", 1000], ["courant", 100], ["taux", 100]];
    for (var g = 0; g < grandeurs.length; g++) {
        for (var voie = 0; voie < 4; voie++) {
            var champ = grandeurs[g][0] + voie;
            var brut = decoded[champ];
            if (brut == undefined) continue;
            var valeurs = [];
            for (var i = 0; i < valeur_echan_hist; i++) {
                valeurs.push(((brut[1 + i * 2] << 8) | brut[2 + i * 2]) / grandeurs[g][1]);
            }
            decoded[champ] = atimValue(valeurs);
        }
    }
}

/* Température et humidité : capteur interne (voie 0) et capteur externe (voie 1, si activé) */
function postProcessTemperatureHumidite(decoded, data) {
    var valeur_echan_hist = (data.echan * data.historique);
    for (var voie = 0; voie < 2; voie++) {
        var temp = decoded["temp" + voie];
        if (temp != undefined) {
            var temperatures = [];
            for (var i = 0; i < valeur_echan_hist; i++) {
                var t = (((temp[1 + i * 2] << 8) | temp[2 + i * 2]) << 16 >> 16) / 100;
                temperatures.push(t === -327.68 ? "erreur" : t);
            }
            delete decoded["temp" + voie];
            decoded["temperature" + voie] = atimValue(temperatures);
        }
        var hum = decoded["hum" + voie];
        if (hum != undefined) {
            var humidites = [];
            for (var j = 0; j < valeur_echan_hist; j++) {
                var h = ((hum[1 + j * 2] << 8) | hum[2 + j * 2]) / 100;
                humidites.push(h === 327.68 ? "erreur" : h);
            }
            delete decoded["hum" + voie];
            decoded["humidity" + voie] = atimValue(humidites);
        }
    }
}

/* Trame spécifique de coupure de câble : code 0x1C, puis 0x01 (câble OK) ou 0x20 (câble coupé) */
function postProcessCable(decoded) {
    if (decoded.cable == undefined) return;
    var valeur_cable = decoded.cable;
    delete decoded.cable;
    if (valeur_cable[0] === 0x1C) {
        decoded.cable_coupe = valeur_cable[1] === 0x20 ? 1 : 0;
    }
}

function versHexa(liste) {
    var texte_hexa = "";
    for (var i = 0; i < liste.length; i++) {
        texte_hexa += ("0" + (liste[i] & 0xFF).toString(16)).slice(-2);
    }
    return texte_hexa;
}

function libelleEntree(valeur_config) {
    var role = valeur_config & 0x07;
    var libelle = LIBELLES_ROLES[role];
    if (role === ROLES_ENTREE.analog) {
        var type_analogique = LIBELLES_ANALOGIQUES[(valeur_config >> 4) & 0x07];
        return type_analogique ? libelle + ", " + type_analogique : libelle;
    }
    if (role === ROLES_ENTREE.disabled || role === ROLES_ENTREE.wirecut) return libelle;
    var details = [LIBELLES_TIRAGES[(valeur_config >> 4) & 0x03] || "tirage inconnu"];
    var front = LIBELLES_FRONTS[(valeur_config >> 6) & 0x03];
    if (front) details.push(front);
    return libelle + ", " + details.join(", ");
}

function decodeParametre(parametre, valeur, decoded) {
    var numero_entree = PARAM_ENTREES.indexOf(parametre);
    if (numero_entree >= 0) {
        decoded["config_entree" + (numero_entree + 1)] = libelleEntree(valeur[0]);
    } else if (parametre === PARAM_TRAME_VIE) {
        decoded.periode_trame_vie = PERIODES_TRAME_VIE[valeur[0]] !== undefined ? PERIODES_TRAME_VIE[valeur[0]] : valeur[0];
    } else if (parametre === PARAM_HORODATAGE) {
        decoded.horodatage_active = valeur[0];
    } else if (parametre === PARAM_DATALOGGING && valeur.length === 4 && valeur[0] === 0) {
        decoded.profondeur_historique = (valeur[1] >> 4) & 0x0F;
        decoded.nombre_echantillons = (valeur[1] & 0x0F) + 1;
        decoded.periode_emission = valeur[2] | (valeur[3] << 8);
    } else {
        decoded["parametre" + parametre] = versHexa(valeur);
    }
}

/* Liste de paramètres (réponse à la commande 4) : en-tête taille|paramètre, puis la valeur. */
function decodeParametres(liste, position, decoded) {
    while (position < liste.length) {
        var entete = liste[position];
        if (entete === 0) break;
        var n = entete >> 6;
        var parametre = entete & 0x3F;
        var taille = [1, 2, 4][n];
        var position_valeur = position + 1;
        if (n === 3) {
            if (position + 1 >= liste.length) break;
            taille = liste[position + 1];
            position_valeur = position + 2;
        }
        if (position_valeur + taille > liste.length) break;
        decodeParametre(parametre, Array.prototype.slice.call(liste, position_valeur, position_valeur + taille), decoded);
        position = position_valeur + taille;
    }
}

/* Réponses aux trames descendantes : configuration (x6), commande (x7), trame erronée (x8). */
function decodeReponse(liste, decoded) {
    var type = decoded.frame_type;
    var position = (liste[0] & 0x40) ? 5 : 1;
    if (position === 5 && liste.length >= 5) {
        decoded.horodatage = atimTimestamp(Array.prototype.slice.call(liste, 1, 5));
    }
    if (type === "Réponse à une trame de configuration") {
        var refuses = [];
        for (var i = position; i < liste.length; i++) {
            for (var b = 0; b < 8; b++) {
                if (liste[i] & (1 << b)) refuses.push((i - position) * 8 + b + 1);
            }
        }
        decoded.configuration_acceptee = refuses.length === 0 ? 1 : 0;
        decoded.parametres_refuses = refuses;
    } else if (type === "Réponse à une trame de commande") {
        if (position >= liste.length) return;
        decoded.commande = liste[position];
        if (liste[position] === COMMANDE_LIRE_PARAMETRES) {
            decodeParametres(liste, position + 1, decoded);
        } else {
            decoded.reponse = versHexa(Array.prototype.slice.call(liste, position + 1));
        }
    } else if (type === "Réponse à une trame erronee") {
        if (position >= liste.length) return;
        var code = liste[position];
        decoded.erreur_downlink = ERREURS_DOWNLINK[code] !== undefined ? ERREURS_DOWNLINK[code] : "Code " + code;
    }
}

function estEntier(valeur, min, max) {
    return typeof valeur === "number" && Math.floor(valeur) === valeur && valeur >= min && valeur <= max;
}

function pousserEntier16(bytes, valeur) {
    bytes.push(valeur & 0xFF, (valeur >> 8) & 0xFF);
}

/* Configuration d'une entrée : objet { mode, analogType, pull, trigger } ou octet brut */
function lireConfigEntree(valeur, numero) {
    if (estEntier(valeur, 0, 255)) return valeur;
    if (valeur === null || typeof valeur !== "object" || !(valeur.mode in ROLES_ENTREE)) return null;
    var role = ROLES_ENTREE[valeur.mode];
    if (valeur.mode === "analog") {
        if (!(valeur.analogType in TYPES_ANALOGIQUES)) return null;
        return role | (TYPES_ANALOGIQUES[valeur.analogType] << 4);
    }
    if (valeur.mode !== "edge" && valeur.mode !== "counter") return role;
    /* Entrée TOR ou compteur : le compteur d'une entrée est celui de même numéro */
    var valeur_config = valeur.mode === "counter" ? role + numero - 1 : role;
    var tirage = valeur.pull === undefined ? "none" : valeur.pull;
    var front = valeur.trigger === undefined ? (valeur.mode === "counter" ? "rising" : "both") : valeur.trigger;
    if (!(tirage in TIRAGES) || !(front in FRONTS)) return null;
    return valeur_config | (TIRAGES[tirage] << 4) | (FRONTS[front] << 6);
}

/* Seuil analogique : { analogType, high, low, hysteresis, duration, fastTxPeriod } dans l'unité de l'entrée (mA, V ou %) */
function encodeSeuil(valeur, parametre, nom_commande, bytes, errors) {
    if (valeur === null || typeof valeur !== "object" || !(valeur.analogType in ECHELLES_ANALOGIQUES)) {
        errors.push(nom_commande + ": expected { analogType: \"4-20mA\" | \"0-10V\" | \"0-100%\", high, low, hysteresis, duration, fastTxPeriod }");
        return;
    }
    var echelle = ECHELLES_ANALOGIQUES[valeur.analogType];
    var haut = Math.round(Number(valeur.high) * echelle);
    var bas = Math.round(Number(valeur.low) * echelle);
    var hysteresis = Math.round(Number(valeur.hysteresis || 0) * echelle);
    var duree = valeur.duration === undefined ? 1 : Number(valeur.duration);
    var periode_rapide = valeur.fastTxPeriod === undefined ? 0 : Number(valeur.fastTxPeriod);
    if (!estEntier(haut, -32768, 32767) || !estEntier(bas, -32768, 32767) || !estEntier(hysteresis, 0, 32767)
        || !estEntier(duree, 0, 255) || !estEntier(periode_rapide, 0, 255)) {
        errors.push(nom_commande + ": value out of range (duration 0-255 s, 0 = threshold disabled; fastTxPeriod 0-255 min)");
        return;
    }
    bytes.push(0xC0 | parametre, 9, 0);
    pousserEntier16(bytes, haut);
    pousserEntier16(bytes, bas);
    pousserEntier16(bytes, hysteresis);
    bytes.push(duree, periode_rapide);
}

/* Calibration : valeur = offset + mesure × coefficient, offset dans l'unité de l'entrée (mA, V ou %) */
function encodeCalibration(valeur, numero, nom_commande, bytes, errors) {
    if (valeur === null || typeof valeur !== "object" || !(valeur.analogType in ECHELLES_ANALOGIQUES)) {
        errors.push(nom_commande + ": expected { analogType: \"4-20mA\" | \"0-10V\" | \"0-100%\", offset, coefficient }");
        return;
    }
    pousserCalibration(PARAM_CALIBRATION_ANALOGIQUE, numero, valeur, ECHELLES_ANALOGIQUES[valeur.analogType], nom_commande, bytes, errors);
}

/* Calibration du capteur de température interne : offset en °C, même format que la calibration analogique */
function encodeCalibrationTemperature(valeur, nom_commande, bytes, errors) {
    if (valeur === null || typeof valeur !== "object") {
        errors.push(nom_commande + ": expected { offset, coefficient }");
        return;
    }
    pousserCalibration(PARAM_CALIBRATION_TEMPERATURE, 1, valeur, 100, nom_commande, bytes, errors);
}

/* Paramètre bufferisé de calibration : 4 octets par voie (offset, coefficient × 1000), écrits à l'index de la voie */
function pousserCalibration(parametre, numero, valeur, echelle, nom_commande, bytes, errors) {
    var offset = Math.round(Number(valeur.offset || 0) * echelle);
    var coefficient = Math.round(Number(valeur.coefficient === undefined ? 1 : valeur.coefficient) * 1000);
    if (!estEntier(offset, -32768, 32767) || !estEntier(coefficient, 0, 65535)) {
        errors.push(nom_commande + ": value out of range (coefficient 0 to 65.535)");
        return;
    }
    bytes.push(0xC0 | parametre, 5, (numero - 1) * 4);
    pousserEntier16(bytes, offset);
    pousserEntier16(bytes, coefficient);
}

/* Commandes du MIO : entrées (paramètres 26, 27, 33, 34), seuils (21, 36), calibrations (24, 25), compteurs (commande 0x11), relecture (commande 4) */
function encodeMio(commandes, bytes, errors) {
    for (var numero = 1; numero <= 4; numero++) {
        var nom_commande = "setInput" + numero + "Config";
        if (!(nom_commande in commandes)) continue;
        var valeur_config = lireConfigEntree(commandes[nom_commande], numero);
        if (valeur_config === null) {
            errors.push(nom_commande + ": expected { mode: \"disabled\" | \"edge\" | \"counter\" | \"analog\" | \"wirecut\", analogType, pull, trigger } or a byte");
            continue;
        }
        bytes.push(PARAM_ENTREES[numero - 1], valeur_config);
    }
    if ("setAnalog1Threshold" in commandes) encodeSeuil(commandes.setAnalog1Threshold, PARAM_SEUIL_ANALOGIQUE_1, "setAnalog1Threshold", bytes, errors);
    if ("setAnalog2Threshold" in commandes) encodeSeuil(commandes.setAnalog2Threshold, PARAM_SEUIL_ANALOGIQUE_2, "setAnalog2Threshold", bytes, errors);
    if ("setAnalog1Calibration" in commandes) encodeCalibration(commandes.setAnalog1Calibration, 1, "setAnalog1Calibration", bytes, errors);
    if ("setAnalog2Calibration" in commandes) encodeCalibration(commandes.setAnalog2Calibration, 2, "setAnalog2Calibration", bytes, errors);
    if ("setTemperatureCalibration" in commandes) encodeCalibrationTemperature(commandes.setTemperatureCalibration, "setTemperatureCalibration", bytes, errors);

    /* Les commandes s'envoient seules : une seule par trame, sans paramètre */
    var commande = [];
    for (var c = 1; c <= 4; c++) {
        if (!("setCounter" + c in commandes)) continue;
        var valeur_compteur = Number(commandes["setCounter" + c]);
        if (!estEntier(valeur_compteur, 0, 4294967295)) {
            errors.push("setCounter" + c + ": expected 0 to 4294967295");
            continue;
        }
        commande.push(["setCounter" + c, [COMMANDE_FORCER_COMPTEUR, c, valeur_compteur & 0xFF, (valeur_compteur >>> 8) & 0xFF,
            (valeur_compteur >>> 16) & 0xFF, (valeur_compteur >>> 24) & 0xFF]]);
    }
    if (commandes.getConfiguration) {
        commande.push(["getConfiguration", [COMMANDE_LIRE_PARAMETRES, PARAM_TRAME_VIE, PARAM_HORODATAGE, PARAM_DATALOGGING].concat(PARAM_ENTREES)]);
    }
    if (commande.length > 1 || (commande.length === 1 && bytes.length > 0)) {
        errors.push(commande[0][0] + " must be sent alone (one command per downlink, without settings)");
    } else if (commande.length === 1) {
        bytes.push(0xC1, commande[0][1].length);
        for (var k = 0; k < commande[0][1].length; k++) bytes.push(commande[0][1][k]);
    }
}

/* ---------------------------------------------------------------------------
 * Couche BACnet : une valeur par propriété déclarée
 * ------------------------------------------------------------------------- */

var BACNET_PROPERTIES = {
    "courant0": "float",
    "tension0": "float",
    "taux0": "float",
    "courant1": "float",
    "tension1": "float",
    "taux1": "float",
    "temperature0": "float",
    "humidity0": "float",
    "temperature1": "float",
    "humidity1": "float",
    "input_state0": "uint8",
    "input_state1": "uint8",
    "input_state2": "uint8",
    "input_state3": "uint8",
    "compteur0": "uint32",
    "compteur1": "uint32",
    "compteur2": "uint32",
    "compteur3": "uint32",
    "cable_coupe": "uint8",
    "periode": "uint16",
    "voltagec": "float",
    "voltagev": "float",
    "frame_type": "string",
    "alerte": "string",
    "erreur": "string",
    "horodatage": "string",
    "configuration_acceptee": "uint8",
    "erreur_downlink": "string",
    "config_entree1": "string",
    "config_entree2": "string",
    "config_entree3": "string",
    "config_entree4": "string",
    "inputConfigHelp": "string"
};

var BACNET_STATES = {
    "état haut": 1,
    "état bas": 0,
    "mise à l'état haut": 1,
    "mise à l'état bas": 0
};

var BACNET_CONSTANTS = {
    "inputConfigHelp": "setInput1Config à setInput4Config = octet de configuration | bits 0-2 : 0 désactivée, 1 TOR, 2 compteur (2 à 5 = compteurs 1 à 4), 6 analogique, 7 coupure de câble | analogique : bits 4-6 = 1 (4-20 mA), 2 (0-10 V), 4 (0-100 %), ex. 22 (0x16) = 4-20 mA, 38 (0x26) = 0-10 V | TOR et compteur : bits 4-5 tirage (0 aucun, 1 haut, 2 bas), bits 6-7 front (1 montant, 2 descendant, 3 les deux), ex. 209 (0xD1) = TOR, tirage haut, deux fronts | setCounter1 à setCounter4 = nouvelle valeur du compteur | getConfiguration = 1 pour relire la configuration"
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
    for (var name in BACNET_CONSTANTS) {
        if (Object.prototype.hasOwnProperty.call(BACNET_CONSTANTS, name)) data[name] = BACNET_CONSTANTS[name];
    }
    result.data = data;
    return result;
}

/* Node.js / CommonJS */
if (typeof module !== "undefined" && module.exports) {
    module.exports.decodeUplink = decodeUplink;
    module.exports.encodeDownlink = encodeDownlink;
}
