'use strict'

class Sprite{

	constructor(title, container){
	 	let s = image_container.get(title);
		this.rows = s.rows;
		this.cols = s.cols;
		this.ctx = s.ctx;
		this.wait_time = 1000/s.fps;
		this.img = s.img;

		// console.log(container);
		let h = container.l;
		let w = container.w;
		this.container = {h,w};

		this.cur_frame = 0;
		this.cur_row = 0;
		this.srcX = 0;
		this.srcY = 0;
		this.last_update_time = Date.now();
		this.off_set_x = 0;
		this.off_set_y = 0;

		if(!this.img.complete){
			image_container.outdated_sprites.push(this);
		}
		else{
			this.frame_width = this.img.width/this.cols;
			this.frame_height = this.img.height/this.rows;

			this.width = this.frame_width;
			this.height = this.frame_height;

			this.center(this.container.h, this.container.w)
		}
	}

	//finishes sprite processing if it wasn't loaded in the constructor
	imageFinished(){
		if(!this.frame_width){
			this.frame_width = this.img.width/this.cols;
			this.frame_height = this.img.height/this.rows;
		}

		this.width = this.frame_width;
		this.height = this.frame_height;

		if(this.resize_factor){
			this.resizeBy(this.resize_factor);
		}
		if(this.container){
			this.center(this.container.h, this.container.w)
		}
	}



	resizeTo(h, w){
		this.width = w;
		this.height = h;
	}

	resizeBy(factor){
		this.width*=factor;
		this.height*=factor;
		Math.round(this.height);
		Math.round(this.width);
		this.resize_factor = factor;
	}

	center(h, w){
		this.off_set_x = w/2 - this.width/2;
		this.off_set_y = h/2 - this.height/2;
		this.container = {h, w};
	}

	setRow(r){
		if(r < 0 || r >= this.rows) return;
		this.cur_row = r;
<<<<<<< HEAD
		this.srcY = this.cur_row * this.frame_height;
		//console.log(srcY);
=======
		this.srcY = this.cur_row * this.height;
>>>>>>> b853740dd360697627c47f54301b87f21d05b607
	}

	updateFrame(){
		var delta_time = Date.now()-this.last_update_time;
		if(delta_time < this.wait_time)
			return;
		this.last_update_time = Date.now();

		if(++this.cur_frame >= this.cols){
			this.cur_frame = 0;
		}

		//Calculating the x coordinate for spritesheet
		this.srcX = this.cur_frame * this.frame_width;
	}

	draw(canvas_x, canvas_y){
		if(!this.img.complete) return;

		this.updateFrame();
		ctx.drawImage(this.img,this.srcX,this.srcY,
		this.frame_width,this.frame_height,
		canvas_x+this.off_set_x,canvas_y+this.off_set_y,
		this.width,this.height);
	}

	drawStatic(canvas_x, canvas_y, r, c){
		if(!this.img.complete) return;

		this.srcX = c * this.frame_width;
		this.srcY = r * this.frame_height;

		ctx.drawImage(this.img,this.srcX,this.srcY,
		this.frame_width,this.frame_height,
		canvas_x+this.off_set_x,canvas_y+this.off_set_y,
		this.width,this.height);
	}
}
