const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const logger        = require(BASE_DIR + '/Logger');
const modelSearch   = require(BASE_DIR + '/models/Search');
const retryAfter    = 5000;

exports.doExecuteDaemon = function() {
    var filter = {
        "collected": {
            "$lt": 100
        }
    }

    modelSearch.getSearchPendingList(filter, function(resSearchPending) {
        if (resSearchPending && resSearchPending.length) { 
            loopUpdateSearchResult(resSearchPending, 0, function() {
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

function loopUpdateSearchResult(data, index, cb) {
    if (index < data.length) {
        try {
            let totalTask = config.SOURCE.length;
            let totalDone = 0;

            if (data[index].instagram > 0) totalDone += 1;
            if (data[index].twitter > 0) totalDone += 1;
            // if (data[index].pipl > 0) totalDone += 1;
            if (data[index].phoneNumber > 0) totalDone += 1;
            if (data[index].email > 0) totalDone += 1;
            
            let percentage = ((totalDone / totalTask) * 100) - 1;
            percentage = percentage < 0 ? 0 : percentage;

            modelSearch.updateSearchProgress({"collected": percentage}, data[index], function() {
                loopUpdateSearchResult(data, index + 1, function() {
                    cb();
                });
            });
        } catch (error) {
            logger.error(__filename, error);
            loopUpdateSearchResult(data, index + 1, function() {
                cb();
            });
        }
    } else {
        cb();
    }
}