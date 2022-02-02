const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const mongo 	    = require(BASE_DIR + '/libraries/MongoDriver');
const logger        = require(BASE_DIR + '/Logger');
const sourceData    = config.SOURCE_DATA;

class PiplModel {

    static async getResultFormat(data, cb) {
        var resultPIPL = {
            "userIds": [],
            "names": []
        };

        // =============== Id to Socmed ================
        // Facebook : https://www.facebook.com/profile.php?id=
        // =============================================
        
        try {
            if(data.constructor.name == "Array"){
                if (data) {
                    data.forEach(element => {
                        element.userIds.forEach(item => {
                            if(item.content != ""){
                                let idSplit = item.content.split("@")
                                let id  = idSplit[0];
                                let source = idSplit[1];

                                if (sourceData.includes(source.toLowerCase())) resultPIPL.userIds.push({"id": id, "source": source});
                            }
                        });

                        element.names.forEach(item => {
                            if(item.display != ""){
                                resultPIPL.names.push(item.display);
                            }
                        });
                    });
                    
                    resultPIPL.userIds = [...new Set(resultPIPL.userIds)];
                    resultPIPL.names = [...new Set(resultPIPL.names)];

                    cb(resultPIPL);
                } else {
                    cb({});
                }
            } else if (data.constructor.name == "Object") {
                if (data) {
                    data.userIds.forEach(element => {
                        if(element.content != ""){
                            let idSplit = element.content.split("@")
                            let id  = idSplit[0];
                            let source = idSplit[1];

                            if (sourceData.includes(source.toLowerCase())) resultPIPL.userIds.push({"id": id, "source": source});
                        }
                    });
                    
                    data.names.forEach(element => {
                        if(element.display != ""){
                            resultPIPL.names.push(element.display);
                        }
                    });

                    resultPIPL.userIds = [...new Set(resultPIPL.userIds)];
                    resultPIPL.names = [...new Set(resultPIPL.names)];
                    
                    cb(resultPIPL);
                } else {
                    cb({});
                }
            } else {
                cb({});
            }
        } catch (error) {
            logger.error(__filename, error);
        }
    }
}

module.exports = PiplModel;