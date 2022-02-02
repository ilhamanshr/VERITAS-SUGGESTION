const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const utils         = require(BASE_DIR + '/Utils');
const logger        = require(BASE_DIR + '/Logger');
const msg           = require(BASE_DIR + '/Messages');

class MediaController{
    static async getProfilePicture(req, res) {
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Media", "subAction": "getProfilePicture", "username": "admin", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"mediaId": "466551933", "source": "instagram"} }'
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Media", "subAction": "getProfilePicture", "username": "admin", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"mediaId": "profile_images_312634867.jpeg", "source": "twitter"} }'
        
        let response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
        let required = [];

        utils.checkParameter(req, res, required, function() {
            let source = req.body.params.source.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());
            const middleware = require(BASE_DIR + '/middlewares/Api' + source);


            middleware.getProfilePicture(req, function(result) {
                if (result) {
                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["message"] = "Get profile picture success";
                    response["content"] = {
                        "mimetype": result.mimeType,
                        "base64": result.data
                    };
                } else {
                    response["message"] = "Get profile picture failed";
                    response["content"] = null;
                }

                utils.setResponse(req, res, response);
            });
        });
    }
}

module.exports = MediaController;
