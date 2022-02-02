const path                  = require('path');
const BASE_DIR              = path.dirname(require.main.filename);
const querystring           = require('querystring');
const config                = require(BASE_DIR + '/Config');
const utils                 = require(BASE_DIR + '/Utils');
const http                  = require(BASE_DIR + '/libraries/HttpHandler');
const API_CONFIG            = utils.duplicateObject(config.API_GET_CONTACT);

class ApiGetContact {
    static async getContactInfo(req, cb) {
        let params = {
            "key": process.env.GET_CONTACT_KEY, 
            "username": req.body.username,
            "account": req.body.params.msisdn
        };

        params = querystring.stringify(params);
        
        this.sentRequest(req, params, function(result) {
            cb(result);
        });
    }

    static async sentRequest(req, params, cb) {
        http.apiRequest(req.id, req.body.clientIp, API_CONFIG, params, {'Content-Type': 'application/x-www-form-urlencoded'}, function(resAPI) {
            if (resAPI && resAPI.code === 0 && "contents" in resAPI && resAPI.content != '') {
                cb(resAPI.contents);
            } else {
                cb(null);
            }
        });
    }
}

module.exports = ApiGetContact;