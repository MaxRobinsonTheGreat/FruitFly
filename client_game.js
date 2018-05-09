var ctx;
var interval;

var FPS = 60;
var box_spd = core.getBoxSpeed();
var box = core.getDefaultBox();
var others = [];

var key = {left:false, right:false, up:false, down:false};
var self_index = "";

var last_update = 0;
var delta_time = 0;

var update_queue = [];
var oldest_update;
var update_delay = 100; //millis

// set to true if you want to see the most recent server's version of the main players box
var draw_self_debugger = false;


// connects at the ip addess and port of the page
var socket = io.connect();

socket.on('connect', function(data) {
   socket.emit('join', 'Hello World from client');
   main();
});

function intializeCanvasControls() {
  document.addEventListener('keydown', checkKeyDown);
	document.addEventListener('keyup', checkKeyUp);

  ctx = document.getElementById('canvas').getContext("2d");
}

function main(){
  intializeCanvasControls();

  last_update = Date.now();
  curInterval = setInterval(function(){Update();Draw(ctx);}, 1000/FPS)

  socket.emit('init_client', box);
}

function updateDeltaTime() {
  delta_time = Date.now() - last_update;
  last_update = Date.now();
}

function collided(b){
  for(i in others){
    if(i != self_index){
      if(core.collision(b, others[i].box)){
        return true;
      }
    }
  }
  return false;
}

function updateBoxPositions() {
  var moved_box = core.moveBox(box, key, delta_time);
  if(!collided(moved_box)){
    box = moved_box;
  }

  var boundry_result = core.checkBoundry(box);
  box = boundry_result.box;
}

function updateOthers(){
  if(oldest_update === undefined || update_queue === undefined) return;

  current_time = Date.now();

  others = oldest_update.update.clients;
  self_index = oldest_update.update.self_index;

  if(update_queue.length === 0) return;

  for(i in others){
    if (i >= update_queue[0].update.clients.length) break;

    if(i != self_index){
      let startBox = oldest_update.update.clients[i].box;
      let endBox = update_queue[0].update.clients[i].box;
      let time_dif = update_queue[0].timestamp - oldest_update.timestamp;

      if(time_dif === 0) break;

      others[i].box.x += ( ((endBox.x - startBox.x) / (time_dif))*
                     (current_time - update_delay - oldest_update.timestamp));

      others[i].box.y += ( ((endBox.y - startBox.y) / (time_dif))*
                    (current_time - update_delay - oldest_update.timestamp));
    }
    else{
      others[i] = update_queue[update_queue.length-1].update.clients[i];
    }
  }


  while(update_queue.length !== 0 && current_time-update_queue[0].timestamp >= update_delay){
    oldest_update = update_queue.shift();
  }

}


function Update(){
  updateDeltaTime();

  updateOthers();

  updateBoxPositions();

  emitToServer('move');
}
socket.on('all', function(data) {
    //console.log(data);
    update_queue.push({update: data, timestamp: Date.now()});
    if(oldest_update === undefined){
      others = data.clients;
      self_index = data.self_index;
      oldest_update = {update: data, timestamp: Date.now()};
    }
});
socket.on('correction', function(new_box){
  box = new_box;
});


function Draw(){
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "blue";
	ctx.fillRect(box.x, box.y, box.lw, box.lw);
  ctx.fillStyle = "red";
  for(i in others){
    if (i != self_index || draw_self_debugger){
      ctx.fillRect(others[i].box.x, others[i].box.y,
        others[i].box.lw, others[i].box.lw);
    }
  }
}


var KEY_UP=38, KEY_DOWN=40, KEY_LEFT=37, KEY_RIGHT=39;
function checkKeyDown(evt) {
  evt.preventDefault();
  if (evt.keyCode == KEY_LEFT)
    key.left = true;
  if (evt.keyCode == KEY_RIGHT)
    key.right = true;
  if (evt.keyCode == KEY_UP)
    key.up = true;
  if (evt.keyCode == KEY_DOWN)
    key.down = true;
}

function emitToServer(emitName) {
  var pack = {box: box, moves: key, timestamp:Date.now()};
  socket.emit(emitName, pack);
}

function checkKeyUp(evt){
  evt.preventDefault();
  if (evt.keyCode == KEY_LEFT)
    key.left = false;
  if (evt.keyCode == KEY_RIGHT)
    key.right = false;
  if (evt.keyCode == KEY_UP)
    key.up = false;
  if (evt.keyCode == KEY_DOWN)
    key.down = false;

  emitToServer('stop');
}
