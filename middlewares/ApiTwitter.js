const fs            = require('fs');
const httpCustom    = require('http');
const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const querystring   = require('querystring');
const http          = require(BASE_DIR + '/libraries/HttpHandler');
const config        = require(BASE_DIR + '/Config');
const utils         = require(BASE_DIR + '/Utils');
const msg           = require(BASE_DIR + '/Messages');
const mime          = require('mime');
const API_CONFIG    = utils.duplicateObject(config.API_TWITTER);

class ApiTwitter {
    static async getBasicInfo(req, cb) {
        let params = {};
        
        if("id" in req.body.params) params["user_id"] = req.body.params.id;
        if("username" in req.body.params) params["user_name"] = req.body.params.username;
        if("name" in req.body.params) params["keyword"] = req.body.params.name;
        
        this.sentRequest(req, params, function(result) {
            cb(result)
        });
    }

    static async getProfilePicture(req, cb) {
        let API = utils.duplicateObject(config.API_TWITTER);
        let API_PATH = process.env.TWITTER_PATH_MEDIA + `/${req.body.params.mediaId}`;
        let url = 'http://' + API.API_HOST + ':' + API.API_PORT + API_PATH;
        let mimeType = req.body.params.mediaId.split('.');
        
        httpCustom.get(url, function(response) {
            let body = "";

            response.setEncoding('binary');

            response.on('end', function () {
                if (response.statusCode = 200) {
                    let base64 = new Buffer.from(body, 'binary').toString('base64');
                    cb({"data":base64, "mimeType": 'image/' + mimeType[1]});
                } else {
                    cb(null);
                }
            });

            response.on('data', function (chunk) {
                if (response.statusCode == 200) body += chunk;
            });
        });
    }

    static async sentRequest(req, params, cb) {
        if ("name" in req.body.params) {
            API_CONFIG["API_PATH"] = process.env.TWITTER_PATH_SUGGESTION;
        } else {
            API_CONFIG["API_PATH"] = process.env.TWITTER_PATH;
        }
        
        http.apiRequest(req.id, req.body.clientIp, API_CONFIG, querystring.stringify(params), {}, function(resAPI) {
            // console.log(resAPI)
            if (!resAPI) {
                cb(null);
            } else {
                if ("content" in resAPI) {
                    if (resAPI.content.constructor.name == "Object") {
                        cb(resAPI.content);
                    } else {
                        cb(null);
                    }
                } else {
                    cb(resAPI);
                }
            }
        });
    }
}

module.exports = ApiTwitter;