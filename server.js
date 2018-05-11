// server.js

// Use the game core module
const game_core = require("./game_core");
console.log("SERVER: " + game_core.connection());


// Use express to open a web server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// Data from the clients is stored in these two maps:
var clients = new Map(); // contains information about the client box location
var clientbodies = new Map(); // stores the connected client object for later use
// The clients and clientbodies have the same relationships - the same key corresponds to the same client info
var client_counter=0; //increments with every added client

const margin_of_error = 1.5; //the client box prediction can be within 1.5 px of the server prediction



// -- ROUTING --
app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/html/index.html');
});
app.post('/user', function(req, res, next) {
    console.log(req.body); //this is still undefined
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
  getConnection() {
    return this.connection;
  }

  set player(body) {
    this.clientBody = body;
  }
  get player() {
    return this.clientBody;
  }

  setCommands(commands) {
    this.commands = commands;
  }
  getCommands() {
    return this.commands;
  }
}



// -- ClIENT LISTENERS --
server.listen(4200, '0.0.0.0'); // begin listening
console.log("SERVER: listening...");
io.on('connection', function(oldClient) {
  var key=(client_counter++)+"";
    /* The client counter increments with every added client, but does not decrement when a client leaves.
       It is used as a key in a map, not as an index in an array. */

  var client = new Client(oldClient);

  console.log('Client ' + key + ' connected...');

  client.getConnection().on('join', function(data) {
  });


  /* API 'init_client'
     input: {x, y, lw}
      - avoids colliding start positions
      - initializes the client and clientbodies objects and puts into maps
      - restarts physics loop when the client is added to an empty client map
  */
  client.getConnection().on('init_client', function(data){
    // keep incrementing x position untill no longer colliding
    while(collided(data, key)){
      data.x+=data.lw+10;
    }

    // put client info in maps
    client.setCommands({left:false, right:false, up:false, down:false});
    client.player = new game_core.Entity(data.location, data.dimension);
    clients.set(key, client);
    clientbodies.set(key, oldClient);

    // initialize physics loop if this is the only client in the map
    if(clients.size === 1){
      init_physicsLoop();
    }
  });


  /* API 'move'
     input: {box:{x, y, lw}, moves:{left, right, up, down}}
      - updates the client's move data
  */
  client.getConnection().on('move', function(data){
    if(!clients.has(key)){return;} // this line defends against incoming requests after the client has already been disconnected
    clients.get(key).setCommands(data.moves);
  });


  /* API 'stop'
     input: {box:{x, y, lw}, moves:{left, right, up, down}}
      - updates the client's move data
      - checks if the clients prediction is too off
      - sends correction data to client if prediction is wrong
  */
  client.getConnection().on('stop', function(data){
    if(!clients.has(key)){return;} // see first line of 'move' request

    // get the server's authoritative position and the clients prediction
    clients.get(key).setCommands(data.moves);
    var server_box = clients.get(key).player;
    var predicted_box = data.box;

    // if the difference between the two is greater than the marigin of error send a correction
    var xDif = Math.abs(server_box.x - predicted_box.x);
    var yDif = Math.abs(server_box.y - predicted_box.y);
    if(xDif > margin_of_error || yDif > margin_of_error){
        client.getConnection().emit('correction', server_box);
    }
    else{
      server_box = predicted_box;
    }
  });

  /* API 'disconnect'
     input: {}
      - removes the client data from the clients and clientbodies map
      - shuts down the physics loop if this was the last client to leave
  */
  client.getConnection().on('disconnect', function(data){
    clients.delete(key);
    clientbodies.delete(key);
    console.log("Client " + key + " disconnected.");

    if(clients.size === 0){
        clearInterval(physics_loop);
        console.log("SERVER: No remaining clients. Physics loop shut down.");
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
  console.log("SERVER: physics loop initialized");
}

function UpdateState(){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  // this gross foreachloop stuff needs to be cleaned up by creating a client class
  clients.forEach(function update(value, key, map){

    // calculate the next move
    var moved_box = game_core.moveLocation(value.player, value.getCommands(), delta_time);
    // see if the next move collides with another box
    var collision = collided(moved_box, key);

    if(!collision){
        // if there was no collision update the box's position
      value.player.location = moved_box;
    }
    else{
      // if there was a collision send a correction to the client
      clients.get(key).getConnection().emit('correction', value.player);
    }

    // check for boundary collisions
    var boundry_result = game_core.checkBoundry(value.player);
    value.player = boundry_result.box;

  });

  // send the update to each client if its been 45 milliseconds since the last update
  if(Date.now() - last_client_update >= client_update_waitTime){
    update_clients();
    last_client_update = Date.now();
  }
}

// returns true if b collides with any of the clients besides the one at self_key
// needs to refactored (see bottom)
function collided(b, self_key){
  var result = false;
  clients.forEach(function update(value, key, map){
    if(key != self_key){
      if(game_core.collision(b, value.player)){
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
  var locations = new Map();
  clients.forEach(function getLocations(value, key, map){
    locations.set(key, value.player); // you're pushing the whole client object into the map. just push the location values
  });                          // I don't think the client class even has a location data field.

  clients.forEach(function update(value, key, map){
    self_index = Array.from(locations.keys()).indexOf(key);

    value.getConnection().emit('all', {clients: Array.from(locations.values()), self_index: self_index});
  });
}

/*
SEND API
    -'all'
        send data: {value, key, map}

    -'correction'
        send data: {
                    clients[
                     { box:{x,y,lw}, moves:{right,left,up,down} }
                      , {}, {}, ... ],
                    self_index
                   }

*/

/*
REFACTOR TODO:
  -Create a single class for the client, which contains the data from the client/clientbodies maps
  -Send/recieve only relevant information
    * move - only recieve move data, not box data
    * all - send just the client locations, not their move data
  -Move the collided function to the game_core, where it recieves a box, an array of other boxes, and a self index to ignore
  -Remove the should_update bool. It is outdated
  -Make "key" variables clear. Probably rename to "name" and use this.name to make it explicit
*/
