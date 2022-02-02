const path                  = require('path');
const BASE_DIR              = path.dirname(require.main.filename);
const querystring           = require('querystring');
const config                = require(BASE_DIR + '/Config');
const utils                 = require(BASE_DIR + '/Utils');
const logger                = require(BASE_DIR + '/Logger');
const http                  = require(BASE_DIR + '/libraries/HttpHandler');
const { getResultFormat }   = require(BASE_DIR + '/models/Pipl');

class ApiPipl {

    static async ApiPipl(req, cb) {
        let API_CONFIG  = utils.duplicateObject(config.API_PIPL);

        var params = {
            "tag":"new"
        };
        
        if ("name" in req.body.params) params["search_raw_name"] = req.body.params.name;
        // if ("username" in req.body.params) params["search_username"] = req.body.params.username;
        if ("email" in req.body.params) params["search_email"] = req.body.params.email;
        if ("msisdn" in req.body.params) params["search_phone"] = req.body.params.msisdn;
        if ("age" in req.body.params) {
            params["search_from_age"] = parseInt(req.body.params.age) - 1;
            params["search_to_age"] = parseInt(req.body.params.age) + 1;
        }
        params["key"] = process.env.PIPL_KEY,
        params["username"] = req.body.username;
        params = querystring.stringify(params);
        
        http.apiRequest(req.id, req.body.clientIp, API_CONFIG, params, { 'Content-Type': 'application/x-www-form-urlencoded' }, function(resAPI) {
            if (resAPI && resAPI.code === 0 && "contents" in resAPI) {
                getResultFormat(resAPI.contents, function(processPipl) {
                    cb(processPipl);
                });
            } else {
                logger.error(__filename, resAPI);
                cb({})
            }
        });
    }

}

module.exports = ApiPipl;