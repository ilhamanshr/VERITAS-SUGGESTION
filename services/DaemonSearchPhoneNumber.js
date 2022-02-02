const path                          = require('path');
const BASE_DIR                      = path.dirname(require.main.filename);
const config 	                    = require(BASE_DIR + '/Config');
const logger                        = require(BASE_DIR + '/Logger');
const utils                         = require(BASE_DIR + '/Utils');
const modelSearch                   = require(BASE_DIR + '/models/Search');
const apiPipl                       = require(BASE_DIR + '/middlewares/ApiPipl');
const ApiGetContact                 = require(BASE_DIR + '/middlewares/ApiGetContact');
const ApiSuggestionName             = require(BASE_DIR + '/middlewares/ApiAi');
const { instagramSplitParameter }   = require(BASE_DIR + '/services/DaemonSearchSocialMedia');
const { twitterSplitParameter }     = require(BASE_DIR + '/services/DaemonSearchSocialMedia');
const retryAfter                    = 5000;

exports.doExecuteDaemon = function() {
    executeSearchPhoneNumber();
}

function executeSearchPhoneNumber() {
    var filter = {
        "phoneNumber": 0
    }

    modelSearch.getSearchPendingList(filter, function(resPhoneNumberPending) {
        if (resPhoneNumberPending && resPhoneNumberPending.length) { 
            loopGetPhoneNumberResult(resPhoneNumberPending, 0, function() {
                setTimeout(function() {
                    executeSearchPhoneNumber();
                }, retryAfter);
            });
        } else {
            setTimeout(function() {
                executeSearchPhoneNumber();
            }, retryAfter);
        }
    });
}

function loopGetPhoneNumberResult(data, index, cb) {
    if(index < data.length){
        try {
            let paramsProccess = [];
            let type = data[index]; 

            if ("msisdn" in type) {
                let params = {
                    "id": "daemon_PIPL",
                    "body": {
                        "username": type.userCreate,
                        "clientIp": "daemon_PIPL",
                        "params": {
                            "msisdn": type.msisdn
                        }
                    }
                };
                
                ApiGetContact.getContactInfo(params, function name(resGetContact) {
                    if (resGetContact && "tags" in resGetContact && resGetContact.tags.length > 0) {
                        params["body"]["params"]["tags"] = resGetContact.tags;
                        ApiSuggestionName.getSuggestionName(params, function(resSuggestName) {

                            resSuggestName.forEach(element => {
                                let ind = utils.duplicateObject(type);
                                ind["type"] = "name";
                                ind["name"] = element.terms;
                                ind["from"] = "phoneNumber";
                                delete ind["username"];
                                paramsProccess.push(ind);
                            });
                            
                            instagramSplitParameter(paramsProccess, 0, 0, function(resInstagram) {
                                resInstagram = (resInstagram === 1 ? 1 : 0);
                                twitterSplitParameter(paramsProccess, 0, resInstagram, function(resTwitter) {
                                    let status = 2
                                    if (resInstagram === 1 || resTwitter === 1) status = 1
                                    modelSearch.updateSearchProgress({"phoneNumber": status}, data[index], function() {
                                        loopGetPhoneNumberResult(data, index + 1, function() {
                                            cb();
                                        });
                                    });
                                });
                            });
                        });
                    } else {
                        apiPipl.ApiPipl(params, function(resPipl) {
                            if (resPipl && "names" in resPipl && resPipl.names.length > 0) {
                                resPipl.names.forEach(element => {
                                    let ind = utils.duplicateObject(type);
                                    ind["type"] = "name";
                                    ind["name"] = element;
                                    ind["from"] = "phoneNumber";
                                    delete ind["username"];
                                    paramsProccess.push(ind);
                                });
        
                                instagramSplitParameter(paramsProccess, 0, 0, function(resInstagram) {
                                    resInstagram = (resInstagram === 1 ? 1 : 0);
                                    twitterSplitParameter(paramsProccess, 0, resInstagram, function(resTwitter) {
                                        let status = 2
                                        if (resInstagram === 1 || resTwitter === 1) status = 1
                                        modelSearch.updateSearchProgress({"phoneNumber": status}, data[index], function() {
                                            loopGetPhoneNumberResult(data, index + 1, function() {
                                                cb();
                                            });
                                        });
                                    });
                                });
                            } else {
                                modelSearch.updateSearchProgress({"phoneNumber": 2}, data[index], function() {
                                    loopGetPhoneNumberResult(data, index + 1, function() {
                                        cb();
                                    });
                                });
                            }
                        });
                    }
                });
            } else {
                modelSearch.updateSearchProgress({"phoneNumber": 2}, data[index], function() {
                    loopGetPhoneNumberResult(data, index + 1, function() {
                        cb();
                    });
                });
            }
        } catch (error) {
            logger.error(__filename, error);
            loopGetPhoneNumberResult(data, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}