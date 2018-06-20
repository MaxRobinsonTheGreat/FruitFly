//client_game.js
'use strict';

const game_core = require('../shared/game_core');
const Player = require('../shared/player');
const Renderer = require('./rendering/renderer');

var interval;

var FPS = 60;

var main_player = new Player();
var others = [];
var self_index = -1;

Renderer.setMainPlayer(main_player);
Renderer.setOthers(others, -1);

var last_update = 0;
var delta_time = 0;

var update_queue = [];
var oldest_update;
var update_delay = 100; //millis
var correction_counter = 0;

// connects at the ip addess and port of the page
var socket = io.connect();

socket.on('connect', function(data) {
   main();
});

function intializeControls() {
  document.addEventListener('keydown', checkKeyDown);
	document.addEventListener('keyup', checkKeyUp);
}

function main(){
  intializeControls();

  last_update = Date.now();
  interval = setInterval(function(){Update();Renderer.render();}, 1000/FPS);

  //make sure the default position is not colliding with anything
  socket.emit('init_client', main_player.location);
}

//        --- UPDATE ---
function Update(){
  updateDeltaTime();

  updatePlayerPosition();

  updateOthers();

  socket.emit('move', {loc: main_player.location, cc: correction_counter});
}

function updateDeltaTime() {
  delta_time = Date.now() - last_update;
  last_update = Date.now();
}

function updatePlayerPosition() {
  var old_loc = main_player.move(delta_time);

  if(game_core.anyIntersect(main_player, others, self_index)){
    main_player.location = old_loc;
  }

  var boundry_result = game_core.checkBoundry(main_player.location, main_player.dimensions);
  main_player.location = boundry_result.loc;
}

function updateOthers(){
  if(oldest_update === undefined || update_queue === undefined) return;


  setState(oldest_update.state);

  if(update_queue.length === 0) return;

  let current_time = Date.now();

  for(var i in others){
    if (i >= update_queue[0].state.locations.length)
      break;
    if(i != self_index)
      interpolateEntityAt(i, current_time);
    else{
      var index = update_queue[update_queue.length-1].state.self_index;
      others[i].location = update_queue[update_queue.length-1].state.locations[index];
    }
  }


  while(update_queue.length > 0 && current_time-update_queue[0].timestamp >= update_delay){
    oldest_update = update_queue.shift();
  }
}


function interpolateEntityAt(i, current_time){
  let startloc = oldest_update.state.locations[i];
  let endloc = update_queue[0].state.locations[i];
  let time_dif = update_queue[0].timestamp - oldest_update.timestamp;

  // we divide by time_dif, so make sure it's not zero
  if(time_dif === 0) return;

  others[i].location.x += ( ((endloc.x - startloc.x) / (time_dif))*
                 (current_time - update_delay - oldest_update.timestamp));

  others[i].location.y += ( ((endloc.y - startloc.y) / (time_dif))*
                (current_time - update_delay - oldest_update.timestamp));
}

function setState(state){
  if(others.length !== state.locations.length){
    others = []; //clear others[]

    for(var i in state.locations){

      others.push({
        location: state.locations[i],
        dimensions: game_core.getDimensionsObj(100, 50),
      });
    }

    Renderer.setOthers(others, state.self_index);
  }
  else{
    for(var i in others){
      others[i].location = state.locations[i];
    }
  }

  self_index = state.self_index;
}


//        --- SERVER LISTENERS ---
/* API 'all'
   input: {locations: [{x,y},{x,y},...]}
    - pushes the new state into the update queue
*/
socket.on('all', function(state) {
    if(oldest_update === undefined){
      setState(state);
      oldest_update = {state, timestamp: Date.now()};
    }
    else{
      update_queue.push({state, timestamp: Date.now()});
    }

});
/* API 'correction'
   input: {x,y}
    - pushes the new state into the update queue
*/
socket.on('correction', function(pack){
  if(pack.cc !== correction_counter) return;

  main_player.location = pack.corrected_location;
  correction_counter++;
});


//      --- CONTROL LISTENERS ---
const KEY_UP=87, KEY_DOWN=83, KEY_LEFT=65, KEY_RIGHT=68;
function checkKeyDown(evt) {
  evt.preventDefault();
  if (evt.keyCode === KEY_LEFT)
    main_player.commands.left = true;
  if (evt.keyCode === KEY_RIGHT)
    main_player.commands.right = true;
  if (evt.keyCode === KEY_UP)
    main_player.commands.up = true;
  if (evt.keyCode === KEY_DOWN)
    main_player.commands.down = true;
}

function checkKeyUp(evt){
  evt.preventDefault();
  if (evt.keyCode === KEY_LEFT)
    main_player.commands.left = false;
  if (evt.keyCode === KEY_RIGHT)
    main_player.commands.right = false;
  if (evt.keyCode === KEY_UP)
    main_player.commands.up = false;
  if (evt.keyCode === KEY_DOWN)
    main_player.commands.down = false;
}
