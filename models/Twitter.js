const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const mongo 	    = require(BASE_DIR + '/libraries/MongoDriver');
const logger        = require(BASE_DIR + '/Logger');
const dbName        = process.env.DB_NAME;
const randomstring  = require('randomstring');
const moment        = require('moment');
const modelSearch   = require(BASE_DIR + '/models/Search');

class TwitterModel{
    static async insertBasicInfo(result, data, cb) {
        if ("id" in result) {
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
            
            modelSearch.probabilityDataSet(result, data, "twitter", function() {
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
        } else {
            cb();
        }
    }

    static formatData(data) {
        let result = {
            "name" : ("name" in  data && data.name ? data.name : ""),
            "username" : data.username,
            "userId" : data.id,
            "description" : data.description,
            "profilePicture" : data.profile_image_url,
            "isVerified": (data.verified ? data.verified : false),
            "isPrivate": (data.protected ? data.protected : false),
            "follower": data.followers_count,
            "following": data.followings_count,
            "url": data.url,
            "totalPost": data.tweet_count,
            "source": "twitter"
        }

        return result;
    }
}

module.exports = TwitterModel;