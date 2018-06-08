'use strict'

var images_info =
[
	{
		title: "Alien",
		src: "Alien.png",
		type: "sprite",
		rows: 4,
		cols: 4,
		fps: 5
	},
	{
		title: "Person",
		src: "character.png",
		type: "sprite",
		rows: 2,
		cols: 8,
		fps: 10
	},
	{
		title: "Pixels",
		src: "movers.png",
		type: "sprite",
		rows: 3,
		cols: 2,
		fps: 4
	}
]

class ImageContainer{

	constructor(){
		this.image_map = new Map();
		this.loaded_image_counter = 0;
		this.outdated_sprites = [];
	}


	loadImages(){
		for(let info of images_info){

			let img = new Image();

			img.onload = () => {
				this.imageLoaded();
			}

			img.src = "./img/" + info.src;
			info.img = img;

			this.image_map.set(info.title, info);
		}
		images_info = [];
	}

	imageLoaded(){
		// is this the last image to load?
		if(this.loaded_image_counter++ != images_info.length) return;
		// at this point we know that all images have been loaded


		this.updateSprites();
	}

	updateSprites(){
		for(let s of this.outdated_sprites){
			s.imageFinished();
		}
	}

	get(title){
		return this.image_map.get(title);
	}
}

var image_container = new ImageContainer();
image_container.loadImages();
