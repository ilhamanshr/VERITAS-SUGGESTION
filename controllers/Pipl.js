const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const utils         = require(BASE_DIR + '/Utils');
const logger        = require(BASE_DIR + '/Logger');
const msg           = require(BASE_DIR + '/Messages');
const { ApiPipl }   = require(BASE_DIR + '/middlewares/ApiPipl');

class PiplController {
    
    static async suggestAccount(req, res) {
        //curl -k https://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Pipl", "subAction": "suggestAccount", "username": "sample", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"msisdn": "628111535595"} }'
        
        let response = utils.duplicateObject(msg.ERR_RESPONSE);
        let required = [];

        utils.checkParameter(req, res, required, function() {
            response = utils.duplicateObject(msg.SUCCESS_RESPONSE);

            ApiPipl(req, function(result) {
                response["message"] = "Get suggest account success";
                response["content"] = result;

                if (Object.keys(result).length === 0) response["message"] = "Get suggest account not available";

                utils.setResponse(req, res, response);
            });
        });
    }

}

module.exports = PiplController;