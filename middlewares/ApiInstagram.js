const path                  = require('path');
const BASE_DIR              = path.dirname(require.main.filename);
const config                = require(BASE_DIR + '/Config');
const utils                 = require(BASE_DIR + '/Utils');
const http                  = require(BASE_DIR + '/libraries/HttpHandler');
const API_CONFIG            = utils.duplicateObject(config.API_INSTAGRAM);

class ApiTwitter {
    static async getBasicInfo(req, cb) {
        let self = this;
        let params = {
            "action": "BasicInfo", 
            "subAction": "getBasicInfo",
            "body": {}
        };

        if("id" in req.body.params) params["body"]["userId"] = req.body.params.id;
        if("username" in req.body.params) params["body"]["username"] = req.body.params.username;
        if("name" in req.body.params) params["action"] = "Crawler", params["subAction"] = "searchAccount", params["body"]["search"] = req.body.params.name;

        this.sentRequest(req, params, function(result) {
            cb(result);
        });
    }

    static async getProfilePicture(req, cb) {
        let params = {
            "action": "Media", 
            "subAction": "getMediaById",
            "body": {
                "mediaId": req.body.params.mediaId
            }
        };
        
        this.sentRequest(req, params, function(result) {
            cb(result)
        });
    }

    static async sentRequest(req, params, cb) {
        http.apiRequest(req.id, req.body.clientIp, API_CONFIG, JSON.stringify(params), {}, function(resAPI) {
            if (resAPI && resAPI.code === 0 && "content" in resAPI && resAPI.content != '') {
                cb(resAPI.content);
            } else {
                cb(null);
            }
        });
    }
}

module.exports = ApiTwitter;