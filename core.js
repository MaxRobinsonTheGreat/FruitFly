/*
    The game core contains code that is shared between the server and the client, such as:
        -default values
        -classes/object structures
        -behavior functions
        
    This avoids code duplication and ensures that the code is EXACTLY the same between the server and client where it matters. 
    It's important to note that no DATA is being shared (or even could be shared) through this file, only functionality. 
    The server and client(s) have their own copies of this file and cannot communicate through the core.
*/

(function(exports){


    var box_spd = 100; //px per second
    var default_box = {x:20, y:20, lw:20}; //intitial box pos/size

    exports.getBoxSpeed = function(){return box_spd;};
    exports.getDefaultBox = function(){return {x: 20, y:20, lw:20};};

    exports.moveBox = function(box, key, time){
      var moved_box = Object.assign({}, box);
      dist = (time/1000)*box_spd;
      if(key.left) moved_box.x-=dist;
      if(key.right) moved_box.x+=dist;
      if(key.up) moved_box.y-=dist;
      if(key.down) moved_box.y+=dist;
      return(moved_box);
    }

    exports.checkBoundry = function(box){
      var was_correction = false;
      if(box.x + box.lw > 600) {box.x = 600-box.lw;was_correction = true}
      if(box.y + box.lw > 400) {box.y = 400-box.lw;was_correction = true}
      if(box.x < 0) {box.x = 0;was_correction = true}
      if(box.y < 0) {box.y = 0;was_correction = true}
      return {box, was_correction};
    }

    exports.collision = function(b1, b2){
      return (b1.x+b1.lw > b2.x && b1.x < b2.x+b2.lw &&
              b1.y+b1.lw > b2.y && b1.y < b2.y+b2.lw)
    }
    // A new  function should be added that is given a box, a list of boxes, and an index.
    // It returns true if any of the boxes in the list collides with the given box besides the one at the specified index.
    // This new function should not replace the function collision(), but should call it instead.
    // That way the client/server has access to the collision function and its subfunction, which may need to be used by itself

    exports.connection = function(){
        return "core module connected";
    };



})(typeof exports === 'undefined'? this['core']={}: exports);
