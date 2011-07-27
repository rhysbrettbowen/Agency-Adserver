var http   = require('http')
   ,fs     = require('fs')
   ,util   = require('util')
   ,cook   = require('./parse_cookie')
   ,redis  = require('redis')
   ,dat    = require('./today')
   ,log    = require('./logger').Logger
   ,pars   = require('./parse_url');

    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});



var now = dat.getToday();

var logs = new log("/tmp/"+now+".txt");

client.set("ABC001.12345.0", '{"creatives":[{"_id":"1","url":"/files/1.js","clk":"http://google.com"}]}', redis.print);
console.log(dat.get());

dat.on("change",function(today){now = today;logs.endDay("/tmp/"+now+".txt");});
dat.start();

http.createServer(function(req,res){

    var response = function(header,body){
        if(header)res.writeHead(302, header);
        if(body)res.write(body);
        res.end();
    };

    var cookie = req.headers.cookie||"";
    if(req.url.indexOf('/files/')==0){
       util.pump(fs.createReadStream(__dirname+'/files'+req.url.substring(req.url.lastIndexOf('/'))),res);
    }else{
        var parsed = pars.parse(req.url);
        if(parsed.file=='ag.js'){
            cc = parsed.getValue("cc");
           
            client.get(cc,function(err,data){
                var data=JSON.parse(data);
                creative = data.creatives[Math.floor(data.creatives.length*Math.random())];
                args = cc.split(".");
                args.push(creative["_id"],now,cookie);
                future = new Date();
                future.setDate(future.getDate()+90);
                resHead = {
                    'Set-Cookie' : cook.add.apply(this,args)+"; Expires="+future.toUTCString()+"; Domain=."+req.headers.host+"; Path=/;",
                    'Location'   : creative.url
                };
                logs.write(args);
                response(resHead);
            });
        }
        else if(parsed.file=='click.js'){
            cc = parsed.getValue("cc");
            client.get(cc,function(err,data){
                var creative = 0;
                var data = JSON.parse(data);
                var cid = getVal(cc.split(".")[0],"pctc",cookie);
                for(m=data.creative.length-1;m>=0;m--){
                    if(data.creative[m]["_id"]==cid){
                        creative = data.creative[m];
                    }
                }
                args = cc.split(".");
                args.push(creative["_id"],now,cookie);
                resHead = {
                    'Set-Cookie' : cook.addClick.apply(this,args)+"; Expires="+future.toUTCString()+"; Domain=."+req.headers.host+"; Path=/;",
                    'Location' : creative["clk"]
                };
                response(resHead);
            });
        }
    }
}).listen(4000);
