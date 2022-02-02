const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const logger        = require(BASE_DIR + '/Logger');
const utils         = require(BASE_DIR + '/Utils');
const modelPipl     = require(BASE_DIR + '/models/Pipl');
const modelSearch   = require(BASE_DIR + '/models/Search');
const apiPipl       = require(BASE_DIR + '/middlewares/ApiPipl');
const retryAfter    = 5000;

exports.doExecuteDaemon = function() {
    // executeSearchPipl();
}

function executeSearchPipl() {
    var filter = {
        "pipl": 0
    }

    modelSearch.getSearchPendingList(filter, function(resPhoneNumberPending) {
        if (resPhoneNumberPending && resPhoneNumberPending.length) { 
            loopGetPiplResult(resPhoneNumberPending, 0, function() {
                setTimeout(function() {
                    executeSearchPipl();
                }, retryAfter);
            });
        } else {
            setTimeout(function() {
                executeSearchPipl();
            }, retryAfter);
        }
    });
}

function loopGetPiplResult(data, index, cb) {
    if(index < data.length){
        try {
            let paramsProccess = [];
            let type = data[index]; 

            if ("name" in type) {
                let params = {
                    "id": "daemon_PIPL",
                    "body": {
                        "username": type.userCreate,
                        "clientIp": "daemon_PIPL",
                        "params": {
                            "name": type.name
                        }
                    }
                };
                
                apiPipl.ApiPipl(params, function(resPipl) {
                    if (resPipl && "userIds" in resPipl) {
                        type["from"] = "name";
                        exports.piplSplitParameter(resPipl.userIds, type, 0, 0, function(resSplit) {
                            modelSearch.updateSearchProgress({"pipl": resSplit}, data[index], function() {
                                loopGetPiplResult(data, index + 1, function() {
                                    cb();
                                });
                            });
                        });
                    } else {
                        modelSearch.updateSearchProgress({"pipl": 2}, data[index], function() {
                            loopGetPiplResult(data, index + 1, function() {
                                cb();
                            });
                        });
                    }
                });
            } else {
                modelSearch.updateSearchProgress({"pipl": 2}, data[index], function() {
                    loopGetPiplResult(data, index + 1, function() {
                        cb();
                    });
                });
            }
        } catch (error) {
            logger.error(__filename, error);
            loopGetPiplResult(data, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}

exports.piplSplitParameter = function(data, info, index, result, cb) {
    if (index < data.length) {
        try {
            let apiSource = null;
            let modelSource = null
            let params = {
                "id": "daemon_PIPL",
                "body": {
                    "clientIp": "daemon_PIPL",
                    "params": {
                        "id": data[index].id
                    }
                }
            }

            if (data[index].source == "twitter") {
                apiSource = require(BASE_DIR + '/middlewares/ApiTwitter');
                modelSource = require(BASE_DIR + '/models/Twitter');
            } 
            if (data[index].source == "instagram") {
                apiSource = require(BASE_DIR + '/middlewares/ApiInstagram');
                modelSource = require(BASE_DIR + '/models/Instagram');
            }
            
            apiSource.getBasicInfo(params, function(resApiSource) {
                if (resApiSource) {
                    modelSource.insertBasicInfo(resApiSource, info, function() {
                        exports.piplSplitParameter(data, info, index + 1, result + 1, function(resLoop) {
                            cb(resLoop);
                        });
                    });
                } else {
                    exports.piplSplitParameter(data, info, index + 1, result, function(resLoop) {
                        cb(resLoop);
                    });
                }
            });
        } catch (error) {
            logger.error(__filename, error);
            exports.piplSplitParameter(data, info, index + 1, result, function(resLoop) {
                cb(resLoop);
            });
        }
    } else {
        if (result > 0) {
            result = 1
        } else {
            result = 2
        }
        cb(result);
    }
}