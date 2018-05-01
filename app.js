// app.js
const game_core = require("./core");

console.log("SERVER: " + game_core.connection());

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var clients = new Map();
var clientbodies = new Map();
var client_counter=0;

const margin_of_error = 1.5; //the client box prediction can be within 1.5 of the server prediction


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
app.get('/css/master.css', function(req, res, next) {
    res.sendFile(__dirname + '/css/master.css');
})

// -- ClIENT LISTENERS --
server.listen(4200, '0.0.0.0');
console.log("SERVER: listening...");
io.on('connection', function(client) {
  var key=(client_counter++)+"";

  console.log('Client ' + key + ' connected...');

  client.on('join', function(data) {
  });

  client.on('init_client', function(data){
    clients.set(key, {
      box: data,
      moves: {left:false, right:false, up:false, down:false}
    });
    clientbodies.set(key, client);
  });

  client.on('move', function(data){
    clients.get(key).moves = data.moves;
  });
  client.on('stop', function(data){
    clients.get(key).moves = data.moves;
    var server_box = clients.get(key).box;
    var predicted_box = data.box;
    var xDif = Math.abs(server_box.x - predicted_box.x);
    var yDif = Math.abs(server_box.y - predicted_box.y);
    if(xDif > margin_of_error || yDif > margin_of_error){
        client.emit('correction', server_box);
    }
    else{
      server_box = predicted_box;
    }
  });

  client.on('disconnect', function(data){
    clients.delete(key);
    console.log("Client " + key + " disconnected.");
  });
});




  // -- PHYSICS LOOP --
init_physicsLoop();
var physics_loop;
var update_per_sec = 66;
var client_update_waitTime = 45; //millis
var should_update = false;

var last_update = Date.now();
var last_client_update = Date.now();
var delta_time;

function init_physicsLoop(){
  physics_loop = setInterval(function(){UpdateState();}, 1000/update_per_sec);
  console.log("SERVER: physics loop initialized");
}
function UpdateState(){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  clients.forEach(function update(value, key, map){

    value.box = game_core.moveBox(value.box, value.moves, delta_time);
    var send_correction = false;

    var boundry_result = game_core.checkBoundry(value.box);
    value.box = boundry_result.box;

  });

  if(Date.now() - last_client_update >= client_update_waitTime){
    update_clients();
    last_client_update = Date.now();
  }
}

  //  -- SEND TO CLIENTS --
function update_clients(){
  // update all clients with the info relevant to them about the world and the other clients
  clientbodies.forEach(function update(value, key, map){

    value.broadcast.emit('all', {clients: clients, self_key: key});
  });
  should_update = true;
}
