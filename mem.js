var net = require('net');



var socket = net.createConnection(11211);
socket.on('connect',function(){console.log("connected!");});

socket.on('data',function(data){console.log(data.toString());});
socket.write("hello\r\n");

