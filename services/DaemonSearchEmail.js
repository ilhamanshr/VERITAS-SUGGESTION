const path                          = require('path');
const BASE_DIR                      = path.dirname(require.main.filename);
const config 	                    = require(BASE_DIR + '/Config');
const logger                        = require(BASE_DIR + '/Logger');
const utils                         = require(BASE_DIR + '/Utils');
const modelSearch                   = require(BASE_DIR + '/models/Search');
const apiPipl                       = require(BASE_DIR + '/middlewares/ApiPipl');
const { piplSplitParameter }        = require(BASE_DIR + '/services/DaemonSearchPipl');
const { instagramSplitParameter }   = require(BASE_DIR + '/services/DaemonSearchSocialMedia');
const { twitterSplitParameter }     = require(BASE_DIR + '/services/DaemonSearchSocialMedia');
const retryAfter                    = 5000;

exports.doExecuteDaemon = function() {
    executeSearchEmail();
}

function executeSearchEmail() {
    var filter = {
        "email": 0
    }

    modelSearch.getSearchPendingList(filter, function(resPhoneNumberPending) {
        if (resPhoneNumberPending && resPhoneNumberPending.length) { 
            loopGetEmailResult(resPhoneNumberPending, 0, function() {
                setTimeout(function() {
                    executeSearchEmail();
                }, retryAfter);
            });
        } else {
            setTimeout(function() {
                executeSearchEmail();
            }, retryAfter);
        }
    });
}

function loopGetEmailResult(data, index, cb) {
    if(index < data.length){
        try {
            let type = data[index]; 

            if ("emailAddress" in type) {
                let params = {
                    "id": "daemon_PIPL",
                    "body": {
                        "username": type.userCreate,
                        "clientIp": "daemon_PIPL",
                        "params": {
                            "email": type.emailAddress
                        }
                    }
                };
                
                apiPipl.ApiPipl(params, function(resPipl) {
                    if (resPipl && "userIds" in resPipl) {
                        type["from"] = "email";
                        piplSplitParameter(resPipl.userIds, type, 0, 0, function(resSplit) {
                            resSplit = (resSplit === 1 ? 1 : 0);
                            if ("names" in resPipl && resPipl.names.length > 0) {
                                let paramsProccess = [];

                                resPipl.names.forEach(element => {
                                    let ind = utils.duplicateObject(type);
                                    ind["type"] = "name";
                                    ind["name"] = element;
                                    ind["from"] = "email";
                                    delete ind["username"];
                                    paramsProccess.push(ind);
                                });
                                
                                instagramSplitParameter(paramsProccess, 0, resSplit, function(resInstagram) {
                                    resInstagram = (resInstagram === 1 ? 1 : 0);
                                    twitterSplitParameter(paramsProccess, 0, resInstagram, function(resTwitter) {
                                        let status = 2
                                        if (resInstagram === 1 || resTwitter === 1) status = 1
                                        modelSearch.updateSearchProgress({"email": status}, data[index], function() {
                                            loopGetEmailResult(data, index + 1, function() {
                                                cb();
                                            });
                                        });
                                    });
                                });
                            } else {
                                modelSearch.updateSearchProgress({"email": 2}, data[index], function() {
                                    loopGetEmailResult(data, index + 1, function() {
                                        cb();
                                    });
                                });
                            }
                        });
                    } else {
                        modelSearch.updateSearchProgress({"email": 2}, data[index], function() {
                            loopGetEmailResult(data, index + 1, function() {
                                cb();
                            });
                        });
                    }
                });
            } else {
                modelSearch.updateSearchProgress({"email": 2}, data[index], function() {
                    loopGetEmailResult(data, index + 1, function() {
                        cb();
                    });
                });
            }
        } catch (error) {
            logger.error(__filename, error);
            loopGetEmailResult(data, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}