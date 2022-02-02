/*
|--------------------------------------------------------------------------
| Application Configuration
|--------------------------------------------------------------------------
*/

exports.APP_SSL             = false;
exports.APP_PORT            = 30346;

exports.APP_NAME            = "VERITAS SUGGESTION";
exports.APP_DESCRIPTION     = "";
exports.APP_AUTHOR          = "";
exports.APP_LOGO            = "";
exports.APP_ICON            = "";
exports.APP_ID              = exports.APP_NAME.split(" ").join("_") + "_" + exports.APP_PORT;

exports.SOURCE = ["twitter", "instagram", /*"pipl",*/ "phoneNumber", "email"];
exports.SOURCE_DATA = ["twitter", "instagram"];
exports.PROBABILITY = ["username", "name", "phoneNumber", "email"];

/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
*/

exports.DB = [{
    "DRIVER": process.env.DB_DRIVER,
    "CONNECTION": process.env.DB_CONNECTION,
    "NAME": process.env.DB_NAME,
}];

exports.COLL_SEARCH = process.env.COLL_SEARCH;
exports.COLL_SEARCH_RESULT = process.env.COLL_SEARCH_RESULT;

/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
*/

exports.API_PIPL = {
    API_SSL 		   : true,
    API_USERNAME       : process.env.PIPL_USERNAME,
    API_PASSWORD       : process.env.PIPL_PASSWORD,
    API_HOST           : process.env.PIPL_HOST,
    API_METHOD		   : "POST",
    API_PATH           : process.env.PIPL_PATH,
    API_PORT           : process.env.PIPL_PORT,
    API_CONTENT_TYPE   : "application/x-www-form-urlencoded",
    API_TIMEOUT        : 600000
};

exports.API_TWITTER = {
    API_SSL 		   : false,
    API_HOST           : process.env.TWITTER_HOST,
    API_METHOD		   : "GET",
    // API_PATH           : process.env.TWITTER_PATH,
    API_PORT           : process.env.TWITTER_PORT,
    API_TIMEOUT        : 600000
};

exports.API_INSTAGRAM = {
    API_SSL 		   : true,
    API_HOST           : process.env.INSTAGRAM_HOST,
    API_METHOD		   : "POST",
    API_USERNAME       : process.env.INSTAGRAM_USERNAME,
    API_PASSWORD       : process.env.INSTAGRAM_PASSWORD,
    API_PATH           : process.env.INSTAGRAM_PATH,
    API_PORT           : process.env.INSTAGRAM_PORT,
    API_TIMEOUT        : 600000
    // curl -vk -XPOST -u"mki:123" "https://localhost:14041/api-cgi/" -H "Content-type:application/json" -d '{"action":"Crawler", "subAction":"searchAccount", "body":{"search":"farizstuff"}}'
};

exports.API_GET_CONTACT = {
    API_SSL 		   : true,
    API_HOST           : process.env.GET_CONTACT_HOST,
    API_METHOD		   : "POST",
    API_USERNAME       : process.env.GET_CONTACT_USERNAME,
    API_PASSWORD       : process.env.GET_CONTACT_PASSWORD,
    API_PATH           : process.env.GET_CONTACT_PATH,
    API_PORT           : process.env.GET_CONTACT_PORT,
    API_TIMEOUT        : 600000
};
// curl -vk https://sg1-apig.urilist.xyz:8043/api/socmed/check/getcontact -u mkidev:fs4H76g8fnXy3Y8C -d "key=kDA8ZbZhC6znsTcLmYMMRvWmTqQCC4E7&username=ilham&account=628111719692"

exports.API_AI = {
    API_SSL      : true,
    API_HOST     : process.env.API_AI_HOST,
    API_PORT     : process.env.API_AI_PORT,
    API_PATH     : process.env.API_AI_PATH,
    API_USERNAME : process.env.API_AI_USERNAME,
    API_PASSWORD : process.env.API_AI_PASSWORD,
    API_METHOD   : "POST",
    API_TIMEOUT  : 600000
}