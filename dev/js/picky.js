var v3 = gb.vec3;

var camera;
var construct;
var material;
var square;
gb.mouse_angle = 0;

var ToolMode = 
{
	VERTICAL: 0,
	HORIZONTAL: 1,
	POINT: 2,
	COUNT: 3,
};
var tool_mode = ToolMode.VERTICAL;

var quads = [];

//DEBUG
var debug_view;
var fov_slider;
var size_slider;
//END

var Quad = function(ax,ay,bx,by, r,g,b)
{
	this.rect = new gb.rect.new(ax,ay,bx,by);
	this.depth = 0;
	this.color = new gb.color.new(r,g,b,1);
	this.id = -1;
}

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

    quads.push(new Quad(0, 0, gb.webgl.view[0], gb.webgl.view[1], 0.3,0.3,0.3));
    update_quad_array(quads);
    push_quads(mesh, quads);

	square = gb.entity.mesh(mesh, material);
	gb.scene.add(square, construct);

	//DEBUG
	gb.debug_view.watch(debug_view, 'Pos', camera.entity, 'position');
	gb.debug_view.watch(debug_view, 'Mouse', gb.input, 'mouse_position');
	gb.debug_view.watch(debug_view, 'Angle', gb, 'mouse_angle');

	fov_slider = gb.debug_view.control(debug_view, 'fov', 1, 60, 1, 60);
	size_slider = gb.debug_view.control(debug_view, 'size', 1, 1024, 1, gb.webgl.view[1]);
	//END
}

function update(dt)
{
	gb.camera.fly(camera, dt, 80);
	gb.scene.update(construct, dt);

	var draw = gb.gl_draw;
	var view = gb.webgl.view;
	var v2 = gb.vec2;

	var press = gb.input.down(gb.Keys.mouse_left);
	var mp = gb.input.mouse_position;
	var mx = mp[0];
	var my = view[1] - mp[1];
	//TODO: will have to project this if we move the camera at all

	//TODO: global and local split
	//TODO: multisplit on mouse wheel
	//TODO: joining
	//TODO: floating quads

	draw.clear();

	if(gb.input.down(gb.Keys.r))
	{
		quads = [];
		quads.push(new Quad(0, 0, gb.webgl.view[0], gb.webgl.view[1], 0.3,0.3,0.3));
	    update_quad_array(quads);
	    push_quads(square.mesh, quads);
	}

	var quad_id = find_quad_at_point(quads, mx,my);
	if(quad_id !== -1)
	{
		highlight_quad(quads, quad_id);
		gb.gl_draw.set_color(1,1,1,0.1);

		var active_quad = quads[quad_id];
		var active_rect = active_quad.rect;
		switch(tool_mode)
		{
			case ToolMode.HORIZONTAL:

				//draw split
				draw.line_f(active_rect.min_x,my,0, active_rect.max_x,my,0);

				//check action
				if(press)
				{
					split_quad_horizontal(quad_id, quads, mx,my);
					push_quads(square.mesh, quads);
				}

			break;
			case ToolMode.VERTICAL:

				//draw split
				draw.line_f(mx, active_rect.max_y,0, mx,active_rect.min_y,0);

				//check action
				if(press)
				{
					split_quad_vertical(quad_id, quads, mx,my);
					push_quads(square.mesh, quads);
				}

			break;
			case ToolMode.POINT:

				//draw split
				draw.line_f(mx, active_rect.max_y,0, mx,active_rect.min_y,0);
				draw.line_f(active_rect.min_x,my,0, active_rect.max_x,my,0);

				//check action
				if(press)
				{
					split_quad_at_point(quad_id, quads, mx,my);
					push_quads(square.mesh, quads);
				}

			break;
		}
	}

	// cycle tools

	if(gb.input.down(gb.Keys.z))
	{
		tool_mode++;
		if(tool_mode === ToolMode.COUNT)
			tool_mode = 0;
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

function highlight_quad(array, id)
{
	var quad = array[id];
	var r = quad.rect;

	gb.gl_draw.set_color(1,1,1,0.2);
	gb.gl_draw.rect(r);
}

function find_quad_at_point(array, x,y)
{
	var n = array.length;
	for(var i = 0; i < n; ++i)
	{
		var r = array[i].rect;
		if(x < r.max_x && x > r.min_x && y < r.max_y && y > r.min_y)
		{
			return i;
		}
	}
	return -1;
}

function split_quad_at_point(id, array, x,y)
{
	var quad = array[id];

	// make 3 new quads, modify the first
	var r = quad.rect;
	var c = quad.color;

	var tr = new Quad(x,y,r.max_x,r.max_y, c[0] + 0.1, c[1] + 0.1, c[2] - 0.1);
	var bl = new Quad(r.min_x,r.min_y,x,y, c[0] + 0.1, c[1] - 0.1, c[2] + 0.1);
	var br = new Quad(x,r.min_y,r.max_x,y, c[0] - 0.1, c[1] + 0.1, c[2] - 0.1);
	
	gb.rect.set_min_max(r, r.min_x, y, x, r.max_y);

	gb.array.insert_items(array, id, tr,bl,br);

	update_quad_array(array);
}
function split_quad_vertical(id, array, x,y)
{
	var quad = array[id];

	// make 1 new quad, modify the first
	var r = quad.rect;
	var c = quad.color;

	var right = new Quad(x,r.min_y, r.max_x,r.max_y, c[0] + 0.1, c[1] + 0.1, c[2] - 0.1);
	gb.rect.set_min_max(r, r.min_x, r.min_y, x, r.max_y);

	gb.array.insert_at(array, right, id+1);

	update_quad_array(array);
}
function split_quad_horizontal(id, array, x,y)
{
	var quad = array[id];

	// make 1 new quad, modify the first
	var r = quad.rect;
	var c = quad.color;

	var bottom = new Quad(r.min_x,r.min_y, r.max_x,y, c[0] + 0.1, c[1] + 0.1, c[2] - 0.1);
	gb.rect.set_min_max(r, r.min_x, y, r.max_x, r.max_y);

	gb.array.insert_at(array, bottom, id+1);

	update_quad_array(array);
}

function update_quad_array(array)
{
	var n = array.length;
	for(var i = 0; i < n; ++i)
		array[i].id = i;
}

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

	// Draw reticule cross... (yeah, I know)
	/*
	var vx = gb.webgl.view.width / 2;
	var vy = gb.webgl.view.height / 2;

	var size = 5;
	var ct = v3.tmp(vx, vy + size,0);
	var cb = v3.tmp(vx, vy - size,0);
	var cl = v3.tmp(vx - size, vy);
	var cr = v3.tmp(vx + size, vy);
	gb.projections.screen_to_world(ct, c.view_projection, ct, gb.webgl.view);
	gb.projections.screen_to_world(cb, c.view_projection, cb, gb.webgl.view);
	gb.projections.screen_to_world(cl, c.view_projection, cl, gb.webgl.view);
	gb.projections.screen_to_world(cr, c.view_projection, cr, gb.webgl.view);
	gb.gl_draw.line(ct, cb);
	gb.gl_draw.line(cl, cr);
	*/

	gb.vec3.stack.index = index;
}