const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const mongo 	    = require(BASE_DIR + '/libraries/MongoDriver');
const logger        = require(BASE_DIR + '/Logger');
const dbName        = process.env.DB_NAME;
const randomstring  = require('randomstring');
const moment        = require('moment');
const modelSearch   = require(BASE_DIR + '/models/Search');

class InstagramModel {
    static async insertBasicInfo(result, data, cb) {
        
        let docs = this.formatData(result);

        docs["from"] = [data.from];
        docs["_id"] = randomstring.generate();
        docs["userCreate"] = data.userCreate;
        docs["searchId"] = data._id;
        docs["dateCreate"] = moment().utcOffset(7).utc(true).toDate();

        let filter = {
            "searchId": docs["searchId"],
            "source": docs["source"],
            "userId": docs["userId"]
        }

        modelSearch.probabilityDataSet(result, data, "instagram", function() {
            mongo.searchDataBy(dbName, config.COLL_SEARCH_RESULT, filter, function(resDuplicate){
                if (resDuplicate && resDuplicate.length > 0) {
                    let fromDocs = ("from" in resDuplicate[0] ? resDuplicate[0].from : []);
                    fromDocs.push(data.from);
                    let unique = fromDocs.filter((v, i, a) => a.indexOf(v) === i);

                    mongo.updateData(dbName, config.COLL_SEARCH_RESULT, filter, {"from": unique}, function(resDuplicate){
                        cb();
                    });
                } else {
                    mongo.insertData(dbName, config.COLL_SEARCH_RESULT, docs, function(resInsert){ 
                        cb();
                    });
                }
            });
        }); 
    }

    static formatData(data) {
        let result = {
            "name" : data.fullName,
            "username" : data.username,
            "userId" : data._id,
            "description" : ("biography" in data ? data.biography : "N/A"),
            "profilePicture" : data.profilePic,
            "isVerified": data.isVerified,
            "isPrivate": data.isPrivate,
            "follower": ("followerCount" in data ? data.followerCount : "N/A"),
            "following": ("followingCount" in data ? data.followingCount : "N/A"),
            "url": ("externalUrl" in data ? data.externalUrl : "N/A"),
            "totalPost": ("postCount" in data ? data.postCount : "N/A"),
            "source": "instagram",
        }

        return result;
    }
}

module.exports = InstagramModel;