var tcp = require("net");
var sys = require("util");

function Client()
{
    var self = this;
    this.socket = tcp.createConnection(11211);
    this.socket.setEncoding("binary");
    this.socket.setTimeout(0);
    this.socket.addListener("receive", function(data) { self.receive(data); } ); // dispatches receive to first command in the queue
    this.socket.addListener("connect", function() { self.process_next(); } );    // we may have commands in the queue before the connection is opened
    this.buffer = "";
    this.queue = []; // todo: js array.unshift is O(N) ( or worse? )
    this.expected_length = 0;
}

Client.prototype.process_next = function()
{
    if (this.socket.readyState != "open")
        return;

    if (this.job && !this.job.finished)
        return;
    if (this.queue.length == 0)
        return;
    // Array.shift is very slow!
    this.job = this.queue.shift();
    this.job.client = this;
    this.job.process();
}

Client.prototype.push = function(cmd)
{
    this.queue.push(cmd);
    this.process_next();
}

incrementCmd = function(name,key,value,onFinished)
{
    this.key = key;
    this.name = name;
    this.value = value;
    this.onFinished = onFinished;
}

incrementCmd.prototype.process = function()
{
    this.client.socket.write(this.name + " " + this.key + " " + this.value + "\r\n");
}

incrementCmd.prototype.receive = function(line)
{
    this.onFinished && this.onFinished(line);
    this.finished = true;
    this.client.process_next();
}

setCmd = function(name,key,value,flag,exptime,onStored,cas)
{
    this.name = name;
    this.key = key;
    this.value = value;
    this.flag = flag;
    this.exptime = exptime;
    this.onStored = onStored;
    this.cas = cas;
}

setCmd.prototype.process = function()
{
    var cas = "";
    if (this.name == cas)
        cas += " " + this.cas;
    if (this.name != "cas")
        this.client.socket.write(this.name + " " + this.key +  " " + this.flag + " " + this.exptime + " " + this.value.length + cas + "\r\n" + this.value + "\r\n");
}

setCmd.prototype.promise = function()
{
    var p = new process.Promise();
    var cb = this.onStore;
    this.onStored = function(data) 
    {   
        cb(data);
        p.emitSuccess(data);
    }
    return p;
}

setCmd.prototype.receive = function(data)
{
    this.onStored && this.onStored(data);
    this.finished = true;
    this.client.process_next();
}

closeCmd = function()
{
    this.name = "close";
}

closeCmd.prototype.process = function()
{
    this.finished = true;
    this.client.socket.close();
}

statsCmd = function(stats_type, onFinished)
{
    this.stats_type = stats_type;
    this.onFinished = onFinished;
}

statsCmd.prototype.process = function()
{
    var stats = "stats";
    if (this.stats_type != "")
         stats += this.stats_type;
    this.client.socket.write(stats + "\r\n");
    this.result = {};
}

statsCmd.prototype.wait = function()
{
    var p = new process.Promise();
    var cb = this.onFinished;
    this.onFinished = function(res)
    {
        if (cb)
            cb(res);
        p.emitSuccess(res);
    }
    return p.wait();
}

//incrementCmd.prototype.wait = statsCmd.prototype.wait;
incrementCmd.prototype.wait = function()
{
    var p = new process.Promise();
    var cb = this.onFinished;
    this.onFinished = function(res)
    {
        if (cb)
            cb(res);
        p.emitSuccess(res);
    }
    return p.wait();
}


// stats
// stats items
// stats sizes
// stats slabs
statsCmd.prototype.receive = function(line)
{
    if (line == "END")
    {
        this.onFinished && this.onFinished(this.result);
        this.finished = true;
        this.client.process_next();
        return;
    }
    var params = line.split(" ");
    // params[0] should be STATS
    if (this.stats_type == "")
    {
        this.result[params[1]] = params[2];
    } else if (this.stats_type == "items")
    {
        sys.puts("not implemented yet");
    } else if (this.stats_type == "slabs") 
    {
        sys.puts("not implemented yet");
    } else if (this.stats_type == "sizes") 
    {
        sys.puts("not implemented yet");
    }
}

deleteCmd = function(key, timeout, onDeleted)
{
    this.onDeleted = onDeleted;
    this.key = key;
    this.timeout = timeout;
}

deleteCmd.prototype.process = function()
{
    this.client.socket.write("delete " + this.key +  " " + this.timeout + " " + "\r\n");
}

deleteCmd.prototype.receive = function(data)
{
    this.onDeleted(data);
    this.finished = true;
    this.client.process_next();
}

getCmd = function(key,onValue,onEnd)
{
    this.keys = key;
    this.onValue = onValue;
    this.onEnd = onEnd;
    this.prev_key_index = -1;    
}

getCmd.prototype.receive = function(data)
{
    if (this.client.expected_length != 0) // we already had header line, here is the key + "\r\nEND"
    {
        var value = data.substr(0, data.length - 2);
        // calculate here how many keys was skipped and notify about missing keys
        for (var i = this.prev_key_index+1; i < this.keys.length; ++i)
        {
            if (this.keys[i] == this.key)
            {
                this.prev_key_index = i;
                break;
            }  else {
                this.onValue && this.onValue(this.keys[i]);
            }
                
        }
        this.onValue && this.onValue(this.key, value, this.flag, this.cas);
        this.client.expected_length = 0;  // read until newline, should be "VALUE key flag size" or "END"
    } else {
        if (data == "END")
        {
            if (this.onEnd)
                this.onEnd();
            this.finished = true;
            this.client.process_next();
            return;
        }
        var params = data.split(" ");
        this.key = params[1];
        this.flag = params[2];
        if (params.length > 3)
            this.cas = params[3];
        var expected = parseInt(params[3]);
        this.client.expected_length = expected + 2; // 
        this.client.receive(); 
    }
}

getCmd.prototype.process = function()
{
    var keys = "";
    if (!this.keys.join)
    {
        this.keys = [ this.keys ];
        keys = this.keys;
    } else
        keys = this.keys.join(" ");
    if (this.getCas)
        this.client.socket.write("gets " + keys + "\r\n");
    else
        this.client.socket.write("get " + keys + "\r\n");
}

getCmd.prototype.promise = function()
{
    var result = [];
    var p = new process.Promise();
    var cb = this.onValue;
    this.onValue = function(key, value, flag) 
    {   
        result.push([key,value,flag])   
        if (cb) 
            cb([key,value,flag]);
    };
    this.onEnd = function()
    {
        p.emitSuccess(result);
    };
    return p;
}

Client.prototype.receive = function(data)
{
    if (data)
        this.buffer += data;
    if (this.expected_length == 0) 
    { 
        // this indicates we are reading line by line
        var crlf_pos = this.buffer.indexOf("\r\n");
        while (crlf_pos > 0)
        {
             var line = this.buffer.substring(0, crlf_pos);
             var rest = this.buffer.substring(crlf_pos + 2, this.buffer.length);
             this.buffer = rest;
             this.job.receive(line);
             crlf_pos = this.buffer.indexOf("\r\n");
        }
    } else {
        if (this.buffer.length >= this.expected_length)
        {
             var line = this.buffer.substring(0, this.expected_length);
             var rest = this.buffer.substring(this.expected_length, this.buffer.length);
             this.buffer = rest;
             this.job.receive(line);
        }
    }
}

/*
Client.prototype.flush = function()
{
    // wait here until last command in the queue is finished
    var p = new process.Promise();
    this.queue[this.queue.length].addListener("finished", function() { p.emitSuccess(); });
    p.wait(); 
}
*/

Client.prototype.get = function(key, onValue, onEnd)
{
    var c = new getCmd(key, onValue, onEnd);
    this.push( c );
    return c; 
}

Client.prototype.gets = function(key, onValue, onEnd)
{
    var c = new getCmd(key, onValue, onEnd);
    c.getCas = true;
    this.push( c );
    return c; 
}

Client.prototype.set = function(key, value, flag, exptime, onStored)
{
    var c = new setCmd("set", key, value, flag, exptime, onStored, 0);
    this.push( c );
    return c; 
}

Client.prototype.add = function(key, value, flag, exptime, onStored)
{
    var c = new setCmd("add", key, value, flag, exptime, onStored, 0);
    this.push( c );
    return c; 
}

Client.prototype.replace = function(key, value, flag, exptime, onStored)
{
    var c = new setCmd("replace", key, value, flag, exptime, onStored, 0);
    this.push( c );
    return c; 
}

Client.prototype.append = function(key, value, flag, exptime, onStored)
{
    var c = new setCmd("append", key, value, flag, exptime, onStored, 0);
    this.push( c );
    return c; 
}

Client.prototype.prepend = function(key, value, flag, exptime, onStored)
{
    var c = new setCmd("prepend", key, value, flag, exptime, onStored, 0);
    this.push( c );
    return c; 
}

Client.prototype.cas = function(key, value, flag, exptime, cas, onStored)
{
    var c = new setCmd("add", key, value, flag, exptime, cas, onStored);
    this.push( c );
    return c; 
}

Client.prototype.stats = function(onFinished)
{
    var c = new statsCmd("", onFinished);
    this.push(c);
    return c;
}

Client.prototype.incr = function(key,value,onFinished)
{
    var c = new incrementCmd("incr", key, value, onFinished);
    this.push(c);
    return c;
}

Client.prototype.decr = function(key,value,onFinished)
{
    var c = new incrementCmd("decr", key, value, onFinished);
    this.push(c);
    return c;
}

Client.prototype.close = function()
{
    this.push( new closeCmd() );
}

Client.prototype.terminate = function()
{
    this.socket.close();
    // todo: iterate commands queue and notify "error" or "terminated"?
}

exports.test = function()
{
    var c = new Client();
    c.count = 0;

    for (var i=0; i < 100; ++i)
    {
    c.get("foo" + i, 
        function(value)
        {
            sys.puts("got value: " + value);
            sys.puts(c.queue.length);
            //c.count++;
            //if (c.count > 98) c.socket.close();
        }
    );
    c.get("bar" + i, 
        function(value)
        {
            sys.puts("got value: " + value);
            //c.count++;
            sys.puts(c.queue.length);
            //if (c.count > 98) c.socket.close();
        }
    );
            //sys.puts(c.queue.length);
            sys.exec("ls -l").wait();
    }
    return;
}

exports.connect = function()
{
     return new Client();
}
