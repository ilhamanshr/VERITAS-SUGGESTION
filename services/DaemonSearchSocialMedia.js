const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const logger        = require(BASE_DIR + '/Logger');
const modelIG       = require(BASE_DIR + '/models/Instagram');
const utils         = require(BASE_DIR + '/Utils');
const modelTW       = require(BASE_DIR + '/models/Twitter');
const modelSearch   = require(BASE_DIR + '/models/Search');
const apiIG         = require(BASE_DIR + '/middlewares/ApiInstagram');
const apiTW         = require(BASE_DIR + '/middlewares/ApiTwitter');
const retryAfter    = 5000;

exports.doExecuteDaemon = function() {
    executeTwitterSearch();
    executeIntagramSearch();
}

function executeTwitterSearch() {
    var filter = {
        "twitter": 0,
    }

    modelSearch.getSearchPendingList(filter, function(resTWPending) {
        if (resTWPending && resTWPending.length) { 
            loopGetTwitterResult(resTWPending, 0, function() {
                setTimeout(function() {
                    executeTwitterSearch();
                }, retryAfter);
            });
        } else {
            setTimeout(function() {
                executeTwitterSearch();
            }, retryAfter);
        }
    });
}

function executeIntagramSearch() {
    var filter = {
        "instagram": 0,
    }
    
    modelSearch.getSearchPendingList(filter, function(resIGPending) {
        if (resIGPending && resIGPending.length) { 
            loopGetInstagramResult(resIGPending, 0, function() {
                setTimeout(function() {
                    executeIntagramSearch();
                }, retryAfter);
            });
        } else {
            setTimeout(function() {
                executeIntagramSearch();
            }, retryAfter);
        }
    });
}

function loopGetTwitterResult(data, index, cb) {
    if(index < data.length){
        try {
            let paramsProccess = [];
            let type = data[index];
            
            if ("name" in type || (("username" in type && (!type.hasOwnProperty("source") || type.source === "")) || ("username" in type && "source" in type && type.source == "twitter"))) {
                
                if ("name" in type) {
                    let ind = utils.duplicateObject(type);
                    ind["type"] = "name";
                    ind["from"] = "name";
                    delete ind["username"];
                    paramsProccess.push(ind);
                }
    
                if ("username" in type) {
                    let ind = utils.duplicateObject(type); 
                    ind["type"] = "username"; 
                    ind["from"] = "username";
                    delete ind["name"];
                    paramsProccess.push(ind);
                }
                
                exports.twitterSplitParameter(paramsProccess, 0, 0, function(resultSummary) {
                    modelSearch.updateSearchProgress({"twitter": resultSummary}, data[index], function() {
                        loopGetTwitterResult(data, index + 1, function() {
                            cb();
                        });
                    });
                });
            } else {
                modelSearch.updateSearchProgress({"twitter": 2}, data[index], function() {
                    loopGetTwitterResult(data, index + 1, function() {
                        cb();
                    });
                });
            }
        } catch (error) {
            logger.error(__filename, error);
            loopGetTwitterResult(data, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}

exports.twitterSplitParameter = function(data, index, result, cb) {
    if(index < data.length) {
        try {
            let params = {
                "id": "daemon_TW",
                "body": {
                    "clientIp": "daemon_TW",
                    "params": {}
                }
            }
            
            if (data[index].type == "username") params["body"]["params"]["username"] = data[index].username;
            if (data[index].type == "name") params["body"]["params"]["name"] = data[index].name;
            console.log(params)
            apiTW.getBasicInfo(params, function(resTwitter) {
                console.log(resTwitter)
                if (resTwitter) {
                    if (resTwitter.constructor.name == "Array") {
                        twitterBulkResult(resTwitter, data[index], 0, function() {
                            exports.twitterSplitParameter(data, index + 1, result + 1, function(resLoop) {
                                cb(resLoop);
                            });
                        });
                    } else {
                        modelTW.insertBasicInfo(resTwitter, data[index], function() {
                            exports.twitterSplitParameter(data, index + 1, result + 1, function(resLoop) {
                                cb(resLoop);
                            });
                        });
                    }
                } else {
                    exports.twitterSplitParameter(data, index + 1, result, function(resLoop) {
                        cb(resLoop);
                    });
                }
            });
        } catch (error) {
            logger.error(__filename, error);
            exports.twitterSplitParameter(data, index + 1, result, function(resLoop) {
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

function twitterBulkResult(data, info, index, cb) {
    if (index < data.length) {
        try {
            modelTW.insertBasicInfo(data[index], info, function() {
                twitterBulkResult(data, info, index + 1, function() {
                    cb();
                });
            });
        } catch (error) {
            logger.error(__filename, error);
            twitterBulkResult(data, info, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}

function loopGetInstagramResult(data, index, cb) {
    if(index < data.length){
        try {
            let paramsProccess = [];
            let type = data[index]; 
            
            if ("name" in type || (("username" in type && (!type.hasOwnProperty("source") || type.source === "")) || ("username" in type && "source" in type && type.source == "instagram"))) {

                if ("name" in type) {
                    let ind = utils.duplicateObject(type);
                    ind["type"] = "name";
                    ind["from"] = "name";
                    delete ind["username"];
                    paramsProccess.push(ind);
                }
    
                if ("username" in type) {
                    let ind = utils.duplicateObject(type); 
                    ind["type"] = "username"; 
                    ind["from"] = "username";
                    delete ind["name"];
                    paramsProccess.push(ind);
                }
    
                exports.instagramSplitParameter(paramsProccess, 0, 0, function(resultSummary) {
                    modelSearch.updateSearchProgress({"instagram": resultSummary}, data[index], function() {
                        loopGetInstagramResult(data, index + 1, function() {
                            cb();
                        });
                    });
                });
            } else {
                modelSearch.updateSearchProgress({"instagram": 2}, data[index], function() {
                    loopGetInstagramResult(data, index + 1, function() {
                        cb();
                    });
                });
            }
        } catch (error) {
            logger.error(__filename, error);
            loopGetInstagramResult(data, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}

exports.instagramSplitParameter = function(data, index, result, cb) {
    if (index < data.length) {
        try {
            let params = {
                "id": "daemon_IG",
                "body": {
                    "clientIp": "daemon_IG",
                    "params": {}
                }
            }
            
            if (data[index].type == "name") params["body"]["params"]["name"] = data[index].name;
            if (data[index].type == "username") params["body"]["params"]["username"] = data[index].username;
            console.log(params)
            apiIG.getBasicInfo(params, function(resInstagram) {
                console.log(resInstagram)
                if (resInstagram) {
                    if (resInstagram.constructor.name == "Array") {
                        instagramBulkResult(resInstagram, data[index], 0, function() {
                            exports.instagramSplitParameter(data, index + 1, result + 1, function(resLoop) {
                                cb(resLoop);
                            });
                        });
                    } else {
                        modelIG.insertBasicInfo(resInstagram, data[index], function() {
                            exports.instagramSplitParameter(data, index + 1, result + 1, function(resLoop) {
                                cb(resLoop);
                            });
                        });
                    }
                } else {
                    exports.instagramSplitParameter(data, index + 1, result, function(resLoop) {
                        cb(resLoop);
                    });
                }
            });
        } catch (error) {
            logger.error(__filename, error);
            exports.instagramSplitParameter(data, index + 1, result, function(resLoop) {
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

function instagramBulkResult(data, info, index, cb) {
    if (index < data.length) {
        try {
            let params = {
                "id": "daemon_IG",
                "body": {
                    "clientIp": "daemon_IG",
                    "params": {
                        "username": data[index].username
                    }
                }
            }

            apiIG.getBasicInfo(params, function(resInstagram) {
                if (resInstagram) {
                    modelIG.insertBasicInfo(resInstagram, info, function() {
                        instagramBulkResult(data, info, index + 1, function() {
                            cb();
                        });
                    });
                } else {
                    instagramBulkResult(data, info, index + 1, function() {
                        cb();
                    });
                }
            });
        } catch (error) {
            logger.error(__filename, error);
            instagramBulkResult(data, info, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}