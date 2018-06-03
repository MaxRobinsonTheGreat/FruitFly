// server.js

'use strict';

// Use the game core module
const game_core = require("./public/src/game_core");
const Logger = require("./logger");

Logger.log("SERVER: " + game_core.connection());

// Use express to open a web server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var clients = new Map(); // contains socket connections and player objects
var client_counter=0; //increments with every added client

// -- ROUTING --
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/public/html/index.html');
});
app.post('/user', function(req, res, next) {
    // console.log(req.body); //this is still undefined
    res.sendFile(__dirname + '/html/index.html');
});


class Client {
  constructor(connection) {
    this.connection = connection;
  }
}


// -- ClIENT LISTENERS --
server.listen(4200, '0.0.0.0'); // begin listening
Logger.log("SERVER: listening...");

io.on('connection', function(new_client) {
  var cur_name = (client_counter++)+"";
    /* The client counter increments with every added client, but does not decrement when a client leaves.
       It is used as a key in a map, not as an index in an array. This is temporary until we get login working*/

  var client = new Client(new_client);

  Logger.log('Client ' + cur_name + ' connected.');

  new_client.on('join', function(data) {
  });


  /* API 'init_client'
     input: {x, y}
      - avoids colliding start positions
      - initializes the client and clientbodies objects and puts into maps
      - restarts physics loop when the client is added to an empty client map
  */
  new_client.on('init_client', function(new_player_loc){
    client.player = new game_core.Player();
    client.last_update = Date.now();

    // keep incrementing x position until no longer colliding
    while(collided(client.player, cur_name)){
      client.player.location.x+=client.player.dimensions.w+10;
    }

    if(client.player.location.x !== new_player_loc.x){
      client.connection.emit('correction', client.player.location);
    }

    // put client info in map
    clients.set(cur_name, client);

    // initialize physics loop if this is the only client in the map
    if(clients.size === 1){
      init_physicsLoop();
    }
  });


  /* API 'move'
     input: {x, y}
      - updates the client's move data
      - checks if the clients prediction is too off
      - sends correction data to client if prediction is wrong
  */
  new_client.on('move', function(predicted_location){
    if(!clients.has(cur_name)){return;} // this line defends against incoming requests after the client has already been disconnected

    const forgiveness = 25; //this give the clients a *little* bit of leeway in their predictions
    let d_time = Date.now()-client.last_update+forgiveness;

    var server_location = clients.get(cur_name).player.location;

    let max_distance = (d_time/1000)*client.player.speed;

    var x_dif = Math.abs(server_location.x - predicted_location.x);
    var y_dif = Math.abs(server_location.y - predicted_location.y);

    var collision = collided({dimensions: client.player.dimensions, location: predicted_location}, cur_name);

    if(collision || x_dif > max_distance || y_dif > max_distance){
        client.connection.emit('correction', server_location);
    }
    else{
      client.player.location = predicted_location;
      client.last_update = Date.now();
    }
  });

  /* API 'disconnect'
     input: {}
      - removes the client data from the clients and clientbodies map
      - shuts down the physics loop if this was the last client to leave
  */
  new_client.on('disconnect', function(data){
    clients.delete(cur_name);
    Logger.log("Client " + cur_name + " disconnected.");

    if(clients.size === 0){
        clearInterval(physics_loop);
        Logger.log("SERVER: No remaining clients. Physics loop shut down.");
    }
  });
});





  // -- PHYSICS LOOP --
var physics_loop;
var update_per_sec = 66;
var client_update_waitTime = 45; //millis

// Date.now() returns the number of millis since 1970. Use to calculate delta time
var last_update = Date.now();
var last_client_update = Date.now();
var delta_time;

function init_physicsLoop(){
  physics_loop = setInterval(function(){UpdateState();}, 1000/update_per_sec);
  Logger.log("SERVER: physics loop initialized");
}

function UpdateState(){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  // send the update to each client if its been 45 milliseconds since the last update
  if(Date.now() - last_client_update >= client_update_waitTime){
    update_clients();
    last_client_update = Date.now();
  }
}

// returns true if b collides with any of the clients besides the one at self_key
function collided(r, ignore_name){
  var result = false;
  clients.forEach(function update(client, name, map){
    if(name != ignore_name){
      if(game_core.intersect(r, client.player)){
        result = true;
        return;
      }
    }
  });
  return result;
}

  //  -- SEND TO CLIENTS --
function update_clients(){
  // update all clients with the info relevant to them about the world and the other clients
  var locations = [];
  clients.forEach(function getLocations(client, name, map){
    locations.push(client.player.location);
  });

  var self_index = 0;
  clients.forEach(function update(client, name, map){
    client.connection.emit('all', {locations, self_index: self_index++});
  });
}

/*
SEND API
    -'all'
        send data: {locations:[{x,y},{x,y},...], self_index}

    -'correction'
        send data: {x, y}
*/
