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


<<<<<<< HEAD
var socket = io.connect('http://192.168.1.254:4200/');
var socket = io.connect('http://192.168.15.1:4200/');
=======
var socket = io.connect('http://10.24.194.226:4200/');
>>>>>>> Collision

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


function Update(){
  updateDeltaTime();

  updateBoxPositions();

  emitToServer('move');
}
socket.on('all', function(data) {
    //console.log(data);
    others = data.clients;
    self_index = data.self_index;
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
    ctx.fillRect(others[i].box.x, others[i].box.y,
      others[i].box.lw, others[i].box.lw);
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
