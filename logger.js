var fs = require('fs');

function Logger(name){
    this.ws = fs.createWriteStream(name,{flags:'a',encoding:null,mode:0666});
    this.data = [];
}

Logger.prototype.endDay(newFile){
    this.ws.end(data.join("\n"));
    this.ws = fs.createWriteStream(newFile,{flags:'w',encoding:null,mode:0666});
    this.data = [];
}

Logger.prototype.write(d){
    this.data.push(d);
    if(data.length>=1000){
        data = [];
        this.ws.write(this.data.join("\n"));
    }
}

module.exports.Logger = Logger;
