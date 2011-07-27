var FDCookie = function(obj){
    this.fpt = [0];
    for(i in obj){
        this[i] = obj[i];
    }
};

FDCookie.prototype.getValue = function(key){
    return this[key];
};

FDCookie.prototype.getString = function(){
    var obj = {};
    for(i in this){
        if(typeof(i)!='function' && i != 'name')
            obj[i] = this[i];
    }
    return JSON.stringify(obj);
};

FDCookie.prototype.copy = function(obj){
    for(i in obj){
        this[i] = obj[i];
    }
    return this;
};

FDCookie.prototype.getAndSet = function(key,fn){
    this[key] = fn.call(this,this[key]);
};

var genParse = function(sep){
    return function(cook){
        var c = new Cookie(cook);
        if(cook=="")
            return c;
        var temp = cook.split(new RegExp(sep+" *"));
        var tlen = temp.length;
        for(var i = 0; i < tlen; i++){
            split = temp[i].split("=");
            if(split.length>1){
                c[split.shift()]=split.join("=");
            }else{
                c[split[0]]=null;
            }
        }
        return c;
    };
};

var genStringify = function(sep){
    return function(obj){
        var str = '';
        for(i in obj){
            if(obj.hasOwnProperty(i)&&typeof(obj[i])!='function'){
                str += i+"="+obj[i]+sep;
            }
        }
    };
};

var getCookie = function(code,cookie){
    var ret = cookie.split(";");
    for(n = ret.length-1;n>=0;n--){
        if(ret[n].match(new RegExp("^FD"+code+"\\s?="))){
            console.log(ret[n]);
            console.log(ret[n].substring(ret[n].indexOf("{")));
            return JSON.parse(ret[n].substring(ret[n].indexOf("{")));
        }
    }
};

module.exports.parse = genParse(";");
module.exports.stringify = genStringify(";");
//module.exports.parseFD = genParse("&");
//module.exports.stringifyFD = genStringify("&");

module.exports.add = function(camp,loc,n,creat,date,cook){
    var ret = [];
    var cookie = new FDCookie(getCookie(camp,cook));
    cookie.getAndSet("pctm",function(val){return val?""+(val*1+1):"1";});
    cookie.getAndSet("date",function(val){return date;});
    cookie.getAndSet("FQ",function(val){return val?(this.fpt[this.fpt.length-1]==loc?""+(val*1+1):"1"):"1";});
    cookie.getAndSet("fpt",function(val){
        for(n=val.length-1;n>=0;n--){
            if(val[n]==loc)
                val = val.splice(n,1);
        }
        val.push(loc);
        return val;
    });
    cookie.getAndSet("FL"+loc,function(val){return val?""+(val*1+1):"1";});
    cookie.getAndSet("FM"+creat,function(val){return val?""+(val*1+1):"1";});
    cookie.getAndSet("pctc",function(val){return creat;});
    ret.push("FD",camp,"=",cookie.getString());
//    console.log(ret);
    return ret.join("");
};
module.exports.getVal = function(camp,key,cook){
    var cookie = new FDCookie(getCookie(camp,cook));
    return cookie.getValue(key);
};
module.exports.addClick = function(camp,loc,n,creat,date,cook){
    var ret = [];
    var cookie = new FDCookie(getCookie(camp,cook));
    cookie.getAndSet("pctcrt",function(val){return val?""+(val*1+1):"1";});
    cookie.getAndSet("pdc",function(val){return date;});
    cookie.getAndSet("pctl",function(val){return loc});
    ret.push("FD",camp,"=",cookie.getString());
    return ret.join("");
};
