var Parse = function(arr){
    this.protocol = arr[2];
    this.domain = arr[3];
    this.path = arr[4];
    this.file = arr[5];
    this.query = arr[6];
};

Parse.prototype.getValue = function(key){
    try{
        return this.query.match(new RegExp("\[?&]"+key+"=([^&]*)"))[1];
        }catch(e){return "";}
};

module.exports.parse = function(url,err){
    var arr = url.match(/((https?:\/\/)([^/]+))?(\/?[^?#]*\/)?([^#?]+)(\?[^#]+)?/i);
    if(arr!=null){
        return new Parse(arr);
    }else{
        console.log(url+"not properly formed");
        err.call(this,url);
    }
};
