// app.js
const game_core = require("./core");

console.log("SERVER: " + game_core.connection());

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
app.get('/client_game.js', function(req, res,next) {
    res.sendFile(__dirname + '/client_game.js');
});
app.get('/core.js', function(req, res,next) {
    res.sendFile(__dirname + '/core.js');
});


// -- ClIENT LISTENERS --
server.listen(4200, '0.0.0.0');
console.log("SERVER: listening...");
io.on('connection', function(client) {
  var key=(client_counter++)+"";
  clients.set(key, {
    /*c: client,
    box.{x:0, y:0, lw:0, spd:0}});*/

  var box = game_core.getDefaultBox();

  console.log('Client ' + key + ' connected...');

  client.on('join', function(data) {
  });

  client.on('init_client', function(data){
    clients.set(key, data);
  });

  client.on('update', function(data){

    var new_box = game_core.moveBox(data.moves());


    //clients.set(key, data);

    //client.broadcast.emit('all', Array.from(clients.values()));
  });

  client.on('disconnect', function(data){
    clients.delete(key);
    console.log("Client " + key + " disconnected.");
  });
});




  // -- PHYSICS LOOP --
init_physicsLoop();
var physics_loop;
var update_p_sec = 66;
var client_update_waitTime = 45; //ms
var should_update = false;

var last_update = Date.now();
var last_client_update = Date.now();
var delta_time;

function init_physicsLoop(){
  physics_loop = setInterval(function(){UpdateState();}, 1000/update_p_sec);
  console.log("SERVER: physics loop initialized");
}
function UpdateState(){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  if(Date.now() - last_client_update >= client_update_waitTime){
    update_clients();
    last_client_update = Date.now();
  }
}


  //  -- SEND TO CLIENTS --
function update_clients(){
  // update all clients with the info relevant to them about the world and the other clients
  should_update = true;
}
