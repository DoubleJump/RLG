gb.Scene = function()
{
	this.world_matrix = gb.mat4.new();
	this.num_entities = 0;
	this.entities = [];
	//this.draw_items;
	//this.num_draw_items;
	//this.animations = [];
}
gb.scene = 
{
	new: function(name, make_active)
	{
		var scene = new gb.Scene();
		//scene.draw_items = new Uint32Array(64);
		//scene.num_draw_items = 0;
		return scene;
	},
	add: function(entity, s)
	{
		var e = entity.entity || entity;
		s.entities.push(e);
		e.id = s.num_entities;
		s.num_entities++;
	},
	update: function(s, dt)
	{
		/*
		var n = s.animations.length;
		for(var i = 0; i < n; ++i) 
		{
			var anim = s.animations[i];
			if(anim.is_playing)
			{
				gb.animation.update(anim, dt);
			}
		}
		*/

		var n = s.num_entities;
		//s.num_draw_items = 0;
		for(var i = 0; i < n; ++i) 
		{
			var e = s.entities[i];
			if(e.active === true)
			{
				gb.entity.update(e, s);

				/*
				if(e.mesh && e.material)
				{
					s.draw_items[s.num_draw_items] = e.id;
					s.num_draw_items++;
				}
				*/
			}
		}
	},
}