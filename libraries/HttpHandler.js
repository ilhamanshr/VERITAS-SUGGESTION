const http      = require('http');
const https     = require('https');
const path      = require('path');
const BASE_DIR  = path.dirname(require.main.filename);
const logger    = require(BASE_DIR + '/Logger');
const utils     = require(BASE_DIR + '/Utils');
const msg       = require(BASE_DIR + '/Messages');

exports.apiRequest = function(reqId, clientIp, options, params, headers, cb) {
    if (options.API_HOST.includes("https://")) {
        options["API_SSL"] = true;
        options["API_HOST"] = options.API_HOST.replace("https://", "");
    } else if (options.API_HOST.includes("http://")) {
        options["API_SSL"] = false;
        options["API_HOST"] = options.API_HOST.replace("http://", "");
    }
    
    if ("API_SSL" in options && options.API_SSL) {
        exports.httpRequest(reqId, clientIp, true, options, params, headers, function(res) {
            cb(res);
        });
    } else {
        exports.httpRequest(reqId, clientIp, false, options, params, headers, function(res) {
            cb(res);
        });
    }
};

exports.httpRequest = function(reqId, clientIp, isSSL, options, params, headers, cb) {
    if (isSSL) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    
    var httpOptions = {
        host: ("API_HOST" in options ? options.API_HOST : "localhost"),
        method: ("API_METHOD" in options ? options.API_METHOD : "GET"),
        path: ("API_PATH" in options ? options.API_PATH : "/"),
        headers: { "Content-Type": "application/json" }
    };

    if ("API_PORT" in options && options.API_PORT) httpOptions["port"] = parseInt(options.API_PORT);
    if ("API_TIMEOUT" in options && options.API_TIMEOUT) httpOptions["timeout"] = parseInt(options.API_TIMEOUT);

    if (options.hasOwnProperty("API_USERNAME") && options.hasOwnProperty("API_PASSWORD") && options.API_USERNAME && options.API_PASSWORD) {
        httpOptions["headers"]["Authorization"] = "Basic "+ Buffer.from(options.API_USERNAME + ':' + options.API_PASSWORD).toString('base64');
    }

    if (headers && Object.keys(headers).length > 0) {
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                httpOptions["headers"][key] = headers[key];
            }
        }
    }

    if (httpOptions.method === "GET") {
        httpOptions["path"] += "?" + params;
    }

    logger.info(__filename, JSON.stringify(httpOptions["headers"]), reqId, clientIp, "HTTP Header");
    logger.info(__filename, params, reqId, clientIp, "Sending request to "+ ((isSSL) ? "https://" : "http://") + httpOptions.host +":"+ (("port" in httpOptions) ? httpOptions.port : "") + (("path" in httpOptions) ? httpOptions.path : ""));

    var resCallback = function(res) {
        var result = "";

        res.on('data', function(chunk) {
            result += chunk;
        });

        res.on('end', function() {
            logger.debug(__filename, result, reqId, clientIp, "Response received from "+ ((isSSL) ? "https://" : "http://") + httpOptions.host +":"+ (("port" in httpOptions) ? httpOptions.port : "") + (("path" in httpOptions) ? httpOptions.path : ""));
            var response = utils.duplicateObject(msg.ERR_RESPONSE);

            if (result) {
                if (utils.isJSON(result)) {
                    result = JSON.parse(result);
                    cb(result);
                } else {
                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["content"] = result;
                    cb(response);
                }
            } else {
                response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
                response["message"] = response.message +". Response from backend is null.";
                cb(response);
            }
        });

        res.on('error', function(err) {
            logger.error(__filename, "Request id "+ reqId +" error: "+ err);
            var response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
            cb(response);
        });
    }
    
    var req = (isSSL) ? https.request(httpOptions, resCallback) : http.request(httpOptions, resCallback);

    if ("API_TIMEOUT" in options && options.API_TIMEOUT) {
        req.on('timeout', () => {
            var response = utils.duplicateObject(msg.ERR_GATEWAY_TIMEOUT);
            logger.debug(__filename, "", reqId, clientIp, response.message);
            cb(response);
            req.abort();
        });
    }

    req.on('error', function(err) {
        err = JSON.parse(JSON.stringify(err));
        var response = utils.duplicateObject(msg.ERR_RESPONSE);
        if ("code" in err && err.code !== "ECONNRESET") {
            response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
            logger.error(__filename, "Request id "+ reqId +" error: "+ JSON.stringify(err));
            cb(response);
        }
    });

    if (httpOptions.method == "GET") {
        req.write("");
    } else {
        req.write(params);
    }
    
    req.end();
}