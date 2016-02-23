//DEBUG
function ASSERT(expr, message)
{
    if(expr === false) console.error(message);
}
function LOG(message)
{
	console.log(message);
}
function EXISTS(val)
{
	return val !== null && val !== undefined;
}
//END

var gb = 
{
	config:
	{
		frame_skip: false,
		update: null,
		render: null,
		input:
		{
			root: document,
		},
	},

	allow_update: false,
	has_focus: true,
	do_skip_this_frame: false,

	update: function(t){},
	render: function(){},

	//DEBUG
	focus: function(e)
	{
		gb.has_focus = true;
		LOG('focus');
	},
	blur: function(e)
	{
		gb.has_focus = false;
		LOG('blur');
	},
	//END
	
	init: function(config)
	{
		for(var k in config.config)
			gb.config[k] = config.config[k];

		for(var k in config.input)
			gb.config.input[k] = config.input[k];

		gb.input.init(gb.config.input);

		if(gb.config.update) gb.update = config.config.update;
		if(gb.config.render) gb.render = config.config.render;

		// DEBUG
		window.onfocus = gb.focus;
		window.onblur = gb.blur;
		//END

		requestAnimationFrame(gb._init_time);
	},
	_init_time: function(t)
	{
		gb.time.init(t);
		gb.allow_update = true;		
		requestAnimationFrame(gb._update);
	},
	_update: function(t)
	{
		if(gb.config.frame_skip === true)
		{
			if(gb.do_skip_this_frame === true)
			{
				gb.do_skip_this_frame = false;
				requestAnimationFrame(gb._update);
				return;
			}
			gb.do_skip_this_frame = true;
		}

		gb.time.update(t);
		if(gb.time.paused || gb.has_focus === false || gb.allow_update === false)
		{
			gb.input.update();
			requestAnimationFrame(gb._update);
			return;
		}

		gb.stack.clear_all();
		
		var dt = gb.time.dt;

		gb.update(dt);
		gb.input.update();
		gb.render();
		requestAnimationFrame(gb._update);
	},

	has_flag_set: function(mask, flag)
	{
	    return (flag & mask) === flag;
	},
}