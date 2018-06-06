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

    exports.getLocationObj = function(x, y){
      return {x, y};
    }
    exports.getDimensionsObj = function(l, w){
      return {l, w};
    }
    exports.getCommandsObj = function(){
      return {left: false, right: false, up: false, down: false};
    }

    exports.Player = class {
      constructor() {
        this.location = {x:20, y:20};
        this.dimensions = {l:100, w:50};
        this.center = this.getCenter();
        this.commands = {left: false, right: false, up: false, down: false};
        this.speed = 100; //pixels per second
        this.last_update = Date.now();
        this.orientation = 0; // TODO: make it function like so: 0 - 359 degrees, 0 degrees points straight up
      }

      getCenter(){
        let x = this.location.x + this.dimensions.w / 2;
        let y = this.location.y + this.dimensions.l / 2;
        return {x, y}
      }

      move(time){
        var old_loc = Object.assign({}, this.location);
        var dist = (time/1000)*this.speed;
        if(this.commands.left) this.location.x-=dist;
        if(this.commands.right) this.location.x+=dist;
        if(this.commands.up) this.location.y-=dist;
        if(this.commands.down) this.location.y+=dist;
        return(old_loc);
      }

      setOrientation(mouse_x, mouse_y){
        this.center = this.getCenter();

        let adjacent = mouse_x - this.center.x;
        let opposite = mouse_y - this.center.y;

        let rad2deg = 180/Math.PI;
        if (adjacent === 0) {
          return;
        }
        else if (adjacent > 0 && opposite < 0) { //First Quadrant
          let orientation = Math.atan(-opposite/-adjacent) * rad2deg;
          this.orientation = orientation + 360;
        }
        else if (adjacent > 0 && opposite > 0) { //Second Quadrant
          this.orientation = Math.atan(opposite/adjacent) * rad2deg;
        }
        else if (adjacent < 0 && opposite > 0) { //Third Quadrant
          let orientation = Math.atan(opposite/adjacent) * rad2deg;
          this.orientation = orientation + 180;
        }
        else if (adjacent < 0 && opposite < 0) { //Fourth Quadrant
          let orientation = Math.atan(opposite/adjacent) * rad2deg;
          this.orientation = orientation + 180;
        }
      }
    }

    exports.checkBoundry = function(loc, dim){
      var was_correction = false;
      if(loc.x + dim.w > 600) {loc.x = 600-dim.w;was_correction = true}
      if(loc.y + dim.l > 400) {loc.y = 400-dim.l;was_correction = true}
      if(loc.x < 0) {loc.x = 0;was_correction = true}
      if(loc.y < 0) {loc.y = 0;was_correction = true}
      return {loc, was_correction};
    }

    var check_intersect = exports.intersect = function(rect1, rect2){
      let loc1 = rect1.location;
      let dim1 = rect1.dimensions;
      let loc2 = rect2.location;
      let dim2 = rect2.dimensions;

      return (loc1.x+dim1.w > loc2.x && loc1.x < loc2.x+dim2.w &&
              loc1.y+dim1.l > loc2.y && loc1.y < loc2.y+dim2.l)
    }


    exports.anyIntersect = function(primary, list, to_ignore){
        for(i in list){
          if(i!=to_ignore && check_intersect(primary, list[i])){
            return true;
          }
        }
        return false;
    };

    exports.connection = function(){
        return "core module connected";
    };



})(typeof exports === 'undefined'? this['game_core']={}: exports);
