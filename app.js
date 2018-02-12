// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var clients = new Map();
var client_counter=0;

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/game.js', function(req, res,next) {
    res.sendFile(__dirname + '/game.js');
});





io.on('connection', function(client) {
  var key=(client_counter++)+"";
  clients.set(key, {x:0, y:0, lw:0, spd:0});

  console.log('Client ' + key + ' connected...');
  console.log(Array.from(clients.values()));

  client.on('join', function(data) {
  });

  client.on('init_client', function(data){
    clients.set(key, data);
  });

  client.on('update', function(data){
    clients.set(key, data);

    client.broadcast.emit('all', Array.from(clients.values()));
  });

  client.on('disconnect', function(data){
    clients.delete(key);
    console.log("Client " + key + " disconnected.");
  });
});


server.listen(4200, '0.0.0.0');
