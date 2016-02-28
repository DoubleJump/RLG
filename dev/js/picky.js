//TODO: global and local split
//TODO: multisplit on mouse wheel
//TODO: quad joining
//TODO: floating quads
//TODO: snapping

var v3 = gb.vec3;

var ToolMode = 
{
	VERTICAL: 0,
	HORIZONTAL: 1,
	POINT: 2,
	COUNT: 3,
};
var SplitMode = 
{
	GLOBAL: 0,
	LOCAL: 1,
	COUNT: 2,
};
/*
var QuadSelection = function()
{
	this.array = new Int32Array(128);
	this.count = 0;
}4*/
var Context = function()
{
	this.tool_mode = ToolMode.HORIZONTAL;
	this.split_mode = SplitMode.LOCAL;
	//this.selection = new QuadSelection();
	this.selection = 0;
	this.split_count = 1;
	this.quads = [];
	this.new_quads = [];
	this.removed_quads = [];
}
var Quad = function(ax,ay,bx,by, c)
{
	this.rect = new gb.rect.new(ax,ay,bx,by);
	this.depth = 0;
	this.color = c;
	this.id = -1;
}

var camera;
var construct;
var material;
var square;
var context = new Context();

var debug_view;

function init()
{
	gb.init(
	{
		config:
		{
			frame_skip: false,
			update: update,
			render: render,
		}
	});

	gb.input.init(
	{
		root: gb.dom.get('.canvas'),
	});

	//gb.canvas.init(gb.dom.get('.canvas'));
	gb.webgl.init(
	{
		container: gb.dom.get('.canvas'),
		fill_container: true,
		antialias: false,
	});

	//LOG(gb.webgl.view);

	var vs = 'attribute vec3 position;attribute vec4 color;uniform mat4 mvp;varying vec4 _color;void main(){_color = color;gl_Position = mvp * vec4(position, 1.0);}';
    var fs = 'precision highp float;varying vec4 _color;void main(){gl_FragColor = _color;}'; 
	material = gb.material.new(gb.shader.new(vs,fs));

	//DEBUG
	gb.gl_draw.init(
	{
		buffer_size: 1024,
	});

	debug_view = gb.debug_view.new(gb.dom.get('.canvas'), 10,10, 1.0);
	gb.debug_view.hide(debug_view);
	//END

	construct = gb.scene.new();
	
	camera = gb.camera.new(gb.Projection.ORTHO, 0, 100, 60, 0, gb.webgl.view[1]);
	gb.vec3.set(camera.entity.position, gb.webgl.view[0] / 2, gb.webgl.view[1] / 2, 3.0);
	gb.scene.add(camera, construct);

	var vb = gb.vertex_buffer.new();
	gb.vertex_buffer.add_attribute(vb, 'position', 3, false);
	gb.vertex_buffer.add_attribute(vb, 'color', 4, true);
	gb.vertex_buffer.alloc(vb, 1024);

	var ib = gb.index_buffer.new((1024 / 4) * 3);

    var mesh = gb.mesh.new(vb, ib, 'TRIANGLES', 'DYNAMIC_DRAW');
    mesh.vertex_offset = 0;
    mesh.index_offset = 0;
    mesh.triangle_offset = 0;

    square = gb.entity.mesh(mesh, material);
	gb.scene.add(square, construct);

    // CREATE CONTEXT

    reset_quad_array(context);

    //context.quads.push(new Quad(0, 0, gb.webgl.view[0], gb.webgl.view[1], gb.color.new(0.3,0.3,0.3,1.0)));
    //update_quad_array(context);

	//DEBUG
	gb.debug_view.watch(debug_view, 'Pos', camera.entity, 'position');
	gb.debug_view.watch(debug_view, 'Mouse', gb.input, 'mouse_position');
	//END
}

function update(dt)
{
	//gb.camera.fly(camera, dt, 80);
	gb.scene.update(construct, dt);

	var draw = gb.gl_draw;
	var view = gb.webgl.view;
	var input = gb.input;
	var v2 = gb.vec2;

	var press = input.down(gb.Keys.mouse_left);
	var mp = input.mouse_position;
	var mx = mp[0];
	var my = view[1] - mp[1];
	//TODO: will have to project this if we move the camera at all

	draw.clear();

	if(input.down(gb.Keys.r))
	{
		reset_quad_array(context);
	}

	clear_selection(context);
	select_quads(context, mx,my);
	draw_selection(context);
	draw_tool(context, mx,my);

	if(press)
	{
		split_quads(context, mx,my);
		context.split_count = 1;
	}

	// set split mode

	if(input.down(gb.Keys.x))
	{
		context.split_mode++;
		if(context.split_mode === SplitMode.COUNT)
			context.split_mode = 0;
		if(context.tool_mode === ToolMode.POINT)
			context.split_mode = SplitMode.LOCAL;
	}

	// set split count

	if(input.down(gb.Keys.right))
	{
		context.split_count++;
		if(context.split_count > 5) context.split_count = 5;
	}
	else if(input.down(gb.Keys.left))
	{
		context.split_count--;
		if(context.split_count < 1) context.split_count = 1;
	}

	// cycle tools

	if(input.down(gb.Keys.z))
	{
		context.tool_mode++;
		if(context.tool_mode === ToolMode.COUNT)
			context.tool_mode = 0;
		if(context.tool_mode === ToolMode.POINT)
		{
			context.split_count = 1;
			context.split_mode = SplitMode.LOCAL;
		}
	}

	gb.debug_view.update(debug_view);
}

function render()
{
	//DEBUG
	gb.webgl.verify_context();
	//END

	gb.webgl.render_mesh(square.mesh, square.material, camera, square.world_matrix);
	gb.gl_draw.render(camera);
}

function reset_quad_array(ctx)
{
	ctx.quads = [];
	var q = new Quad(0, 0, gb.webgl.view[0], gb.webgl.view[1], gb.color.new(0.3,0.3,0.3,1.0));
	context.quads.push(q);
    update_quad_array(context);
}


// SELECTION

function clear_selection(ctx)
{
	ctx.selection = 0;
}

function select_quads(ctx, x,y)
{
	// find a selection for the current tool and split mode

	if(ctx.split_mode === SplitMode.LOCAL)
	{
		select_quads_at_point(ctx, x,y);
	}
	else
	{
		/*
		switch(ctx.tool_mode)
		{
			case ToolMode.HORIZONTAL:


			break;
			case ToolMode.VERTICAL:


			break;
			case ToolMode.POINT:


			break;
		}
		*/
	}
}
function select_quads_at_point(ctx, x,y)
{
	// TODO: take into account z-index
	var n = ctx.quads.length;
	for(var i = 0; i < n; ++i)
	{
		var quad = ctx.quads[i];
		if(gb.intersect.point_rect(x,y, quad.rect))
		{
			ctx.selection = quad.id;
		}
	}
}
/*
function select_quads_along_line(ctx, ax,ay, bx,by)
{
	var n = ctx.quads.length;
	for(var i = 0; i < n; ++i)
	{
		var quad = ctx.quads[i];
		if(gb.intersect.line_rect(ax,ay,bx,by, quad.rect) && quad.selected === false)
		{
			ctx.selection.array[ctx.selection_count] = quad.id;
			ctx.selection.count++;
			quad.selected = true;
		}
	}
}
*/

function draw_selection(ctx)
{
	gb.gl_draw.set_color(1,0,0,0.2);
	gb.gl_draw.rect(ctx.quads[ctx.selection].rect);
}

function draw_tool(ctx, x,y)
{
	var draw = gb.gl_draw;
	var view = gb.webgl.view;
	draw.set_color(1,1,1,0.2);

	switch(ctx.tool_mode)
	{
		case ToolMode.HORIZONTAL:

			if(ctx.split_mode === SplitMode.LOCAL)
			{
				var quad = ctx.quads[ctx.selection];
				var rect = quad.rect;

				if(ctx.split_count === 1) 
				{
					draw.line_f(rect.min_x,y,0,  rect.max_x,y,0);
				}
				else
				{
					var step = rect.h / (ctx.split_count+1);
					var ly = rect.min_y + step;
					for(var i = 0; i < ctx.split_count; ++i)
					{
						draw.line_f(rect.min_x,ly,0, rect.max_x,ly,0);
						ly += step;
					}
				}
			}
			else
			{
				if(ctx.split_count === 1) draw.line_f(0,y,0, view[0],y,0);
				else
				{
					var step = view[1] / (ctx.split_count+1);
					var ly = step;
					for(var i = 0; i < ctx.split_count; ++i)
					{
						draw.line_f(0,ly,0, view[0],ly,0);
						ly += step;
					}
				}
			}

		break;
		case ToolMode.VERTICAL:

			if(ctx.split_mode === SplitMode.LOCAL)
			{
				var quad = ctx.quads[ctx.selection];
				var rect = quad.rect;

				if(ctx.split_count === 1) 
				{
					draw.line_f(x,rect.min_y,0,  x,rect.max_y,0);
				}
				else
				{
					var step = rect.w / (ctx.split_count+1);
					var lx = rect.min_x + step;
					for(var i = 0; i < ctx.split_count; ++i)
					{
						draw.line_f(lx,rect.min_y,0, lx,rect.max_y,0);
						lx += step;
					}
				}
			}
			else
			{
				if(ctx.split_count === 1) draw.line_f(x,0,0, x,view[1],0);
				else
				{
					var step = view[0] / (ctx.split_count+1);
					var lx = step;
					for(var i = 0; i < ctx.split_count; ++i)
					{
						draw.line_f(lx,0,0, lx,view[1],0);
						lx += step;
					}
				}
			}

		break;
		case ToolMode.POINT:

			var quad = ctx.quads[ctx.selection];
			var rect = quad.rect;

			draw.line_f(rect.min_x,y,0, rect.max_x,y,0);
			draw.line_f(x,rect.min_y,0, x,rect.max_y,0);

		break;
	}
}


function split_quads(ctx, x,y)
{
	if(ctx.split_mode === SplitMode.LOCAL)
	{
		switch(ctx.tool_mode)
		{
			case ToolMode.HORIZONTAL:

				split_quad_horizontal(ctx, ctx.selection, y, ctx.split_count);

			break;
			case ToolMode.VERTICAL:

				split_quad_vertical(ctx, ctx.selection, x, ctx.split_count);

			break;
			case ToolMode.POINT:

				split_quad_at_point(ctx, ctx.selection, x,y);

			break;
		}
	}

	update_quad_array(ctx);
}

function split_quad_at_point(ctx, id, x,y)
{
	var quad = ctx.quads[id];
	var r = quad.rect;

	// make 3 new quads, modify the first
	var r = quad.rect;
	var c = quad.color;

	var tr = new Quad(x,y,r.max_x,r.max_y, gb.color.random_gray(0.3,0.6));
	var bl = new Quad(r.min_x,r.min_y,x,y, gb.color.random_gray(0.3,0.6));
	var br = new Quad(x,r.min_y,r.max_x,y, gb.color.random_gray(0.3,0.6));
	gb.rect.set_min_max(r, r.min_x, y, x, r.max_y);

	ctx.new_quads.push(tr);
	ctx.new_quads.push(bl);
	ctx.new_quads.push(br);
}

function split_quad_vertical(ctx, id, x, count)
{
	var quad = ctx.quads[id];
	var r = quad.rect;

	if(count < 2)
	{
		var right = new Quad(x,r.min_y, r.max_x,r.max_y, gb.color.random_gray(0.3,0.6));
		gb.rect.set_min_max(r, r.min_x, r.min_y, x, r.max_y);
		ctx.new_quads.push(right);
	}
	else
	{
		var step = r.w / (count+1);
		var lx = r.min_x + step;
		for(var i = 0; i < count; ++i)
		{
			var new_quad = new Quad(lx,r.min_y, lx+step,r.max_y, gb.color.random_gray(0.3,0.6));
			ctx.new_quads.push(new_quad);
			lx += step;
		}

		gb.rect.set_min_max(r, r.min_x, r.min_y, r.min_x + step, r.max_y);
	}
}
function split_quad_horizontal(ctx, id, y, count)
{
	var quad = ctx.quads[id];
	var r = quad.rect;

	if(count < 2)
	{
		var bottom = new Quad(r.min_x,r.min_y, r.max_x,y, gb.color.random_gray(0.3,0.6));
		gb.rect.set_min_max(r, r.min_x, y, r.max_x, r.max_y);
		ctx.new_quads.push(bottom);
	}
	else
	{
		var step = r.h / (count+1);
		var ly = r.min_y + step;
		for(var i = 0; i < count; ++i)
		{
			var new_quad = new Quad(r.min_x,ly, r.max_x,ly+step, gb.color.random_gray(0.3,0.6));
			ctx.new_quads.push(new_quad);
			ly += step;
		}

		gb.rect.set_min_max(r, r.min_x, r.min_y, r.max_x, r.min_y + step);
	}

}

function update_quad_array(ctx)
{
	//TODO remove and removed quads

	// concat new rect to current ones

	ctx.quads = ctx.quads.concat(ctx.new_quads);
	ctx.new_quads = [];

	var n = ctx.quads.length;
	for(var i = 0; i < n; ++i)
		ctx.quads[i].id = i;

	push_quads(square.mesh, context.quads);
}


// MESH RELATED STUFF

function push_quad(mesh, rect, depth, color)
{
	var d = mesh.vertex_buffer.data;
	var i = mesh.index_buffer.data;
	var io = mesh.index_offset;
	var to = mesh.triangle_offset;

	push_vertex(mesh, rect.min_x,rect.min_y, depth, color);
	push_vertex(mesh, rect.max_x,rect.min_y, depth, color);
	push_vertex(mesh, rect.max_x,rect.max_y, depth, color);
	push_vertex(mesh, rect.min_x,rect.max_y, depth, color);

	i[io]   = to;
	i[io+1] = to+1;
	i[io+2] = to+2;

	i[io+3] = to;
	i[io+4] = to+2;
	i[io+5] = to+3;

	mesh.index_offset += 6;
	mesh.triangle_offset += 4;
}
function push_vertex(mesh, x,y,z, c)
{
	var d = mesh.vertex_buffer.data;
	var vo = mesh.vertex_offset;

	d[vo]   = x;
	d[vo+1] = y;
	d[vo+2] = z;

	d[vo+3] = c[0];
	d[vo+4] = c[1];
	d[vo+5] = c[2];
	d[vo+6] = c[3];

	mesh.vertex_offset += 7;
	mesh.vertex_count += 1;
}
function push_quads(mesh, rects)
{
	gb.mesh.clear(mesh);
	var n = rects.length;
	for(var i = 0; i < n; ++i)
	{
		var r = rects[i];
		push_quad(mesh, r.rect, r.depth, r.color);
	}
	gb.mesh.update(mesh);	
}

window.addEventListener('load', init, false);


/*
gb.camera.fly = function(c, dt, vertical_limit)
{
	if(c.fly_mode === undefined) 
	{
		c.fly_mode = false;
		c.angle_x = 0;
		c.angle_y = 0;
		c.velocity = gb.vec3.new();
	}
	if(gb.input.down(gb.Keys.f))
	{
		c.fly_mode = !c.fly_mode;
	}
	if(c.fly_mode === false) return;

	var e = c.entity;
	var index = gb.vec3.stack.index;

	var m_delta = gb.input.mouse_delta;
	var ROTATE_SPEED = 30.0;

	c.angle_x -= m_delta[1] * ROTATE_SPEED * dt;
	c.angle_y -= m_delta[0] * ROTATE_SPEED * dt;
	
	if(c.angle_x > vertical_limit) c.angle_x = vertical_limit;
	if(c.angle_x < -vertical_limit) c.angle_x = -vertical_limit;

	var rot_x = gb.quat.tmp();
	var rot_y = gb.quat.tmp();
	var rot_lerp = gb.quat.tmp();

	var right = gb.vec3.tmp(1,0,0);
	var up = gb.vec3.tmp(0,1,0);

	gb.quat.angle_axis(rot_x, c.angle_x, right);
	gb.quat.angle_axis(rot_y, c.angle_y, up);

	gb.quat.mul(rot_lerp, rot_y, rot_x);
	gb.quat.lerp(e.rotation, e.rotation, rot_lerp, 0.1);

	var accel = gb.vec3.tmp();
	var MOVE_SPEED = 0.1;
	if(gb.input.held(gb.Keys.a))
	{
		accel[0] = -MOVE_SPEED * dt;
	}
	else if(gb.input.held(gb.Keys.d))
	{
		accel[0] = MOVE_SPEED * dt;
	}
	if(gb.input.held(gb.Keys.w))
	{
		accel[2] = -MOVE_SPEED * dt;
	}
	else if(gb.input.held(gb.Keys.s))
	{
		accel[2] = MOVE_SPEED * dt;
	}
	if(gb.input.held(gb.Keys.q))
	{
		accel[1] = -MOVE_SPEED * dt;
	}
	else if(gb.input.held(gb.Keys.e))
	{
		accel[1] = MOVE_SPEED * dt;
	}

	gb.mat4.mul_dir(accel, e.world_matrix, accel);

	gb.vec3.add(c.velocity, accel, c.velocity);
	gb.vec3.mulf(c.velocity, c.velocity, 0.9);

	gb.vec3.add(e.position, c.velocity, e.position);
	e.dirty = true;

	gb.entity.update(c.entity);

	gb.vec3.stack.index = index;
}
*/