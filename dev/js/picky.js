var v3 = gb.vec3;

var camera;
var construct;
var material;
var square;
gb.mouse_angle = 0;

var rectangles = [];

//DEBUG
var debug_view;
var fov_slider;
var size_slider;
//END

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



	var vs = 'attribute vec3 position;attribute vec4 color;uniform mat4 mvp;varying vec4 _color;void main(){_color = color;gl_Position = mvp * vec4(position, 1.0);}';
    var fs = 'precision highp float;varying vec4 _color;void main(){gl_FragColor = _color;}'; 
	material = gb.material.new(gb.shader.new(vs,fs));

	//DEBUG
	gb.gl_draw.init(
	{
		buffer_size: 1024,
	});

	debug_view = gb.debug_view.new(gb.dom.get('.canvas'), 10,10, 1.0);
	//END

	construct = gb.scene.new();
	
	camera = gb.camera.new(gb.Projection.ORTHO, 0, 100, 60, 0, gb.webgl.view[1]);
	gb.vec3.set(camera.entity.position, gb.webgl.view[0] / 2, gb.webgl.view[1] / 2, 3.0);
	gb.scene.add(camera, construct);

	var vb = gb.vertex_buffer.new();
	gb.vertex_buffer.add_attribute(vb, 'position', 2, false);
	gb.vertex_buffer.add_attribute(vb, 'color', 4, true);
	gb.vertex_buffer.alloc(vb, 1024);

	var ib = gb.index_buffer.new((1024 / 4) * 3);

    var mesh = gb.mesh.new(vb, ib, 'TRIANGLES', 'DYNAMIC_DRAW');
    mesh.vertex_offset = 0;
    mesh.index_offset = 0;
    mesh.triangle_offset = 0;

    //rectangles.push([0,0,300,300]);;

    push_quad(mesh, 0,0,gb.webgl.view[0], gb.webgl.view[1],	 0.5,0.3,0.2,1.0);
    //push_quad(mesh, 1,1,1.5,1.5, 0.5,0.5,0.2,1.0);
    //push_quad(mesh, 0,2,3.0,3.0, 0.5,0.3,0.5,1.0);

	gb.mesh.update(mesh);	

	square = gb.entity.mesh(mesh, material);
	gb.scene.add(square, construct);

	gb.debug_view.watch(debug_view, 'Pos', camera.entity, 'position');
	gb.debug_view.watch(debug_view, 'Mouse', gb.input, 'mouse_position');
	gb.debug_view.watch(debug_view, 'Angle', gb, 'mouse_angle');

	fov_slider = gb.debug_view.control(debug_view, 'fov', 1, 60, 1, 60);
	size_slider = gb.debug_view.control(debug_view, 'size', 1, 1024, 1, gb.webgl.view[1]);
}

function update(dt)
{
	gb.camera.fly(camera, dt, 80);
	gb.scene.update(construct, dt);

	/*
	camera.fov = fov_slider.value;
	camera.scale = size_slider.value;
	gb.camera.update_projection(camera, gb.webgl.view);
	*/

	var draw = gb.gl_draw;
	var view = gb.webgl.view;

	var mp = gb.input.mouse_position;
	var mx = mp[0];
	var my = view[1] - mp[1];

	draw.clear();
	draw.line_f(mx,0,0, mx,view[1],0);
	draw.line_f(0,my,0, view[0],my,0);

	draw.set_color(0.6,0.2,0.2,1.0);
	draw.line_f(0,0,0, view[0],view[1], 0);
	draw.line_f(view[0],0,0, 0,view[1],0);

	draw.set_color(0.5,0.5,1.0,1.0);

	gb.mouse_angle = (gb.vec2.angle_between(gb.vec2.tmp(view[0] / 2, view[1] / 2), mp) + 180);

	if((gb.mouse_angle > 0 && gb.mouse_angle < 45))
	{
		draw.line_f(view[0] / 2,0,0, view[0] / 2,view[1],0);
	}
	else
	{
		draw.line_f(0,view[1] / 2,0, view[0],view[1]/2,0);
	}
	

	gb.debug_view.update(debug_view);
}

function render()
{
	/*
	gb.canvas.clear('#CCCCCC');

	var m_pos = gb.input.mouse_position;
	gb.canvas.line(m_pos[0], 0, m_pos[0], gb.canvas.canvas.height);
	gb.canvas.stroke(4, '#EEEEEE');
	*/

	//DEBUG
	gb.webgl.verify_context();
	//END

	gb.webgl.render_mesh(square.mesh, square.material, camera, square.world_matrix);

	gb.gl_draw.render(camera);
}

function push_quad(mesh, ax,ay, bx,by, r,g,b,a)
{
	var d = mesh.vertex_buffer.data;
	var i = mesh.index_buffer.data;
	var io = mesh.index_offset;
	var to = mesh.triangle_offset;

	push_vertex(mesh, ax,ay, r,g,b,a);
	push_vertex(mesh, bx,ay, r,g,b,a);
	push_vertex(mesh, bx,by, r,g,b,a);
	push_vertex(mesh, ax,by, r,g,b,a);

	i[io]   = to;
	i[io+1] = to+1;
	i[io+2] = to+2;

	i[io+3] = to;
	i[io+4] = to+2;
	i[io+5] = to+3;

	mesh.index_offset += 6;
	mesh.triangle_offset += 4;
}
function push_vertex(mesh, x,y, r,g,b,a)
{
	var d = mesh.vertex_buffer.data;
	var vo = mesh.vertex_offset;

	d[vo]   = x;
	d[vo+1] = y;

	d[vo+2] = r;
	d[vo+3] = g;
	d[vo+4] = b;
	d[vo+5] = a;

	mesh.vertex_offset += 6;
	mesh.vertex_count += 1;
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