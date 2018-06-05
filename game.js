'use strict'

const game_core = require("./public/src/game_core");

module.exports = class Game{
  constructor(name, clients){
    this.name = name;
    this.fps = 45;
    this.clients = clients;
    this.last_update = Date.now();
    this.last_client_update = Date.now();
    this.running = false;
  }

  start(){
    this.physics_loop = setInterval(function(){this.updateState();}.bind(this), 1000/this.fps);
    this.runnning = true;
  }

  stop(){
    clearInterval(this.physics_loop);
    this.running = false;
  }

  isRunning(){
    return this.running;
  }

  updateState(){
    this.delta_time = Date.now() - this.last_update;
    this.last_update = Date.now();

    this.updateClients();
  }

  collided(r, ignore_name){
    var result = false;
    this.clients.forEach(function update(client, name, map){
      if(name != ignore_name){
        if(game_core.intersect(r, client.player)){
          result = true;
          return;
        }
      }
    });
    return result;
  }

  updateClients(){
    // update all clients with the info relevant to them about the world and the other clients
    var locations = [];
    this.clients.forEach(function getLocations(client, name, map){
      locations.push(client.player.location);
    });

    var self_index = 0;
    this.clients.forEach(function update(client, name, map){
      client.connection.emit('all', {locations, self_index: self_index++});
    });
  }

  addClient(client, client_name, location){
    client.player = new game_core.Player();

    // keep incrementing x position until no longer colliding
    while(this.collided(client.player, client_name)){
      client.player.location.x+=client.player.dimensions.w+10;
    }

    if(client.player.location.x !== location.x){
      client.connection.emit('correction', client.player.location);
    }

    // put client info in map
    this.clients.set(client_name, client);
  }

  removeClient(name){
    this.clients.delete(name);
  }

  movePlayer(name, predicted_location){
    let client = this.clients.get(name);

    const forgiveness = 15; //this give the clients a *little* bit of leeway in their predictions
    let d_time = Date.now()-client.player.last_update+forgiveness;
    let new_date = Date.now();

    var server_location = this.clients.get(name).player.location;

    let max_distance = (d_time/1000)*client.player.speed;

    var x_dif = Math.abs(server_location.x - predicted_location.x);
    var y_dif = Math.abs(server_location.y - predicted_location.y);

    var collision = this.collided({dimensions: client.player.dimensions, location: predicted_location}, name);

    if(collision || x_dif > max_distance || y_dif > max_distance){
        client.connection.emit('correction', server_location);
    }
    else{
      client.player.location = predicted_location;
      client.player.last_update = new_date;
    }
  }
}
