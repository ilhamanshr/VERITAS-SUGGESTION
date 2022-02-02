const path                  = require('path');
const BASE_DIR              = path.dirname(require.main.filename);
const config                = require(BASE_DIR + '/Config');
const utils                 = require(BASE_DIR + '/Utils');
const http                  = require(BASE_DIR + '/libraries/HttpHandler');
const API_CONFIG            = utils.duplicateObject(config.API_AI);

class ApiAI {
    static async getSuggestionName(req, cb) {
        
        let params = JSON.stringify({
            "num": 2,
            "text": req.body.params.tags
        });

        API_CONFIG["API_PATH"] = process.env.API_AI_PATH;
        
        this.sentRequest(req, params, API_CONFIG, function(result) {
            cb(result);
        });
    }

    static async getProbability(req, cb) {
        
        let params = JSON.stringify({
            "text": req.body.params.data
        });
        
        API_CONFIG["API_PATH"] = process.env.API_AI_PATH_PROBABILITY;

        this.sentRequest(req, params, API_CONFIG, function(result) {
            cb(result);
        });
    }

    static async sentRequest(req, params, API, cb) {
        http.apiRequest(req.id, req.body.clientIp, API, params, {}, function(resAPI) {
            if (resAPI && resAPI.code === 0 && "content" in resAPI) {
                cb(resAPI.content);
            } else {
                cb(null);
            }
        });
    }
}

module.exports = ApiAI;