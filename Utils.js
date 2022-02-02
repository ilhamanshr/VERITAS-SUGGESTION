const path      = require('path');
const BASE_DIR  = path.dirname(require.main.filename);
const logger    = require(BASE_DIR + '/Logger');
const msg       = require(BASE_DIR + '/Messages');

exports.setResponse = function(req, res, response) {
    let responseLog = JSON.stringify(response);
    responseLog = JSON.parse(responseLog);
    if(response.content && "base64" in response.content) delete responseLog.content.base64;

    logger.info(__filename, JSON.stringify(responseLog), req.id, req.body.clientIp, "Response to client");


    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
}

exports.checkParameter = function(req, res, requiredParams, cb) {
    logger.info(__filename, JSON.stringify(req.body), req.id, req.body.clientIp, "Received request from client");

    let obj = req.body.params;
    let result = true;

    Object.keys(obj).forEach(function(v, k) {
        requiredParams.forEach(function(val, key) {
            result = (obj.hasOwnProperty(val)) ? true : false;
        });
    });
    
    if (result) {
        cb();
    } else {
        let response = this.duplicateObject(msg.ERR_BAD_REQUEST);
        logger.info(__filename, JSON.stringify(req.body), req.id, req.body.clientIp, response.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    }
}

exports.duplicateObject = function(tmpObject) {
    var resultObj = {};
    for (var key in tmpObject) {
        resultObj[key] = tmpObject[key];
    }
    return resultObj;
}

exports.isJSON = function(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.secToTime = function(time) {
    let sec_num = parseInt(time, 10);
    let days    = Math.floor(sec_num / 86400);
    let hours   = Math.floor((sec_num - (days * 86400)) / 3600);
    let minutes = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
    let seconds = sec_num - (days * 86400) - (hours * 3600) - (minutes * 60);

    let format = '';
    format += ((days > 0) ? days + ' days ' : '');
    format += ((hours > 0) ? hours + ' hours ' : '');
    format += ((minutes > 0) ? minutes + ' minutes ' : '');
    format += ((seconds > 0) ? seconds + ' seconds' : '');

    return format;
}

exports.normalizeWordCloud = function(data, cb) {
    let wordCloud = [];
    
    data.forEach(element => {
        let x = element.count - data[data.length-1].count;
        let y = data[0].count - data[data.length-1].count;
        let weight =  x/y;
        if (weight < 0.25){
            weight = 25;
        }
        else if (weight < 0.5){
            weight = 50;
        }
        else if (weight < 0.75){
            weight = 75;
        }
        else {
            weight = 100;
        }
        wordCloud.push({
            "name": element.name,
            "weight": weight,
            "count": element.count
        });
    });

    cb(wordCloud);
}