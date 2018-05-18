// server.js

'use strict';

// Use the game core module
const game_core = require("./game_core");
Log("SERVER: " + game_core.connection());

// Use express to open a web server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var clients = new Map(); // contains socket connections and player objects
var client_counter=0; //increments with every added client

const margin_of_error = 1; //the client box prediction can be within 2 px of the server prediction

var date = new Date();

// -- ROUTING --
app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/html/index.html');
});
app.post('/user', function(req, res, next) {
    // console.log(req.body); //this is still undefined
    res.sendFile(__dirname + '/html/index.html');
});
app.get('/client_game.js', function(req, res, next) {
    res.sendFile(__dirname + '/client_game.js');
});
app.get('/game_core.js', function(req, res, next) {
    res.sendFile(__dirname + '/game_core.js');
});
app.get('/css/master.css', function(req, res, next) {
    res.sendFile(__dirname + '/css/master.css');
});
app.get('/html/login-page.html', function(req, res, next) {
    res.sendFile(__dirname + '/html/login-page.html')
});

class Client {
  constructor(connection) {
    this.connection = connection;
  }
}

function Log(message){
  var new_d = new Date();

  if(date === undefined ||
     date.getDate() !== new_d.getDate() ||
     date.getMonth() !== new_d.getMonth() ||
     date.getYear() !== new_d.getYear() ) {
      console.log((new_d.getMonth()+1)+"-"+new_d.getDate()+"-"+new_d.getFullYear());
  }
  date = new_d;

  const timezoneOffsetHours = 6; //this is the offset for Mountain time, so the logging will be more clear to us
  var meridian = "AM";
  var hour = date.getUTCHours()-timezoneOffsetHours;

  if(hour<=0){
    hour+=12;
    meridian = "PM";
  }
  else if(hour>12){
    hour-=12;
    meridian = "PM";
  }

  var minute = date.getMinutes()+"";
  if(minute < 10){
    minute = "0"+minute;
  }

  var date_string = hour+":"+minute+" "+meridian;
  date_string = date_string.padEnd(10);

  console.log(date_string+"| "+message);
}


// -- ClIENT LISTENERS --
server.listen(4200, '0.0.0.0'); // begin listening
Log("SERVER: listening...");

io.on('connection', function(new_client) {
  var cur_name = (client_counter++)+"";
    /* The client counter increments with every added client, but does not decrement when a client leaves.
       It is used as a key in a map, not as an index in an array. This is temporary until we get login working*/

  var client = new Client(new_client);

  Log('Client ' + cur_name + ' connected.');

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
     input: {left, right, up, down}
      - updates the client's move data
  */
  new_client.on('move', function(commands){
    if(!clients.has(cur_name)){return;} // this line defends against incoming requests after the client has already been disconnected
    clients.get(cur_name).player.commands = commands;
  });


  /* API 'stop'
     input: {x, y}
      - updates the client's move data
      - checks if the clients prediction is too off
      - sends correction data to client if prediction is wrong
  */
  new_client.on('stop', function(predicted_location){
    if(!clients.has(cur_name)){return;} // see first line of 'move' request

    // get the server's authoritative position
    var server_location = clients.get(cur_name).player.location;

    // if the difference between the two is greater than the marigin of error send a correction
    var xDif = Math.abs(server_location.x - predicted_location.x);
    var yDif = Math.abs(server_location.y - predicted_location.y);
    if(xDif > margin_of_error || yDif > margin_of_error){
        client.connection.emit('correction', server_location);
    }
    else{
      clients.get(cur_name).player.location = predicted_location;
    }
  });

  /* API 'disconnect'
     input: {}
      - removes the client data from the clients and clientbodies map
      - shuts down the physics loop if this was the last client to leave
  */
  new_client.on('disconnect', function(data){
    clients.delete(cur_name);
    Log("Client " + cur_name + " disconnected.");

    if(clients.size === 0){
        clearInterval(physics_loop);
        Log("SERVER: No remaining clients. Physics loop shut down.");
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
  Log("SERVER: physics loop initialized");
}

function UpdateState(){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  // this gross foreachloop stuff needs to be cleaned up by creating a client class
  clients.forEach(function update(client, name, map){

    // calculate the next move
    // see if the next move collides with another box
    var old_loc = client.player.move(delta_time);
    var collision = collided(client.player, name);

    if(collision){
      // if there was a collision reset the players's location and tell the client
      client.player.location = old_loc;
      clients.get(name).connection.emit('correction', client.player.location);
    }

    // check for boundary collisions
    var boundry_result = game_core.checkBoundry(client.player.location, client.player.dimensions);
    client.player.location = boundry_result.loc;

  });

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
