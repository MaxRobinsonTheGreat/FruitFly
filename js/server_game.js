const game_core = require('./game_core');
(function(exports){


  exports.Client = class {
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

  // -- PHYSICS LOOP --
  var physics_loop;
  var update_per_sec = 66;
  var client_update_waitTime = 45; //millis

  // Date.now() returns the number of millis since 1970. Use to calculate delta time
  var last_update = Date.now();
  var last_client_update = Date.now();
  var delta_time;

  exports.init_physicsLoop = function (clients){
  physics_loop = setInterval(function(){UpdateState(clients);}, 1000/update_per_sec);
  console.log("SERVER: physics loop initialized");
  }

  function UpdateState(clients){
  delta_time = Date.now() - last_update;
  last_update = Date.now();

  // this gross foreachloop stuff needs to be cleaned up by creating a client class
  clients.forEach(function update(value, key, map){

    // calculate the next move
    var moved_box = game_core.moveLocation(value.player, value.getCommands(), delta_time);
    // see if the next move collides with another box
    var collision = collided(moved_box, key, clients);

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
    update_clients(clients);
    last_client_update = Date.now();
  }
  }

  // returns true if b collides with any of the clients besides the one at self_key
  // needs to refactored (see bottom)
  var collided = exports.collided = function collided(b, self_key, clients){
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
  function update_clients(clients){
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
})(typeof exports === 'undefined'? this['game_server']={}: exports);
