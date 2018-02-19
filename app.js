// app.js
const game_core = require("./core");

console.log("SERVER: " + game_core.connection());

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var clients = new Map();
var client_counter=0;
var queue = [];

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

  // var box = game_core.getDefaultBox();

  console.log('Client ' + key + ' connected...');

  client.on('join', function(data) {
  });

  client.on('init_client', function(data){
    console.log(data);

    clients.set(key, {
      box: data,
      moves: {left:false, right:false, up:false, down:false}
    });
  });

  client.on('update', function(data){

    // console.log(clients.get(key));

    queue.push({key: key, moves: data.moves});

    clients.get(key).moves = data.moves;
    // clients.set(key, {
    //   box:
    // })


    // console.log(Array.from(clients.values()));

    client.broadcast.emit('all', Array.from(clients.values()));
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

  clients.forEach(function update(value, key, map){
    // console.log(value.box);
    // console.log("here!");
    value.box = game_core.moveBox(value.box, value.moves, delta_time);
  });

  if(Date.now() - last_client_update >= client_update_waitTime){
    update_clients();
    last_client_update = Date.now();
  }
}

// function processQueue(time){
//   for(var i=(queue.length-1); i >= 0; i--){
//     var input = queue.shift();
//     console.log(input.key);
//     clients.set(input.key, {
//        box: game_core.moveBox(clients.get(input.key).box, input.moves, time)
//      });
//      // console.log(clients.get(input.key));
//   }
// }

  //  -- SEND TO CLIENTS --
function update_clients(){
  // update all clients with the info relevant to them about the world and the other clients
  should_update = true;
}
