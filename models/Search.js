const path          = require('path');
const BASE_DIR      = path.dirname(require.main.filename);
const config 	    = require(BASE_DIR + '/Config');
const mongo 	    = require(BASE_DIR + '/libraries/MongoDriver');
const logger        = require(BASE_DIR + '/Logger');
const randomstring  = require('randomstring');
const moment        = require('moment');
const dbName        = process.env.DB_NAME;
const source        = config.SOURCE;

class SearchModel {
    static async insertSearch(bodyReq, cb) {
        let id = randomstring.generate();
        let docs = {
            "_id" : id,
            "dateCreate": moment().utcOffset(7).utc(true).toDate(),
            "userCreate": bodyReq.username,
            "collected": 0,
            "status": 1,
            "folderId": bodyReq.params.folderId,
            "caseId": bodyReq.params.caseId,
        }

        source.forEach(element => {
            docs[element] = 0;
        });

        if("keyword" in  bodyReq.params) docs["username"] = bodyReq.params.keyword;
        if("name" in  bodyReq.params) docs["name"] = bodyReq.params.name;
        if("username" in  bodyReq.params) docs["username"] = bodyReq.params.username;
        if("emailAddress" in  bodyReq.params) docs["emailAddress"] = bodyReq.params.emailAddress;
        if("msisdn" in  bodyReq.params) docs["msisdn"] = bodyReq.params.msisdn;
        if("source" in  bodyReq.params) docs["source"] = bodyReq.params.source.toLowerCase();
        
        mongo.insertData(dbName, config.COLL_SEARCH, docs, function(resInsert){ 
            if (resInsert) {
                cb(resInsert)
            } else {
                cb(false)
            }
        });
    }

    static async getSearchProgress(bodyReq, cb) {
        let agg = [];

        agg.push({
            "$match": {
                "_id": bodyReq.params.searchId
            }
        });

        agg.push({
            "$project": {
                "_id": 0,
                "searchId": "$_id",
                "collected": 1,
                "keyword": 1,
                "userCreate": 1,
                "dateCreate": 1,
                "folderId": 1,
                "caseId": 1,
            }
        });

        mongo.getAggregateData(dbName, config.COLL_SEARCH, agg, function(resAgg){
            if (resAgg && resAgg[0]) {
                cb(resAgg)
            } else {
                cb(false)
            }
        });
    }

    static async getSearchResult(bodyReq, cb) {
        let agg = [];

        let filter = {
            "searchId" : bodyReq.params.searchId
        }

        let sort = {
            "probability": -1
        }

        if("search" in bodyReq.params){
            filter["$or"] = [
                {"username": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
                {"name": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
                {"probability": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
            ];
        }

        if("filter" in bodyReq.params){
            if ("name" in bodyReq.params.filter) filter["name"] = {$regex: new RegExp('.*' + bodyReq.params.filter.name + '.*', 'i')};
            if ("username" in bodyReq.params.filter) filter["username"] = {$regex: new RegExp('.*' + bodyReq.params.filter.username + '.*', 'i')};
        }

        agg.push({
            "$match": filter
        });

        agg.push({
            "$lookup" : { 
                "from" : "search", 
                "localField" : "searchId", 
                "foreignField" : "_id", 
                "as" : "searchData"
            }
        });

        agg.push({
            "$unwind": {
                "path": "$searchData",
            }
        });

        agg.push({
            "$lookup": {
                "from": "analyzer",
                "let": {"folderId": "$searchData.folderId", "caseId": "$searchData.caseId", "userId": "$userId", "source": "$source", "userCreate": "$userCreate"},
                "pipeline": [
                    {"$match" : {"$expr" : { "$and" : [{"$eq" : ["$folderId", "$$folderId"]},{"$or":[{"$eq" : ["$caseId", "$$caseId"]},{"$eq" : ["$userCreate", "$$userCreate"]}]},{"$eq" : ["$userId", "$$userId"]},{"$eq" : ["$source", "$$source"]},{"$eq" : ["$status", 1]}]}}}, 
                    {"$limit": 1}
                ],
                "as": "analyzer"
            }
        });

        agg.push({
            "$project" : { 
                "name": 1,
                "username": 1,
                "userId": 1,
                "description": 1,
                "profilePicture": 1,
                "isVerified": 1,
                "isPrivate": 1,
                "follower": 1,
                "following": 1,
                "url": 1,
                "totalPost": 1,
                "source": 1,
                "from": 1,
                "userCreate": 1,
                "searchId": 1,
                "dateCreate": 1,
                "probability": 1,
                "analyze": {"$anyElementTrue": [ "$analyzer" ]}
            }
        });

        agg.push({
            "$sort": sort
        });

        agg.push({
            "$skip": parseInt(bodyReq.params.offset)
        });
        
        agg.push({
            "$limit": parseInt(bodyReq.params.limit)
        });

        mongo.countDataByFilter(dbName, config.COLL_SEARCH_RESULT, filter, function(resCount){ 
            mongo.getAggregateData(dbName, config.COLL_SEARCH_RESULT, agg, function(resSearch){
                if (resSearch) {
                    cb(resCount, resSearch);
                } else {
                    cb(false, false);
                }
            });
        });
    }

    static async getSearchHistory(bodyReq, cb) {
        let filter = {
            "folderId": bodyReq.params.folderId,
            "status": 1
        }
        let agg = [
            {
                "$match": filter
            }
        ];

        if (bodyReq.params.caseId === null) {
            filter["userCreate"] = bodyReq.username;
        } else {
            filter["caseId"] = bodyReq.params.caseId;
        }

        if("search" in bodyReq.params){
            filter["$or"] = [
                {"userCreate": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
                {"username": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
                {"name": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
                {"msisdn": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
                {"emailAddress": {$regex: new RegExp('.*' + bodyReq.params.search + '.*', 'i')}},
            ];
        }

        agg.push({
            "$project": {
                "_id": 0,
                "searchId": "$_id",
                "collected": 1,
                "userCreate": 1,
                "dateCreate": 1,
                "folderId": 1,
                "caseId": 1,
                "keyword": {
                    "username": "$username",   
                    "name": "$name", 
                    "msisdn": "$msisdn", 
                    "emailAddress": "$emailAddress", 
                }
            }
        });

        if ("sort" in bodyReq.params) {
            agg.push({
                "$sort": bodyReq.params.sort
            });
        }

        agg.push({
            "$skip": parseInt(bodyReq.params.offset)
        });

        agg.push({
            "$limit": parseInt(bodyReq.params.limit)
        });

        mongo.countDataByFilter(dbName, config.COLL_SEARCH, filter, function(resCount){ 
            mongo.getAggregateData(dbName, config.COLL_SEARCH, agg, function(resAgg){
                if (resAgg) {
                    cb(resCount, resAgg);
                } else {
                    cb(false, false);
                }
            });
        });
    }

    static async getSearchPendingList(filter, cb) {
        mongo.searchDataBy(dbName, config.COLL_SEARCH, filter, function(result) {
            cb(result);
        });
    }

    static async updateSearchProgress(result, data, cb) {
        var clause = {
            "_id": data._id
        }

        mongo.updateData(dbName, config.COLL_SEARCH, clause, result, function(resCount){ 
            cb();
        });
    }

    static async getProbabilityPendingList(cb) {
        let filter = {
            "collected": 99
        }

        let agg = [];

        agg.push({
            "$match": filter
        });

        agg.push({
            "$lookup": {
                "from": config.COLL_SEARCH_RESULT,
                "let": {"id": "$_id"},
                "pipeline": [
                    {"$match": {"$and": [{"$expr": {"$eq": ["$searchId", "$$id"]}}, {"probability": {"$exists": false}}, {"from": {"$exists": true}}]}}
                ],
                "as": "searchResult"
            }
        });

        // agg.push({
        //     "$match": {
        //         "searchResult.0": {"$exists": true}
        //     }
        // });

        mongo.getAggregateData(dbName, config.COLL_SEARCH, agg, function(resAgg){
            if (resAgg) {
                cb(resAgg);
            } else {
                cb(false);
            }
        });
    }

    static async probabilityDataSet(result, input, source, cb) {
        let self = this;
        let filter = {
            "_id": input._id
        }

        mongo.searchDataBy(dbName, config.COLL_SEARCH, filter, function(resSearch) {
            if (resSearch && resSearch[0]) {
                let fromDocs = {}
                fromDocs["probabilityDataSet"] = ("probabilityDataSet" in resSearch[0] ? resSearch[0].probabilityDataSet : {});
                let account = {
                    "name": (source === "instagram" ? result.fullName : result.name),
                    "username": result.username,
                    "userId": (source === "instagram" ? result._id : result.id),
                    "source": source,
                    "account": 1
                }
                
                if ("name" in input) {
                    if (`${input.name}` in fromDocs["probabilityDataSet"]) {
                        fromDocs["probabilityDataSet"][input.name].push(account);
                    } else {
                        fromDocs["probabilityDataSet"][input.name] = [account];
                    }
                } else {
                    if (`${input.username}` in fromDocs["probabilityDataSet"]) {
                        fromDocs["probabilityDataSet"][input.username].push(account);
                        account["account"] = 0;
                    } else {
                        fromDocs["probabilityDataSet"][input.username] = [account];
                    }
                }
                
                self.updateSearchProgress(fromDocs, input, function(resUpdateSearch) {
                    cb();
                })
            } else {
                cb();
            }
        });
    }

    static async updateProbabilityAccount(data, result, cb){
        mongo.updateData(dbName, config.COLL_SEARCH_RESULT, data, result, function(resCount){ 
            cb();
        });
    }
}

module.exports = SearchModel;