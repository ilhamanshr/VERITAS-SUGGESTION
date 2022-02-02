const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const mongo 	    = require(BASE_DIR + '/libraries/MongoDriver');
const config 	    = require(BASE_DIR + '/Config');
const logger        = require(BASE_DIR + '/Logger');
const modelSearch   = require(BASE_DIR + '/models/Search');
const apiPipl       = require(BASE_DIR + '/middlewares/ApiAi');
const retryAfter    = 5000;
const dbName        = process.env.DB_NAME;

exports.doExecuteDaemon = function() {
    modelSearch.getProbabilityPendingList(function(resSearchPending) {
        if (resSearchPending && resSearchPending.length) { 
            loopUpdateSearchProbability(resSearchPending, 0, function() {
                setTimeout(function() {
                    exports.doExecuteDaemon();
                }, retryAfter);
            });
        } else {
            setTimeout(function() {
                exports.doExecuteDaemon();
            }, retryAfter);
        }
    });
}

function loopUpdateSearchProbability(data, index, cb) {
    if (index < data.length) {
        try {
            if (data[index].probabilityDataSet) {
                let params = {
                    "id": "daemon_Probability",
                    "body": {
                        "username": data[index].userCreate,
                        "clientIp": "daemon_PIPL",
                        "params": {
                            "data": data[index].probabilityDataSet
                        }
                    }
                };
                // console.log(params)
                apiPipl.getProbability(params, function(resProbability) {
                    // console.log(resProbability)
                    if (resProbability && resProbability.constructor.name == "Object") {
                        loopInput(resProbability, data[index]._id, 0, function() {
                            modelSearch.updateSearchProgress({"collected": 100}, data[index], function() {
                                loopUpdateSearchProbability(data, index + 1, function() {
                                    cb();
                                });
                            });
                        });
                    } else {
                        modelSearch.updateSearchProgress({"collected": 100}, data[index], function() {
                            loopUpdateSearchProbability(data, index + 1, function() {
                                cb();
                            });
                        });
                    }
                });
            } else {
                modelSearch.updateSearchProgress({"collected": 100}, data[index], function() {
                    loopUpdateSearchProbability(data, index + 1, function() {
                        cb();
                    });
                });
            }
        } catch (error) {
            logger.error(__filename, error);
            loopUpdateSearchProbability(data, index + 1, function() {
                cb();
            });
        }
        // let totalInput = config.PROBABILITY.length;
        // let totalOutput = data[index].from.length;
        // let probability = (totalOutput / totalInput) * 100;
        // probability = probability - (Math.floor(Math.random() * 10) + 1);
        
        // mongo.updateData(dbName, config.COLL_SEARCH_RESULT, {"_id": data[index]._id}, {"probability": probability}, function(resCount){ 
        //     loopUpdateSearchProbability(data, index + 1, function() {
        //         cb();
        //     });
        // });
    } else {
        cb();
    }
}

function loopInput(data, info, index, cb) {
    if (index < Object.keys(data).length) {
        try {
            let key = Object.keys(data)[index];
            loogOutput(data[key], info, 0, function() {
                loopInput(data, info, index + 1, function() {
                    cb();
                });
            })
        } catch (error) {
            logger.error(__filename, error);
            loopInput(data, info, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}

function loogOutput(data, info, index, cb) {
    if (index < data.length) {
        let clause = {
            "searchId": info,
            "source": data[index].source,
            "userId": data[index].userId,
        }

        let docs = {
            "probability": data[index].score
        }
        
        modelSearch.updateProbabilityAccount(clause, docs, function() {
            loogOutput(data, info, index + 1, function() {
                cb();
            });
        });
    } else {
        cb();
    }
}