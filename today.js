var util = require('util'),
    events = require('events');

var dayMilli = 86400000;

var today = function(){
    this.now = Math.floor((new Date()).getTime()/dayMilli)+25569;
    events.EventEmitter.call(this);
};

util.inherits(today,events.EventEmitter);

today.prototype.set = function(a){this.now=a; return a;};
today.prototype.get = function(){return this.now;};
today.prototype.getToday = function(){return Math.floor((new Date()).getTime()/dayMilli)+25569;};
today.prototype.getMilliLeft = function(a){return (a-25569)*dayMilli - (new Date()).getTime();};
today.prototype.run = function(){
    var that = this;
    var nextTime = this.getMilliLeft(this.now+1);
//    console.log(nextTime);
    if(nextTime<=0){
        this.emit("change",this.set(this.getToday()));
        nextTime = this.getMilliLeft(this.now+1);
    }
    setTimeout(function(){that.run()},nextTime);
};
today.prototype.start = function(){
//console.log(this.getMilliLeft(this.get()+1));
var that=this;setTimeout(function(){that.run();},this.getMilliLeft(this.get()+1));};

module.exports = new today();

//dat = new today();
//console.log(dat.getToday());
//dat.on("change",function(tod){console.log(tod)});
//dat.start();

