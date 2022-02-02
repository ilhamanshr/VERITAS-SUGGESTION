const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const utils         = require(BASE_DIR + '/Utils');
const logger        = require(BASE_DIR + '/Logger');
const msg           = require(BASE_DIR + '/Messages');
const model         = require(BASE_DIR + '/models/Search');

class SearchController {
    static async insertSearch(req, res) {
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Search", "subAction": "insertSearch", "username": "admin", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"keyword": "ilhamanshr"} }'
        
        let response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
        let required = ["caseId", "folderId"];

        utils.checkParameter(req, res, required, function() {
            model.insertSearch(req.body, function(result) {
                if (result) {
                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["message"] = "Insert search success";
                    response["content"] = {
                        "searchId": result._id
                    };
                } else {
                    response["message"] = "Insert search failed, please contact admin";
                    response["content"] = null;
                }

                utils.setResponse(req, res, response);
            });
        });
    }

    static async getSearchProgress(req, res) {
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Search", "subAction": "getSearchProgress", "username": "sample", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"searchId": "WBhbzbUVU4HtCTQu0pV4CyWXgUPJofk1"} }'
        
        let response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
        let required = ["searchId"];

        utils.checkParameter(req, res, required, function() {
            model.getSearchProgress(req.body, function(result) {
                if (result) {
                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["message"] = "Get search progress success";
                    response["content"] = result[0];
                } else {
                    response["message"] = "Get search progress failed, please contact admin";
                    response["content"] = null;
                }

                utils.setResponse(req, res, response);
            });
        });
    }

    static async getSearchResult(req, res) {
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Search", "subAction": "getSearchResult", "username": "sample", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"searchId": "WBhbzbUVU4HtCTQu0pV4CyWXgUPJofk1"} }'
        
        let response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
        let required = ["searchId"];

        utils.checkParameter(req, res, required, function() {
            model.getSearchResult(req.body, function(count, result) {
                if (result) {
                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["message"] = "Get search result success";
                    response["content"] = {
                        "count": count,
                        "results": result
                    };
                    if(count === 0) response["message"] = "Data not available";
                } else {
                    response["message"] = "Get search result failed, please contact admin";
                    response["content"] = {
                        "count": 0,
                        "results": []
                    };
                }

                utils.setResponse(req, res, response);
            });
        });
    }

    static async getSearchHistory(req, res) {
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Search", "subAction": "getSearchHistory", "username": "sample", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"offset": 0, "limit": 10, "search": ""} }'
        
        let response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
        let required = ["offset", "limit"];

        utils.checkParameter(req, res, required, function() {
            model.getSearchHistory(req.body, function(count, result) {
                if (result) {
                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["message"] = "Get search history success";
                    response["content"] = {
                        "count": count,
                        "results": result
                    };
                    if(count === 0) response["message"] = "Data not available";
                } else {
                    response["message"] = "Get search history failed, please contact admin";
                    response["content"] = {
                        "count": 0,
                        "results": []
                    };
                }

                utils.setResponse(req, res, response);
            });
        });
    }

    static async getAccountById(req, res){
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Search", "subAction": "getAccountById", "username": "sample", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"username": "ilhamanshr", "source": "twitter"} }'
        //curl -k http://localhost:30346/api -X POST -H "Content-Type: application/json" --data-raw '{ "action": "Search", "subAction": "getAccountById", "username": "sample", "userAgent": "Sample user agent", "clientIp": "127.0.0.1", "permission": "default", "params": {"username": "ilhamanshr", "source": "instagram"} }'
        let self = this;
        let response = utils.duplicateObject(msg.ERR_BAD_GATEWAY);
        let required = ["username", "source"];

        utils.checkParameter(req, res, required, function() {

            const api = self.checkSource(req);
            api.getBasicInfo(req, function(result) {

                let model = self.checkModelSource(req);
                
                if (result) {
                    result = model.formatData(result);

                    response = utils.duplicateObject(msg.SUCCESS_RESPONSE);
                    response["message"] = "Get account info success";
                    response["content"] = result;
                } else {
                    response["message"] = "Get account info failed";
                    response["content"] = null;
                }

                utils.setResponse(req, res, response);
            });
        });
    }

    static checkSource(req) {
        let modelSource = null;

        if (req.body.params.source.toLowerCase() === "instagram") {
            modelSource = require(BASE_DIR + '/middlewares/ApiInstagram');
        } else if (req.body.params.source.toLowerCase() === "twitter") {
            modelSource = require(BASE_DIR + '/middlewares/ApiTwitter');
        }

        return modelSource;
    }

    static checkModelSource(req) {
        let modelSource = null;

        if (req.body.params.source.toLowerCase() === "instagram") {
            modelSource = require(BASE_DIR + '/models/Instagram');
        } else if (req.body.params.source.toLowerCase() === "twitter") {
            modelSource = require(BASE_DIR + '/models/Twitter');
        }

        return modelSource;
    }
}

module.exports = SearchController;