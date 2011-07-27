var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});
console.log(redis.print);
client.set("ABC001.12345.0", '{"creatives":[{"_id":"1","url":"/files/1.js","clk":"http://google.com"}]}', function(){});
/*
client.get("ABC001.12345.0", function(err,data){
    console.log(JSON.parse(data));
});
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    client.quit();
});
*/
module.exports.get = function(key,context,fn){
    client.get("ABC001.12345.0",function(err,data){
//        console.log(data);
//        console.log(JSON.parse(data));
        fn.call(context,JSON.parse(data));
    });
};

