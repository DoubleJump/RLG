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
gb.stack_array = [];
gb.Stack = function(type, count)
{
	this.data = [];
	this.index = 0;
	this.count = count;

	for(var i = 0; i < count; ++i)
		this.data.push(new type());

	gb.stack.active_stacks.push(this);
}
gb.stack = 
{
	active_stacks : [],
	get: function(s)
	{
		var r = s.data[s.index];
		s.index += 1;
		if(s.index === s.count)
		{
			console.error("Stack overflow");
		}
		return r;
	},
	clear_all: function()
	{
		var n = gb.stack.active_stacks.length;
		for(var i = 0; i < n; ++i)
			gb.stack.active_stacks[i].index = 0;
	},
}
gb.ajax = 
{
	GET: function(url, on_load, on_progress)
	{
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.onload = on_load;
		request.onprogress = on_progress || gb.event_load_progress;
		request.responseType = 'arraybuffer';
		request.upload.callback = on_load;
		return request;
	}
}
gb.Binary_Reader = function(buffer)
{
	this.buffer = buffer;
	this.bytes = new DataView(buffer);
	this.offset = 0;
}

gb.binary_reader =
{
	b32: function(br)
	{
		var r = br.bytes.getInt32(br.offset, true);
		br.offset += 4;
		if(r === 1) return true;
		return false;
	},
	i32: function(br)
	{
		var r = br.bytes.getInt32(br.offset, true);
		br.offset += 4;
		return r;
	},
	u32: function(br)
	{
		var r = br.bytes.getUint32(br.offset, true);
		br.offset += 4;
		return r;
	},
	f32: function(br)
	{
		var r = br.bytes.getFloat32(br.offset, true);
		br.offset += 4;
		return r;
	},
	string: function(br)
	{
		var _t = gb.binary_reader;
		var pad = _t.i32(br);
        var l = _t.i32(br);
    	var r = String.fromCharCode.apply(null, new Uint8Array(br.buffer, br.offset, l));
        br.offset += l;
        br.offset += pad;
        return r;
	},
	f32_array: function(br, l)
	{
		var r = new Float32Array(br.buffer, br.offset, l);
		br.offset += l * 4;
		return r;
	},
	u8_array: function(br, l)
	{
		var r = new Uint8Array(br.buffer, br.offset, l);
		br.offset += l;
		return r;
	},
	u32_array: function(br, l)
	{
		var r = new Uint32Array(br.buffer, br.offset, l);
		br.offset += l * 4;
		return r;
	},
	i32_array: function(br, l)
	{
		var r = new Int32Array(br.buffer, br.offset, l);
		br.offset += l * 4;
		return r;
	},
	vec3: function(br)
	{
		return gb.binary_reader.f32_array(br, 3);
	},
	vec4: function(br)
	{
		return gb.binary_reader.f32_array(br, 4);
	},
	mat3: function(br)
	{
		return gb.binary_reader.f32_array(br, 9);
	},
	mat4: function(br)
	{
		return gb.binary_reader.f32_array(br, 16);
	},
}
gb.math = 
{
	E: 2.71828182845904523536028747135266250,
	PI: 3.14159265358979323846264338327950288,
	TAU: 6.28318530718,
	DEG2RAD: 0.01745329251,
	RAD2DEG: 57.2957795,
	PI_OVER_360: 0.00872664625,
	EPSILON: 2.2204460492503131e-16,
	MAX_F32: 3.4028234e38,

	min: function(a, b)
	{
		if(a < b) return a; else return b;
	},
	max: function(a, b)
	{
		if(a > b) return a; else return b;
	},
	round: function(a)
	{
		return Math.round(a);
	},
	round_to: function(a, f)
	{
		return a.toFixed(f);
	},
	floor: function(a)
	{
		return Math.floor(a);
	},
	ceil: function(a)
	{
		return Math.ceil(a);
	},
	clamp: function(a, min, max)
	{
		if(a < min) return min;
		else if(a > max) return max;
		else return a;
	},
	abs: function(a)
	{
		return Math.abs(a);
	},
	square: function(a)
	{
		return a * a;
	},
	sqrt: function(a)
	{
		return Math.sqrt(a);
	},
	cos: function(a)
	{
		return Math.cos(a);
	},
	sin: function(a)
	{
		return Math.sin(a);
	},
	tan: function(a)
	{
		return Math.tan(a);
	},
	acos: function(a)
	{
		return Math.acos(a);
	},
	asin: function(a)
	{
		return Math.asin(a);
	},
	atan: function(a)
	{
		return Math.atan(a);
	},
	atan2: function(y, x)
	{
		return Math.atan2(y, x);
	},
	lerp: function(a,b,t)
	{
		return (1-t) * a + t * b;
	},
}
gb.Vec2 = function(x,y)
{
	return new Float32Array(2);
}

gb.Vec3 = function()
{
	return new Float32Array(3);
}

gb.vec2 = 
{
	stack: new gb.Stack(gb.Vec2, 20),

	new: function(x,y)
	{
		var r = new gb.Vec2();
		r[0] = x;
		r[1] = y;
		return r;
	},
	set: function(v, x,y)
	{
		v[0] = x;
		v[1] = y;
	},
	eq: function(a,b)
	{
		a[0] = b[0];
		a[1] = b[1];
	},
	tmp: function(x,y)
	{
		var _t = gb.vec2;
		var r = gb.stack.get(_t.stack);
		_t.set(r, x || 0, y || 0);
		return r;
	},
	add: function(r, a,b)
	{
		var x = a[0] + b[0];
		var y = a[1] + b[1];
		r[0] = x;
		r[1] = y;
	},
	sub: function(r, a,b)
	{
		var x = a[0] - b[0];
		var y = a[1] - b[1];
		r[0] = x;
		r[1] = y;
	},
	mulf: function(r, a,f)
	{
		var x = a[0] * f;
		var y = a[1] * f;
		r[0] = x;
		r[1] = y;
	},
	divf: function(r, a,f)
	{
		var x = a[0] / f;
		var y = a[1] / f;
		r[0] = x;
		r[1] = y;
	},
	inverse: function(r, a)
	{
		r[0] = -a[0];
		r[1] = -a[1];
	},
	sqr_length: function(v)
	{
		return v[0] * v[0] + v[1] * v[1];
	},
	length: function(v) 
	{
		return gb.math.sqrt(gb.vec2.sqr_length(v));
	},
	distance: function(a, b)
	{
		return gb.math.sqrt(gb.vec2.sqr_distance(a,b));
	},
	sqr_distance: function(a, b)
	{
		var dx = b[0] - a[0];
		var dy = b[1] - a[1];
		return dx * dx + dy * dy;
	},
	normalized: function(r, v) 
	{
		var _t = gb.vec2;
		var l = _t.sqr_length(v);
		var x, y;
		if(l > gb.math.EPSILON)
		{
			var il = gb.math.sqrt(1/l);
			x = v[0] * il;
			y = v[1] * il;
		} 
		else
		{
			x = v[0];
			y = v[1]; 
		}
		_t.set(r,x,y);
	},
	dot: function(a, b)
	{
		return a[0] * b[0] + a[1] * b[1];
	},
	perp: function(r, a)
	{
		var _t = gb.vec2;
		var x = -a[1];
		var y = a[0];
		_t.set(r,x,y);
		_t.normalized(r,r);
	},
	angle: function(a, b)
	{
		var _t = gb.vec2;
		var m = gb.math;
		var l = _t.length(a) * _t.length(b);

		if(l < m.EPSILON) l = m.EPSILON;
		
		var f = _t.dot(a, b) / l;
		if(f > 1) return m.acos(1);
		else if(f < 1) return m.acos(-1);
		else return m.acos(f);
	},
	min: function(r, a,b)
	{
		var m = gb.math;
		r[0] = m.min(a[0], b[0]);
		r[1] = m.min(a[1], b[1]);
	},
	max: function(r, a,b)
	{
		var m = gb.math;
		r[0] = m.max(a[0], b[0]);
		r[1] = m.max(a[1], b[1]);
	},
	lerp: function(r, a,b, t)
	{
		var it = 1-t;
		r[0] = it * a[0] + t * b[0];
		r[1] = it * a[1] + t * b[1];
	},
	clamp: function(r, min_x, min_y, max_x, max_y)
	{
		if(r[0] < min_x) r[0] = min_x;
		if(r[0] > max_x) r[0] = max_x;
		if(r[1] < min_y) r[1] = min_y;
		if(r[1] > max_y) r[1] = max_y;
	}
}

gb.vec3 = 
{
	stack: new gb.Stack(gb.Vec3, 64),

	new: function(x,y,z)
	{
		var r = new gb.Vec3();
		r[0] = x || 0;
		r[1] = y || 0;
		r[2] = z || 0;
		return r;
	},
	push: function()
	{
		return gb.vec3.stack.index;
	},
	pop: function(index)
	{
		gb.vec3.stack.index = index;
	},
	set: function(v, x,y,z)
	{
		v[0] = x;
		v[1] = y;
		v[2] = z;
	},
	eq: function(a,b)
	{
		a[0] = b[0];
		a[1] = b[1];
		a[2] = b[2];
	},
	tmp: function(x,y,z)
	{
		var _t = gb.vec3;
		var r = gb.stack.get(_t.stack);
		_t.set(r, x || 0, y || 0, z || 0);
		return r;
	},
	add: function(r, a,b)
	{
		r[0] = a[0] + b[0];
		r[1] = a[1] + b[1];
		r[2] = a[2] + b[2];
	},
	sub: function(r, a,b)
	{
		r[0] = a[0] - b[0];
		r[1] = a[1] - b[1];
		r[2] = a[2] - b[2];
	},
	mulf: function(r, a,f)
	{
		r[0] = a[0] * f;
		r[1] = a[1] * f;
		r[2] = a[2] * f;
	},
	divf: function(r, a,f)
	{
		r[0] = a[0] / f;
		r[1] = a[1] / f;
		r[2] = a[2] / f;
	},
	inverse: function(r, v)
	{
		r[0] = -v[0];
		r[1] = -v[1];
		r[2] = -v[2];
	},
	sqr_length: function(v)
	{
		return gb.vec3.dot(v,v);
	},
	length: function(v) 
	{
		return gb.math.sqrt(gb.vec3.sqr_length(v));
	},
	distance: function(a,b)
	{
		var _t = gb.vec3;
		var t = _t.tmp();
		_t.sub(t, a,b);
		return _t.length(t);
	},
	normalized: function(r, v) 
	{
		var _t = gb.vec3;
		var l = _t.sqr_length(v);
		if(l > gb.math.EPSILON)
		{
			_t.mulf(r, v, gb.math.sqrt(1 / l));
		} 
		else
		{
			_t.eq(r,v);
		}
	},
	dot: function(a, b)
	{
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	},
	cross: function(r, a, b)
	{
		var x = a[1] * b[2] - a[2] * b[1];
		var y = a[2] * b[0] - a[0] * b[2];
		var z = a[0] * b[1] - a[1] * b[0];
		gb.vec3.set(r, x,y,z);
	},
	angle: function(a, b)
	{
		var _t = gb.vec3;
		var m = gb.math;
		var l = _t.length(a) * _t.length(b);

		if(l < m.EPSILON) l = m.EPSILON;
		
		var f = _t.dot(a, b) / l;
		if(f > 1) return m.acos(1);
		else if(f < 1) return m.acos(-1);
		else return m.acos(f);
	},
	min: function(r, a,b)
	{
		var m = gb.math;
		r[0] = m.min(a[0], b[0]);
		r[1] = m.min(a[1], b[1]);
		r[2] = m.min(a[2], b[2]);
	},
	max: function(r, a,b)
	{
		var m = gb.math;
		r[0] = m.max(a[0], b[0]);
		r[1] = m.max(a[1], b[1]);
		r[2] = m.max(a[2], b[2]);
	},
	reflect: function(r, a,n)
	{
		var _t = gb.vec3;
		_t.add(r, v,n);
		_t.mulf(r, -2.0 * _t.dot(v,n)); 
	},
	project: function(r, a,b)
	{
		var _t = gb.vec3;
		_t.mulf(r, _t.dot(a,b));
		var sqr_l = _t.sqr_length(r);
		if(sqr_l < 1)
		{
			_t.divf(r, gb.math.sqrt(sqr_l));
		}
	},
	tangent: function(r, a,b, plane)
	{
		var _t = gb.vec3;
		var t = v3.tmp();
		_t.add(t, b,a);
		_t.normalized(t,t);
		_t.cross(r, t,plane);
		_t.stack.index--;
	},
	rotate: function(r, v,q)
	{
		var tx = (q[1] * v[2] - q[2] * v[1]) * 2;
		var ty = (q[2] * v[0] - q[0] * v[2]) * 2;
		var tz = (q[0] * v[1] - q[1] * v[0]) * 2;

		var cx = q[1] * tz - q[2] * ty;
		var cy = q[2] * tx - q[0] * tz;
		var cz = q[0] * ty - q[1] * tx;

		r[0] = v[0] + q[2] * tx + cx,
		r[1] = v[1] + q[2] * ty + cy,
		r[2] = v[2] + q[2] * tz + cz
	},
	lerp: function(r, a,b, t)
	{
		var it = 1-t;
		r[0] = it * a[0] + t * b[0];
		r[1] = it * a[1] + t * b[1];
		r[2] = it * a[2] + t * b[2];
	},
}
gb.Mat3 = function()
{
	return new Float32Array(9);
}
gb.Mat4 = function()
{
	return new Float32Array(16);
}

gb.mat3 =
{
	stack: new gb.Stack(gb.Mat3, 16),

	new: function()
	{
		var _t = gb.mat3;
		var r = new gb.Mat3();
		_t.identity(r);
		return r;		
	},
	eq: function(a,b)
	{
		for(var i = 0; i < 9; ++i)
			a[i] = b[i];
	},
	tmp: function()
	{
		var _t = gb.mat3;
		var r = gb.stack.get(_t.stack);
		_t.identity(r);
		return r;
	},
	from_mat4: function(r, m)
	{
		r[0] = m[0]; 
		r[1] = m[1]; 
		r[2] = m[2];
		r[3] = m[4]; 
		r[4] = m[5]; 
		r[5] = m[6];
		r[6] = m[8]; 
		r[7] = m[9]; 
		r[8] = m[10];
	},

	identity: function(m)
	{
		m[0] = 1; m[1] = 0; m[2] = 0;
		m[3] = 0; m[4] = 1; m[5] = 0;
		m[6] = 0; m[7] = 0; m[8] = 1;
	},

	determinant: function(m)
	{
		return m[0] * (m[4] * m[8] - m[5] * m[7]) -
	      	   m[1] * (m[3] * m[8] - m[5] * m[6]) +
	      	   m[2] * (m[3] * m[7] - m[4] * m[6]);
	},

	inverse: function(r, m)
	{
		var math = gb.math;
		var _t = gb.mat3;
		var t = _t.tmp();

	    t[0] = m[4] * m[8] - m[5] * m[7];
	    t[1] = m[2] * m[7] - m[1] * m[8];
	    t[2] = m[1] * m[5] - m[2] * m[4];
	    t[3] = m[5] * m[6] - m[3] * m[8];
	    t[4] = m[0] * m[8] - m[2] * m[6];
	    t[5] = m[2] * m[3] - m[0] * m[5];
	    t[6] = m[3] * m[7] - m[4] * m[6];
	    t[7] = m[1] * m[6] - m[0] * m[7];
	    t[8] = m[0] * m[4] - m[1] * m[3];

	    var det = m[0] * t[0] + m[1] * t[3] + m[2] * t[6];
	    if(math.abs(det) <= math.EPSILON)
	    {
	    	_t.identity(r);
	    }

	   	var idet = 1 / det;
	   	for(var i = 0; i < 9; ++i)
	   		r[i] = t[i] * idet;
	},

	mul: function(r, a,b)
	{
		var _t = gb.mat3;
		var t = _t.tmp();
		t[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
		t[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
		t[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];
		t[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
		t[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
		t[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];
		t[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
		t[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
		t[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];
		_t.eq(r,t);
	},

	transposed: function(r,m)
	{
		var _t = gb.mat3;
		var t = _t.tmp();
		t[1] = m[3];
		t[2] = m[6]; 
		t[3] = m[1];
		t[5] = m[7]; 
		t[6] = m[2]; 
		t[7] = m[5];
		t[8] = m[0];
		for(var i = 0; i < 9; ++i)
	   		r[i] = t[i];		
	},

	set_position: function(m, x, y)
	{
		m[2] = x;
		m[5] = y;
	},

	set_rotation: function(m, r)
	{
		var x2 = 2 * r[0]; 
		var y2 = 2 * r[1]; 
		var z2 = 2 * r[2];
		var xx = r[0] * x2; 
		var xy = r[0] * y2; 
		var xz = r[0] * z2;
		var yy = r[1] * y2;
		var yz = r[1] * z2;
		var zz = r[2] * z2;
		var wx = r[3] * x2; 
		var wy = r[3] * y2;
		var wz = r[3] * z2;

		m[0] = 1 - (yy + zz);
		m[1] = xy + wz;
		m[2] = xz - wy;
		m[3] = xy - wz;
		m[4] = 1 - (xx + zz);
		m[5] = yz + wx;
		m[6] = xz + wy;
		m[7] = yz - wx;
		m[8] = 1 - (xx + yy);
	},

	compose: function(m, x,y, sx,sy, r)
	{
		var theta = r * gb.math.DEG2RAD;
		var st = gb.math.sin(theta);
		var ct = gb.math.cos(theta);

		m[0] = ct * sx;
		m[1] = st;
		m[2] = x;
		m[3] = -st;
		m[4] = ct * sy;
		m[5] = y;
		m[6] = 0;
		m[7] = 0;
		m[8] = 1;
	},
	compose_t: function(m, p, s, r)
	{
		var theta = r * gb.math.DEG2RAD;
		var st = gb.math.sin(theta);
		var ct = gb.math.cos(theta);

		m[0] = ct * s[0];
		m[1] = st;
		m[2] = p[0];
		m[3] = -st;
		m[4] = ct * s[1];
		m[5] = p[1];
		m[6] = 0;
		m[7] = 0;
		m[8] = 1;
	},
}

gb.mat4 =
{
	stack: new gb.Stack(gb.Mat4, 16),

	new: function()
	{
		var _t = gb.mat4;
		var r = new gb.Mat4();
		_t.identity(r);
		return r;		
	},
	eq: function(a,b)
	{
		for(var i = 0; i < 16; ++i)
			a[i] = b[i];
	},
	tmp: function()
	{
		var _t = gb.mat4;
		var r = gb.stack.get(_t.stack);
		_t.identity(r);
		return r;
	},
	identity: function(m)
	{
		m[ 0] = 1; m[ 1] = 0; m[ 2] = 0; m[ 3] = 0;
		m[ 4] = 0; m[ 5] = 1; m[ 6] = 0; m[ 7] = 0;
		m[ 8] = 0; m[ 9] = 0; m[10] = 1; m[11] = 0;
		m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	},
	mul: function(r, a,b)
	{
		var _t = gb.mat4;
		var i = _t.stack.index;
		var t = _t.tmp();
		t[ 0] = a[ 0] * b[0] + a[ 1] * b[4] + a[ 2] * b[ 8] + a[ 3] * b[12];
		t[ 1] = a[ 0] * b[1] + a[ 1] * b[5] + a[ 2] * b[ 9] + a[ 3] * b[13];
		t[ 2] = a[ 0] * b[2] + a[ 1] * b[6] + a[ 2] * b[10] + a[ 3] * b[14];
		t[ 3] = a[ 0] * b[3] + a[ 1] * b[7] + a[ 2] * b[11] + a[ 3] * b[15];
		t[ 4] = a[ 4] * b[0] + a[ 5] * b[4] + a[ 6] * b[ 8] + a[ 7] * b[12];
		t[ 5] = a[ 4] * b[1] + a[ 5] * b[5] + a[ 6] * b[ 9] + a[ 7] * b[13];
		t[ 6] = a[ 4] * b[2] + a[ 5] * b[6] + a[ 6] * b[10] + a[ 7] * b[14];
		t[ 7] = a[ 4] * b[3] + a[ 5] * b[7] + a[ 6] * b[11] + a[ 7] * b[15];	
		t[ 8] = a[ 8] * b[0] + a[ 9] * b[4] + a[10] * b[ 8] + a[11] * b[12];
		t[ 9] = a[ 8] * b[1] + a[ 9] * b[5] + a[10] * b[ 9] + a[11] * b[13];
		t[10] = a[ 8] * b[2] + a[ 9] * b[6] + a[10] * b[10] + a[11] * b[14];
		t[11] = a[ 8] * b[3] + a[ 9] * b[7] + a[10] * b[11] + a[11] * b[15];
		t[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[ 8] + a[15] * b[12];
		t[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[ 9] + a[15] * b[13];
		t[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
		t[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];
		_t.eq(r,t);
		_t.stack.index = i;
	},

	determinant: function(m)
	{
		var a0 = m[ 0] * m[ 5] - m[ 1] * m[ 4];
		var a1 = m[ 0] * m[ 6] - m[ 2] * m[ 4];
		var a2 = m[ 0] * m[ 7] - m[ 3] * m[ 4];
		var a3 = m[ 1] * m[ 6] - m[ 2] * m[ 5];
		var a4 = m[ 1] * m[ 7] - m[ 3] * m[ 5];
		var a5 = m[ 2] * m[ 7] - m[ 3] * m[ 6];
		var b0 = m[ 8] * m[13] - m[ 9] * m[12];
		var b1 = m[ 8] * m[14] - m[10] * m[12];
		var b2 = m[ 8] * m[15] - m[11] * m[12];
		var b3 = m[ 9] * m[14] - m[10] * m[13];
		var b4 = m[ 9] * m[15] - m[11] * m[13];
		var b5 = m[10] * m[15] - m[11] * m[14];
		return a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
	},

	transposed: function(r, m)
	{
		r[ 1] = m[ 4]; 
		r[ 2] = m[ 8]; 
		r[ 3] = m[12];
		r[ 4] = m[ 1]; 
		r[ 6] = m[ 9]; 
		r[ 7] = m[13];
		r[ 8] = m[ 2]; 
		r[ 9] = m[ 6]; 
		r[11] = m[14];
		r[12] = m[ 3]; 
		r[13] = m[ 7]; 
		r[14] = m[11];
		r[15] = m[15]; 	
	},
	inverse: function(r, m)
	{
		var v0 = m[ 2] * m[ 7] - m[ 6] * m[ 3];
		var v1 = m[ 2] * m[11] - m[10] * m[ 3];
		var v2 = m[ 2] * m[15] - m[14] * m[ 3];
		var v3 = m[ 6] * m[11] - m[10] * m[ 7];
		var v4 = m[ 6] * m[15] - m[14] * m[ 7];
		var v5 = m[10] * m[15] - m[14] * m[11];

		var t0 =   v5 * m[5] - v4 * m[9] + v3 * m[13];
		var t1 = -(v5 * m[1] - v2 * m[9] + v1 * m[13]);
		var t2 =   v4 * m[1] - v2 * m[5] + v0 * m[13];
		var t3 = -(v3 * m[1] - v1 * m[5] + v0 * m[ 9]);

		var idet = 1.0 / (t0 * m[0] + t1 * m[4] + t2 * m[8] + t3 * m[12]);

		r[0] = t0 * idet;
		r[1] = t1 * idet;
		r[2] = t2 * idet;
		r[3] = t3 * idet;

		r[4] = -(v5 * m[4] - v4 * m[8] + v3 * m[12]) * idet;
		r[5] =  (v5 * m[0] - v2 * m[8] + v1 * m[12]) * idet;
		r[6] = -(v4 * m[0] - v2 * m[4] + v0 * m[12]) * idet;
		r[7] =  (v3 * m[0] - v1 * m[4] + v0 * m[ 8]) * idet;

		v0 = m[1] * m[ 7] - m[ 5] * m[3];
		v1 = m[1] * m[11] - m[ 9] * m[3];
		v2 = m[1] * m[15] - m[13] * m[3];
		v3 = m[5] * m[11] - m[ 9] * m[7];
		v4 = m[5] * m[15] - m[13] * m[7];
		v5 = m[9] * m[15] - m[13] * m[11];

		r[ 8] =  (v5 * m[4] - v4 * m[8] + v3 * m[12]) * idet;
		r[ 9] = -(v5 * m[0] - v2 * m[8] + v1 * m[12]) * idet;
		r[10] =  (v4 * m[0] - v2 * m[4] + v0 * m[12]) * idet;
		r[11] = -(v3 * m[0] - v1 * m[4] + v0 * m[ 8]) * idet;

		v0 = m[ 6] * m[1] - m[ 2] * m[ 5];
		v1 = m[10] * m[1] - m[ 2] * m[ 9];
		v2 = m[14] * m[1] - m[ 2] * m[13];
		v3 = m[10] * m[5] - m[ 6] * m[ 9];
		v4 = m[14] * m[5] - m[ 6] * m[13];
		v5 = m[14] * m[9] - m[10] * m[13];

		r[12] = -(v5 * m[4] - v4 * m[8] + v3 * m[12]) * idet;
		r[13] =  (v5 * m[0] - v2 * m[8] + v1 * m[12]) * idet;
		r[14] = -(v4 * m[0] - v2 * m[4] + v0 * m[12]) * idet;
		r[15] =  (v3 * m[0] - v1 * m[4] + v0 * m[ 8]) * idet;
	},

	inverse_affine: function(r, m)
	{
		var t0 = m[10] * m[5] - m[ 6] * m[9];
		var t1 = m[ 2] * m[9] - m[10] * m[1];
		var t2 = m[ 6] * m[1] - m[ 2] * m[5];

		var idet = 1 / (m[0] * t0 + m[4] * t1 + m[8] * t2);

		t0 *= idet;
		t1 *= idet;
		t2 *= idet;

		var v0 = m[0] * idet;
		var v4 = m[4] * idet;
		var v8 = m[8] * idet;

		r[ 0] = t0; 
		r[ 1] = t1; 
		r[ 2] = t2;
		r[ 3] = 0;
		r[ 4] = v8 * m[ 6] - v4 * m[10];
		r[ 5] = v0 * m[10] - v8 * m[ 2];
		r[ 6] = v4 * m[ 2] - v0 * m[ 6];
		r[ 7] = 0;
		r[ 8] = v4 * m[9] - v8 * m[5];
		r[ 9] = v8 * m[1] - v0 * m[9];
		r[10] = v0 * m[5] - v4 * m[1];
		r[11] = 0;
		r[12] = -(r[0] * m[12] + r[4] * m[13] + r[ 8] * m[14]);
		r[13] = -(r[1] * m[12] + r[5] * m[13] + r[ 9] * m[14]);
		r[14] = -(r[2] * m[12] + r[6] * m[13] + r[10] * m[14]);		
		r[15] = 1;

		return r;
	},

	set_position: function(m, p)
	{
		m[12] = p[0]; 
		m[13] = p[1]; 
		m[14] = p[2];
	},

	get_position: function(r, m)
	{
		r[0] = m[12];
		r[1] = m[13];
		r[2] = m[14];
	},

	set_scale: function(m, s)
	{
		m[ 0] = s[0]; 
		m[ 5] = s[1]; 
		m[10] = s[2];
	},
	scale: function(m, s)
	{
		m[ 0] *= s[0]; 
		m[ 1] *= s[0]; 
		m[ 2] *= s[0];
		m[ 3] *= s[0];
		m[ 4] *= s[1];
		m[ 5] *= s[1];
		m[ 6] *= s[1];
		m[ 7] *= s[1];
		m[ 8] *= s[2];
		m[ 9] *= s[2];
		m[10] *= s[2];
		m[11] *= s[2];
	},
	get_scale: function(r, m)
	{
		r[0] = m[0];
		r[1] = m[5];
		r[2] = m[10];
	},

	set_rotation: function(m, r)
	{
		var x2 = 2 * r[0]; 
		var y2 = 2 * r[1]; 
		var z2 = 2 * r[2];
		var xx = r[0] * x2; 
		var xy = r[0] * y2; 
		var xz = r[0] * z2;
		var yy = r[1] * y2;
		var yz = r[1] * z2;
		var zz = r[2] * z2;
		var wx = r[3] * x2; 
		var wy = r[3] * y2;
		var wz = r[3] * z2;

		m[ 0] = 1 - (yy + zz);
		m[ 1] = xy + wz;
		m[ 2] = xz - wy;
		m[ 3] = 0;
		m[ 4] = xy - wz;
		m[ 5] = 1 - (xx + zz);
		m[ 6] = yz + wx;
		m[ 7] = 0;
		m[ 8] = xz + wy;
		m[ 9] = yz - wx;
		m[10] = 1 - (xx + yy);
		m[11] = 0;
		m[12] = 0;
		m[13] = 0;
		m[14] = 0;
		m[15] = 1;
	},

	get_rotation: function(r, m)
	{
		var t;
		if(m[10] < 0)
		{
			if(m[0] > m[5])
			{
				t = 1 + m[0] - m[5] - m[10];
				r.set(t, m[1] + m[4], m[8] + m[2], m[6] - m[9]);
			}
			else
			{
				t = 1 - m[0] + m[5] - m[10];
				r.set(m[1] + m[4], t, m[6] + m[9], m[8] - m[2]);
			}
		}
		else
		{
			if (m[0] < -m[5])
			{
				t = 1 - m[0] - m[5] + m[10];
				r.set(m[8] + m[2], m[6] + m[9], t, m[1] - m[4]);
			}
			else
			{
				t = 1 + m[0] + m[5] + m[10];
				r.set(m[6] - m[9], m[8] - m[2], m[1] - m[4], t);
			}
		}

		var q = gb.quat;
		var rf = q.tmp();
		q.mulf(rf, r, 0.5);
		q.divf(r, rf, t);
	},

	compose: function(m, p, s, r)
	{
		var _t = gb.mat4;
		_t.set_rotation(m,r);
		_t.scale(m,s);
		_t.set_position(m,p);
	},

	mul_point: function(r, m, p)
	{
		var x = m[0] * p[0] + m[4] * p[1] + m[ 8] * p[2] + m[12];
		var y = m[1] * p[0] + m[5] * p[1] + m[ 9] * p[2] + m[13];
		var z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
		r[0] = x; r[1] = y; r[2] = z;
	},

	mul_dir: function(r, m, p)
	{
		var x = m[0] * p[0] + m[4] * p[1] + m[ 8] * p[2];
		var y = m[1] * p[0] + m[5] * p[1] + m[ 9] * p[2];
		var z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2];
		r[0] = x; r[1] = y; r[2] = z;
	},

	mul_projection: function(r, m, p)
	{
		var d = 1 / (m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]);
		var x = (m[0] * p[0] + m[4] * p[1] + m[ 8] * p[2] + m[12]) * d;
		var y = (m[1] * p[0] + m[5] * p[1] + m[ 9] * p[2] + m[13]) * d;
		var z = (m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]) * d;
		r[0] = x; r[1] = y; r[2] = z;
	},

	ortho_projection: function(m, w,h,n,f)
	{
		m[ 0] = 2.0 / w;
		m[ 5] = 2.0 / h;
		m[10] = -2.0 / (f - n);
		m[11] = -n / (f - n);
		m[15] = 1.0;
	},
	perspective_projection: function(m, f,n,aspect,fov)
	{
		var h = 1.0 / gb.math.tan(fov * gb.math.PI_OVER_360);
		var y = n - f;
		
		m[ 0] = h / aspect;
		m[ 5] = h;
		m[10] = (f + n) / y;
		m[11] = -1.0;
		m[14] = 2.0 * (n * f) / y;
		m[15] = 0.0;
	},
}
gb.Color = function(r,g,b,a)
{
	return new Float32Array(4);
}

gb.color = 
{
	stack: new gb.Stack(gb.Color, 10),

	new: function(r,g,b,a)
	{
		var v = new gb.Color();
		gb.color.set(v, r,g,b,a);
		return v;
	},
	set: function(v, r,g,b,a)
	{
		v[0] = r;
		v[1] = g;
		v[2] = b;
		v[3] = a;
	},
	eq: function(a,b)
	{
		a[0] = b[0];
		a[1] = b[1];
		a[2] = b[2];
		a[3] = b[3];
	},
	tmp: function(r,g,b,a)
	{
		var c = gb.stack.get(gb.color.stack);
		gb.color.set(c, r || 0, g || 0, b || 0, a || 0);
		return c;
	},
	lerp: function(r, a,b, t)
	{
		var it = 1-t;
		r[0] = it * a[0] + t * b[0];
		r[1] = it * a[1] + t * b[1];
		r[2] = it * a[2] + t * b[2];
		r[3] = it * a[3] + t * b[3];
	},
}
gb.Quat = function(x,y,z,w)
{
	return new Float32Array(4);
}
gb.quat = 
{
	stack: new gb.Stack(gb.Quat, 5),

	new: function()
	{
		var r = new gb.Quat();
		r[3] = 1;
		return r;
	},
	set: function(v, x,y,z,w)
	{
		v[0] = x;
		v[1] = y;
		v[2] = z;
		v[3] = w;
	},
	eq: function(a,b)
	{
		a[0] = b[0];
		a[1] = b[1];
		a[2] = b[2];
		a[3] = b[3];
	},
	tmp: function(x,y,z,w)
	{
		var _t = gb.quat;
		var r = gb.stack.get(_t.stack);
		_t.set(r, x || 0, y || 0, z || 0, w || 1);
		return r;
	},
	mul: function(r, a,b)
	{
		var x = a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1];
		var y = a[3] * b[1] + a[1] * b[3] + a[2] * b[0] - a[0] * b[2];
		var z = a[3] * b[2] + a[2] * b[3] + a[0] * b[1] - a[1] * b[0];
		var w = a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2];

		gb.quat.set(r, x,y,z,w);
	},
	mulf: function(r, q,f)
	{
		r[0] = q[0] * f;
		r[1] = q[1] * f;
		r[2] = q[2] * f;
		r[3] = q[3] * f;
	},

	divf: function(r, q,f)
	{
		r[0] = q[0] / f;
		r[1] = q[1] / f;
		r[2] = q[2] / f;
		r[3] = q[3] / f;
	},

	dot: function(a, b)
	{
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
	},

	sqr_length:function(q)
	{
		return gb.quat.dot(q, q);
	},

	length:function(q)
	{
		return gb.math.sqrt(qb.quat.sqr_length(q));
	},

	normalized: function(r, v) 
	{
		var _t = gb.quat;
		var l = _t.sqr_length(v);
		var x, y, z, w;
		if(l > gb.math.EPSILON)
		{
			var il = gb.math.sqrt(1/l);
			x = v[0] * il;
			y = v[1] * il;
			z = v[2] * il;
			w = v[3] * il;
		} 
		else
		{
			x = v[0];
			y = v[1]; 
			z = v[2];
			w = v[3];
		}
		_t.set(r,x,y,z,w);
	},

	conjugate:function(r, q) 
	{
		r[0] = -q[0];
		r[1] = -q[1];
		r[2] = -q[2];
		r[3] = q[3];
	},

	inverse:function(r, q)
	{
		var _t = gb.quat;
		var t = _t.tmp(0,0,0,1);
		_t.normalized(r, _t.conjugate(t,q));
	},

	euler: function(r, v)
	{
		gb.quat.euler_f(r, v[0], v[1], v[2]);
	},

	euler_f:function(r, x,y,z)
	{
		var m = gb.math;
		var xr = x * m.DEG2RAD / 2;
		var yr = y * m.DEG2RAD / 2;
		var zr = z * m.DEG2RAD / 2;

		var sx = m.sin(xr);
		var sy = m.sin(yr);
		var sz = m.sin(zr);
		var cx = m.cos(xr);
		var cy = m.cos(yr);
		var cz = m.cos(zr);

		r[0] = sx * cy * cz - cx * sy * sz;
		r[1] = cx * sy * cz + sx * cy * sz;
		r[2] = cx * cy * sz - sx * sy * cz;
		r[3] = cx * cy * cz + sx * sy * sz;
	},

	get_euler:function(r, q)
	{
		var m = gb.math;
		var tolerance = 0.499;
		var test = q[0] * q[1] + q[2] * q[3];
		var x, y, z = 0;
		if(test > tolerance)
		{ 
			x = 2 * m.atan2(q[0], q[3]);
			y = m.PI / 2; 
			z = 0;
		}
		else if(test < -tolerance)
		{ 
			x = -2 * m.atan2(q[0], q[3]);
			y = -m.PI / 2;
			z = 0;
		}
		else
		{
			var sqx = q[0] * q[0];
			var sqy = q[1] * q[1];
			var sqz = q[2] * q[2];

			x = m.atan2(2 * q[1] * q[3] - 2 * q[0] * q[2], 1 - 2 * sqy - 2 * sqz);
			y = m.asin(2 * test);
			z = m.atan2(2 * q[0] * q[3] - 2 * q[1] * q[2], 1 - 2 * sqx - 2 * sqz);
		}
		gb.vec3.set(r, x,y,z);
	},

	angle_axis:function(r, angle, axis)
	{
		var m = gb.math;
		var radians = angle * m.DEG2RAD;
		var h = 0.5 * radians;
		var s = m.sin(h);	
		r[0] = s * axis[0];
		r[1] = s * axis[1];
		r[2] = s * axis[2];
		r[3] = m.cos(h);
	},

	get_angle_axis:function(q, angle, axis)
	{
		var m = gb.math;
		var sqrl = gb.quat.sqr_length(q);
		if(sqr_l > 0)
		{
			var i = 1 / m.sqrt(sqr_l);
			angle = (2 * m.acos(q[3])) * m.RAD2DEG;
			axis[0] = q[0] * i;
			axis[1] = q[1] * i;
			axis[2] = q[2] * i;
		}
		else
		{
			angle = 0;
			gb.vec3.set(axis, 1,0,0);
		}
	},
	
	from_to:function(r, from, to)
	{
		var _t = gb.quat;
		var v3 = gb.vec3;
		var fn = v3.tmp();
		var tn = v3.tmp();
		var c = v3.tmp();

		v3.normalized(fn, from);
		v3.normalized(tn, to);
		v3.cross(c, fn, tn);
			
		var t = _t.tmp();
		t[0] = c[0];
		t[1] = c[1];
		t[2] = c[2];
		t[3] = 1 + v3.dot(fn, tn);

		_t.normalized(r,t);
	},

	look_at: function(r, from, to, forward)
	{
		var _t = gb.quat;
		var v3 = gb.vec3;
		var temp = v3.tmp();
		v3.sub(temp, from, to);
		v3.normalized(temp, temp);
		_t.from_to(r, forward, to);
	},

	lerp: function(r, a,b, t)
	{
		var it = 1-t;
		r[0] = it * a[0] + t * b[0];
		r[1] = it * a[1] + t * b[1];
		r[2] = it * a[2] + t * b[2];
		r[3] = it * a[3] + t * b[3];
	},

	slerp: function(r, a,b, t) 
	{
		var flip = 1;
		var cosine = a[3] * b[3] + a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		
		if(cosine < 0) 
		{ 
			cosine = -cosine; 
			flip = -1;
		} 
		
		if((1 - cosine) < gb.math.EPSILON)
		{
			r[0] = (1-t) * a[0] + (t * flip) * b[0];
			r[1] = (1-t) * a[1] + (t * flip) * b[1];
			r[2] = (1-t) * a[2] + (t * flip) * b[2];
			r[3] = (1-t) * a[3] + (t * flip) * b[3];
			return;
		}
		
		var theta = gb.math.acos(cosine); 
		var sine = gb.math.sin(theta); 
		var beta = gb.math.sin((1 - t) * theta) / sine; 
		var alpha = gb.math.sin(t * theta) / sine * flip; 
		
		r[0] = a[0] * beta + b[0] * alpha;
		r[1] = a[1] * beta + b[1] * alpha;
		r[2] = a[2] * beta + b[2] * alpha;
		r[3] = a[3] * beta + b[3] * alpha;
	}, 
}
gb.time = 
{
	start: 0,
    elapsed: 0,
    now: 0,
    last: 0,
    dt: 0,
    paused: false,

    init: function(t)
    {
        var _t = gb.time;
    	_t.elapsed = 0;
        _t.start = t;
        _t.now = t;
        _t.last = t;
        _t.paused = false;
    },
    update: function(t)
    {
        var _t = gb.time;
    	_t.now = t;
    	_t.dt = ((t - _t.last) / 1000);
    	_t.last = t;
        _t.elapsed += _t.dt;
    },
}
gb.KeyState = 
{
	UP: 1,
	DOWN: 2,
	HELD: 3,
	RELEASED: 4,
}

gb.Keys = 
{
	mouse_left: 0,
	mouse_right: 1,
	backspace: 8,
	tab: 9,
	enter: 13,
	shift: 16,
	ctrl: 17,
	alt: 18,
	caps_lock: 20,
	escape: 27,
	space: 32,
	left: 37,
	up: 38,
	right: 39,
	down: 40,
	zero: 48,
	one: 49,
	two: 50,
	three: 51,
	four: 52,
	five: 53,
	six: 54,
	seven: 55,
	eight: 56,
	nine: 57,
	a: 65,
	b: 66,
	c: 67,
	d: 68, 
	e: 69,
	f: 70,
	g: 71,
	h: 72,
	i: 73,
	j: 74,
	k: 75,
	l: 76,
	m: 77,
	n: 78,
	o: 79,
	p: 80,
	q: 81,
	r: 82,
	s: 83,
	t: 84,
	u: 85,
	v: 86,
	w: 87,
	x: 88,
	y: 89,
	z: 90,
}

gb.input = 
{
	root: null,
	mouse_position: gb.vec2.new(),
	last_mouse_position: gb.vec2.new(),
	mouse_delta: gb.vec2.new(),

	_mdy:0,
	_lmdy:0,
	mouse_scroll: 0,

	keys: new Uint8Array(256),

	init: function(config)
	{
		var root = config.root;

		var _t = gb.input;
		root.onkeydown 	 = _t.key_down;
		root.onkeyup 	 = _t.key_up;
		root.onmousedown = _t.key_down;
		root.onmouseup   = _t.key_up;
		root.onmousemove = _t.mouse_move;
		root.addEventListener("wheel", _t.mouse_wheel, false);

		for(var i = 0; i < 256; ++i)
		{
			_t.keys[i] = gb.KeyState.RELEASED;
		}

	  	_t.root = root;
	},

	update: function()
	{
		var _t = gb.input;
		for(var i = 0; i < 256; ++i)
		{
			if(_t.keys[i] === gb.KeyState.DOWN) _t.keys[i] = gb.KeyState.HELD;
			else if(_t.keys[i] === gb.KeyState.UP) _t.keys[i] = gb.KeyState.RELEASED;
		}

		if(_t._mdy === _t._ldy)
		{
			_t.mouse_scroll = 0;
		}
		else
		{
			_t.mouse_scroll = _t._mdy;
			_t._ldy = _t._mdy;
		}

		gb.vec2.set(_t.mouse_delta, 0, 0);
	},

	up: function(code)
	{
		return gb.input.keys[code] === gb.KeyState.UP;
	},
	down: function(code)
	{
		return gb.input.keys[code] === gb.KeyState.DOWN;
	},
	held: function(code)
	{
		return gb.input.keys[code] === gb.KeyState.HELD;
	},
	released: function(code)
	{
		return gb.input.keys[code] === gb.KeyState.RELEASED;
	},

	key_down: function(e)
	{
		var _t = gb.input;
		var kc = e.keyCode || e.button;

		if(_t.keys[kc] != gb.KeyState.HELD) 
			_t.keys[kc] = gb.KeyState.DOWN;

		//e.preventDefault();
	},
	key_up: function(e)
	{
		var _t = gb.input;
		var kc = e.keyCode || e.button;

		if(_t.keys[kc] != gb.KeyState.RELEASED) 
			_t.keys[kc] = gb.KeyState.UP;

		//e.preventDefault();
	},

	mouse_move: function(e)
	{
		var _t = gb.input;
		var x = e.clientX;
		var y = e.clientY;
		var dx = e.movementX;
		var dy = e.movementY;
		gb.vec2.set(_t.mouse_position, x, y);
		gb.vec2.set(_t.mouse_delta, dx, dy);
	},
	mouse_wheel: function(e)
	{
		gb.input._mdy = e.deltaY;
	},
}
gb.dom =
{
	get: function(selector)
	{
		return document.querySelector(selector);
	},
	all: function(selector)
	{
		return document.querySelectorAll(selector);
	},
}
gb.ShaderAttribute = function()
{
	this.location;
	this.size;
    this.type;
}
gb.ShaderUniform = function()
{
    this.location;
    this.name;
    this.type;
    this.size;
    this.sampler_index;
}
gb.Shader = function()
{
    this.name = null;
    this.id = 0;
    this.vertex_src;
    this.fragment_src;
    this.num_attributes;
    this.num_uniforms;
    this.attributes = {};
    this.uniforms = {};
    this.linked = false;
}
gb.shader = 
{
    new: function(v_src, f_src)
    {
        var shader = new gb.Shader();
        shader.vertex_src = v_src;
        shader.fragment_src = f_src;
        gb.webgl.link_shader(shader);
        return shader;
    }
}
gb.Vertex_Attribute = function()
{
	this.name;
	this.size;
	this.normalized;
	this.offset = 0;
}
gb.Vertex_Buffer = function()
{
	this.id = 0;
	this.data;
	this.attributes = {};
	this.stride = 0;
}
gb.Index_Buffer = function()
{
	this.id = 0;
	this.data;
}
gb.Mesh = function()
{
	this.name;
	this.layout;
	this.update_mode;
	this.vertex_buffer = null;
	this.vertex_count = 0;
	this.index_buffer = null;
	this.index_count = 0;
	this.linked = false;
}

gb.vertex_buffer = 
{
	new: function(vertices)
	{
		var vb = new gb.Vertex_Buffer();
		if(vertices) vb.data = new Float32Array(vertices);
		return vb;
	},
	add_attribute: function(vb, name, size, normalized)
	{
		ASSERT(vb.attributes[name] === undefined, 'Vertex buffer already has an attribute named: ' + name);

		var attr = new gb.Vertex_Attribute();
		attr.name = name;
		attr.size = size;
		attr.normalized = normalized || false;
		attr.offset = vb.stride;
		vb.attributes[name] = attr;
		vb.stride += size;
	},
	alloc: function(vb, vertex_count)
	{
		vb.data = new Float32Array(vb.stride * vertex_count);		
	},
	resize: function(vb, vertex_count, copy)
	{
		ASSERT((vb.data.length / vb.stride) !== vertex_count, 'Buffer already correct size');
		var new_buffer = new Float32Array(vb.stride * vertex_count);
		if(copy) new_buffer.set(vb.data);
		vb.data = new_buffer; 
	},
}
gb.index_buffer = 
{
	new: function(indices)
	{
		var ib = new gb.Index_Buffer();
		if(indices) ib.data = new Uint32Array(indices);
		return ib;
	},
	alloc: function(ib, count)
	{
		ib.data = new Uint32Array(count);		
	},
	resize: function(ib, count, copy)
	{
		ASSERT(ib.data.length !== count, 'Buffer already correct size');
		var new_buffer = new Uint32Array(count);
		if(copy) new_buffer.set(ib.data);
		ib.data = new_buffer; 
	},
}

gb.mesh = 
{
	new: function(vertex_buffer, index_buffer, layout, update_mode)
	{
		var m = new gb.Mesh();

		if(layout) m.layout = gb.webgl.ctx[layout];
		else m.layout = gb.webgl.ctx.TRIANGLES;

		if(update_mode) m.update_mode = gb.webgl.ctx[update_mode];
		else m.update_mode = gb.webgl.ctx.STATIC_DRAW;

	    m.vertex_buffer = vertex_buffer;
		m.index_buffer = index_buffer;

	    gb.mesh.update(m);
	    return m;
	},
	update: function(m)
	{
	    if(m.vertex_buffer.data.length === 0) m.vertex_count = 0;
	    else m.vertex_count = m.vertex_buffer.data.length / m.vertex_buffer.stride;

	    if(m.index_buffer)
	    { 
		    if(m.index_buffer.data.length === 0) m.index_count = 0;
		    else m.index_count = m.index_buffer.data.length;
		}
	    gb.webgl.update_mesh(m);
	},
	get_vertex: function(result, mesh, attribute, index)
	{
		var vb = mesh.vertex_buffer;
		var attr = vb.attributes[attribute];
		var start = (index * vb.stride) + attr.offset; 
		for(var i = 0; i < attr.size; ++i)
		{
			result[i] = vb.data[start + i];
		}
	},
	set_vertex: function(mesh, attribute, index, val)
	{
		var vb = mesh.vertex_buffer;
		var attr = vb.attributes[attribute];
		var start = (index * vb.stride) + attr.offset; 
		for(var i = 0; i < attr.size; ++i)
		{
			vb.data[start + i] = val[i];
		}
	},
	set_vertex_abs: function(mesh, index, val, size)
	{
		for(var i = 0; i < size; ++i)
			vb.data[i] = val[i];
		return index + size;
	},
	get_vertices: function(result, mesh, attribute, start, end)
	{
		var vb = mesh.vertex_buffer;
		var attr = vb.attributes[attribute];
		start = start || 0;
		end = end || mesh.vertex_count;
		var range = end - start;
		var dest_index = 0;
		var src_index = (start * vb.stride) + attr.offset;

		for(var i = 0; i < range; ++i)
		{
			for(var j = 0; j < attr.size; ++j)
			{
				result[dest_index + j] = vb.data[src_index + j]; 
			}
			src_index += vb.stride;
			dest_index += attr.size;
		}
	},
	set_vertices: function(mesh, attribute, start, val)
	{
		var vb = mesh.vertex_buffer;
		var attr = vb.attributes[attribute];
		var range = val.length;
		ASSERT((start + range) < mesh.vertex_count, 'src data too large for vertex buffer');
		for(var i = 0; i < range; ++i)
		{
			for(var j = 0; j < attr.size; ++j)
			{
				vb.data[dest_index + j] = val[src_index + j]; 
			}
			src_index += attr.size;
			dest_index += vb.stride;
		}
	},
}
gb.mesh.quad = function(width, height)
{
    var P = gb.vec2.tmp(width / 2, height / 2);
    var C = gb.color.tmp(1,1,1,1);

    var vb = gb.vertex_buffer.new(
    [
    	// POS  COLOR
        -P[0],-P[1], C[0], C[1], C[2], C[3],
         P[0],-P[1], C[0], C[1], C[2], C[3],
        -P[0], P[1], C[0], C[1], C[2], C[3],
         P[0], P[1], C[0], C[1], C[2], C[3]
    ]);

    gb.vertex_buffer.add_attribute(vb, 'position', 2);
    gb.vertex_buffer.add_attribute(vb, 'color', 4);

    var ib = gb.index_buffer.new([0,1,3,0,3,2]);

    return gb.mesh.new(vb, ib);
}
gb.Material = function()
{
    this.name;
    this.shader;
    this.mvp;
}
gb.material = 
{
    new: function(shader, name)
    {
        var m = new gb.Material();
        m.name = name || shader.name;
        m.shader = shader;
        for(var key in shader.uniforms)
        {
            var uniform = shader.uniforms[key];
            var size = uniform.size;
            var val;

            switch(uniform.type)
            {
                case 'FLOAT': 
                {
                    if(size > 1) val = new Float32Array(size);
                    else val = 0.0;
                    break;
                }
                case 'FLOAT_VEC2':
                {
                    val = new Float32Array(size * 2);
                    break;
                }
                case 'FLOAT_VEC3':
                {
                    val = new Float32Array(size * 3);
                    break;
                }
                case 'FLOAT_VEC4':
                {
                    val = new Float32Array(size * 4);
                    break;
                }
                case 'BOOL':
                {
                    val = true;
                    break;
                }
                case 'FLOAT_MAT4':
                {
                    if(size > 1) val = new Float32Array(size * 16);
                    else val = gb.mat4.new();
                    break;
                }
                case 'INT':
                {
                    val = 0;
                    break;
                }
                default:
                {
                    ASSERT(false, uniform.type + ' is an unsupported uniform type');
                }
            }
            m[key] = val
        }
        return m;
    },
    set_uniform: function(material, uniform, value)
    {
        if(material[uniform] !== undefined)
        {
            material[uniform] = value;
        }
    },
    set_matrix_uniforms: function(material, matrix, camera)
    {
        if(material.mvp !== undefined)
        {
            gb.mat4.mul(material.mvp, matrix, camera.view_projection);
        }
        if(material.model_view !== undefined)
        {
            gb.mat4.mul(material.model_view, matrix, camera.view);
        }
        if(material.model !== undefined)
        {
            material.model = matrix;
        }
    },
}
gb.webgl = 
{
	blend_mode:
	{
		DEFAULT: 0,
		DARKEN: 1,
		LIGHTEN: 2,
		DIFFERENCE: 3,
		MULTIPLY: 4,
		SCREEN: 5,
	},
	types:
	{
        0x8B50: 'FLOAT_VEC2',
        0x8B51: 'FLOAT_VEC3',
        0x8B52: 'FLOAT_VEC4',
        0x8B53: 'INT_VEC2',
        0x8B54: 'INT_VEC3',
        0x8B55: 'INT_VEC4',
        0x8B56: 'BOOL',
        0x8B57: 'BOOL_VEC2',
        0x8B58: 'BOOL_VEC3',
        0x8B59: 'BOOL_VEC4',
        0x8B5A: 'FLOAT_MAT2',
        0x8B5B: 'FLOAT_MAT3',
        0x8B5C: 'FLOAT_MAT4',
        0x8B5E: 'SAMPLER_2D',
        0x8B60: 'SAMPLER_CUBE',
        0x1400: 'BYTE',
        0x1401: 'UNSIGNED_BYTE',
        0x1402: 'SHORT',
        0x1403: 'UNSIGNED_SHORT',
        0x1404: 'INT',
        0x1405: 'UNSIGNED_INT',
        0x1406: 'FLOAT',
    },
    config: 
    {
    	fill_container: false,
		width: 512,
		height: 512,
		resolution: 1,
		alpha: false,
	    depth: true,
	    stencil: false,
	    antialias: true,
	    premultipliedAlpha: false,
	    preserveDrawingBuffer: false,
	    preferLowPowerToHighPerformance: false,
	    failIfMajorPerformanceCaveat: false,
	    extensions: ['OES_standard_derivatives',
					 'OES_texture_float',
					 'OES_element_index_uint'],
	},
	canvas: null,
	extensions: {},
	ctx: null,
	view: null,
	aspect: 1.0,
	samplers: {},
	attributes: null,

	init: function(config)
	{
		var _t = gb.webgl;
		var gl;

		for(var k in config)
			_t.config[k] = config[k];

		var width = 0;
		var height = 0;
		if(_t.config.fill_container === true)
		{
			width = _t.config.container.offsetWidth * _t.config.resolution;
        	height = _t.config.container.offsetHeight * _t.config.resolution;
		}
		else
		{
        	width = _t.config.width * _t.config.resolution;
			height = _t.config.height * _t.config.resolution;
		}

		var canvas = document.createElement('canvas');
        config.container.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        _t.view = gb.vec2.new(width,height);

        gl = canvas.getContext('webgl', _t.config);
        _t.canvas = canvas;

        //DEBUG
        ASSERT(EXISTS(gl), "Could not load WebGL");
        //_t.get_context_info(gl);
        //END

		_t.ctx = gl;

		_t.attributes = gl.getContextAttributes();

        gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL); 
    	gl.clearDepth(1.0);
		
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.frontFace(gl.CCW);
		gl.enable(gl.SCISSOR_TEST);

		_t.set_viewport(_t.view);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		for(var i = 0; i < _t.config.extensions.length; ++i)
		{
			var extension = _t.config.extensions[i];
			_t.extensions[extension] = gl.getExtension(extension);
			//DEBUG
			if(_t.extensions[extension] === null)
				LOG('Extension: ' + extension + ' is not supported');
			//
		}
	},

	set_clear_color: function(r,g,b,a)
	{
		gb.webgl.ctx.clearColor(r,g,b,a);
	},

	update_mesh: function(m)
	{
		var gl = gb.webgl.ctx;
		
		if(m.linked === false)
		{
			m.vertex_buffer.id = gl.createBuffer();
			if(m.index_buffer) m.index_buffer.id = gl.createBuffer();
			m.linked = true;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, m.vertex_buffer.id);
		gl.bufferData(gl.ARRAY_BUFFER, m.vertex_buffer.data, m.update_mode);
		//gl.bufferSubData
		if(m.index_buffer)
		{
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.index_buffer.id);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.index_buffer.data, m.update_mode);
		}
	},
	delete_mesh: function(m)
	{
		var gl = gb.webgl.ctx;
		gl.deleteBuffer(m.vertex_buffer.id);
		if(mesh.index_buffer) gl.deleteBuffer(m.index_buffer.id);
	},

	link_shader: function(s)
	{
		ASSERT(s.linked === false, 'Shader is already linked');

		var _t = gb.webgl;
		var gl = _t.ctx;
		var vs = gl.createShader(gl.VERTEX_SHADER);
	    gl.shaderSource(vs, s.vertex_src);
	    gl.compileShader(vs);

	    //DEBUG
	    _t.shader_compile_status(vs);
	    //END

	    var fs = gl.createShader(gl.FRAGMENT_SHADER);
	    gl.shaderSource(fs, s.fragment_src);
	    gl.compileShader(fs);

	    //DEBUG
	    _t.shader_compile_status(fs);
	    //END

	    var id = gl.createProgram();
	    gl.attachShader(id, vs);
	    gl.attachShader(id, fs);
	    gl.linkProgram(id);

	    //DEBUG
	    _t.shader_link_status(id);
	    //END

	    ASSERT(s.id === 0, "Shader already bound to id " + s.id); 
	    s.id = id;
	    s.vs = vs;
	    s.fs = fs;
	    s.num_attributes = gl.getProgramParameter(id, gl.ACTIVE_ATTRIBUTES);
	    s.num_uniforms = gl.getProgramParameter(id, gl.ACTIVE_UNIFORMS);

	    for(var i = 0; i < s.num_attributes; ++i)
		{
			var attr = gl.getActiveAttrib(s.id, i);
			var sa = new gb.ShaderAttribute();
			sa.location = gl.getAttribLocation(id, attr.name);
			sa.size = attr.size;
			sa.type = attr.type;
			s.attributes[attr.name] = sa;
		}

	    var sampler_index = 0;
	    for(var i = 0; i < s.num_uniforms; ++i)
	    {
	        var uniform = gl.getActiveUniform(id, i);
	        var su = new gb.ShaderUniform();
	        su.location = gl.getUniformLocation(id, uniform.name);
	        su.type = _t.types[uniform.type];
	        if(su.type === 'SAMPLER_2D')
	        {
	        	su.sampler_index = sampler_index;
	        	sampler_index++;
	        }
	        su.size = uniform.size;
	        s.uniforms[uniform.name] = su;
	    }

	    s.linked = true;
	    return s;
	},
	use_shader: function(s)
	{
		gb.webgl.ctx.useProgram(s.id);
	},

	set_state: function(val, state)
	{
		if(state === true) gb.webgl.ctx.enable(val);
		else gb.webgl.ctx.disable(val);
	},
	
	set_viewport: function(v)
	{
		var gl = gb.webgl.ctx;
		gl.viewport(0, 0, v[0], v[1]);
		gl.scissor(0, 0, v[0], v[1]);
		gb.webgl.aspect = v[0] / v[1];
	},

	use_alpha_blending: function(state)
	{
		gb.webgl.set_state(gl.webgl.ctx.BLEND, state);
	},
	set_blend_mode: function(mode)
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
		switch(mode)
		{
			case _t.blend_mode.DARKEN:
			{
				gl.blendEquation(gl.FUNC_SUBTRACT);
				gl.blendFunc(gl.ONE, gl.ONE);
				break;
			}
			case _t.blend_mode.LIGHTEN:
			{
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE);
				break;
			}
			case _t.blend_mode.DIFFERENCE:
			{
				gl.blendEquation(gl.FUNC_SUBTRACT);
				gl.blendFunc(gl.ONE, gl.ONE);
				break;
			}
			case _t.blend_mode.MULTIPLY:
			{
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.DST_COLOR, gl.ZERO);
				break;
			}
			case _t.blend_mode.SCREEN:
			{
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.MINUS_DST_COLOR, gl.ONE);
				break;
			}
			default:
			{
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				break;
			}
		}
	},

	draw_mesh: function(mesh)
	{
		var gl = gb.webgl.ctx;
		if(mesh.index_buffer)
		{
    		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index_buffer.id);
        	gl.drawElements(mesh.layout, mesh.index_count, gl.UNSIGNED_INT, 0);
		}
		else
		{
			gl.drawArrays(mesh.layout, 0, mesh.vertex_count);
		}
	},

	link_attributes: function(shader, mesh)
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
		var vb = mesh.vertex_buffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, vb.id);

		for(var k in shader.attributes)
		{
			var sa = shader.attributes[k];
			var va = vb.attributes[k];

			ASSERT(va !== undefined, 'Shader wants attribute ' + k + ' but mesh does not have it');

			gl.enableVertexAttribArray(sa.location);
			gl.vertexAttribPointer(sa.location, va.size, gl.FLOAT, va.normalized, vb.stride * 4, va.offset * 4);
		}
	},

	set_uniforms: function(material)
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
		var shader = material.shader;
		for(var key in shader.uniforms)
		{
			var uniform = shader.uniforms[key];
			var loc = uniform.location;
			var val = material[key];
			ASSERT(EXISTS(val), "Could not find shader uniform " + key + " in material " + material.name);
			switch(uniform.type)
			{
				case 'FLOAT': 
		        {
					gl.uniform1f(loc, val);
					break;
				}
				case 'FLOAT_VEC2':
				{
					gl.uniform2f(loc, val[0], val[1]);
					break;
				}
		        case 'FLOAT_VEC3':
		        {
					gl.uniform3f(loc, val[0], val[1], val[2]);
					break;
				}
		        case 'FLOAT_VEC4':
		        {
					gl.uniform4f(loc, val[0], val[1], val[2], val[3]);
					break;
				}
		        case 'BOOL':
		        {
		        	if(val === true) gl.uniform1i(loc, 1);
		        	else gl.uniform1i(loc, 0);
		        	break;
		        }
		        case 'FLOAT_MAT2':
		        {
		        	gl.uniformMatrix2fv(loc, false, val);
		        	break;
		        }
		        case 'FLOAT_MAT3':
		        {
					gl.uniformMatrix3fv(loc, false, val);
					break;
				}
		        case 'FLOAT_MAT4':
		        {
					gl.uniformMatrix4fv(loc, false, val);
					break;
				}
		        case 'SAMPLER_2D':
		        {
					gl.uniform1i(loc, uniform.sampler_index);
					gl.activeTexture(gl.TEXTURE0 + uniform.sampler_index);
					gl.bindTexture(gl.TEXTURE_2D, val.id);
					break;
				}
		        case 'SAMPLER_CUBE':
		        {
		        	break;
		        }
		        case 'INT':
		        {
					gl.uniform1i(loc, val);
					break;
				}
				 case 'INT_VEC2':
		        {
		        	gl.uniform2i(loc, val[0], val[1]);
		        	break;
		        }
		        case 'INT_VEC3':
		        {
		        	gl.uniform3i(loc, val[0], val[1], val[2]);
		        	break;
		        }
		        case 'INT_VEC4':
		        {
		        	gl.uniform3i(loc, val[0], val[1], val[2], val[3]);
		        	break;
		        }
				default:
				{
					ASSERT(false, uniform.type + ' is an unsupported uniform type');
				}
			}
		}
	},

	render_mesh: function(mesh, material, camera, matrix)
	{
		var _t = gb.webgl;
		//gb.material.set_camera_uniforms(material, camera);
		gb.material.set_matrix_uniforms(material, matrix, camera);
		_t.use_shader(material.shader);
		_t.link_attributes(material.shader, mesh);
		_t.set_uniforms(material);
		_t.draw_mesh(mesh);
	},


    //DEBUG
    get_context_info: function(gl)
	{
		LOG("AA Size: " + gl.getParameter(gl.SAMPLES));
		LOG("Shader High Float Precision: " + gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT));
		LOG("Max Texture Size: " + gl.getParameter(gl.MAX_TEXTURE_SIZE) + "px");
		LOG("Max Cube Map Size: " + gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) + "px");
		LOG("Max Render Buffer Size: " + gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) + "px");
		LOG("Max Vertex Shader Texture Units: " + gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
		LOG("Max Fragment Shader Texture Units: " + gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
		LOG("Max Combined Texture Units: " + gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
		LOG("Max Vertex Shader Attributes: " + gl.getParameter(gl.MAX_VERTEX_ATTRIBS));
		LOG("Max Vertex Uniform Vectors: " + gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
		LOG("Max Frament Uniform Vectors: " + gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
		LOG("Max Varying Vectors: " + gl.getParameter(gl.MAX_VARYING_VECTORS));

		var supported_extensions = gl.getSupportedExtensions();
		for(var i = 0; i < supported_extensions.length; ++i)
		{
			LOG(supported_extensions[i]);
		}
	},
	verify_context: function()
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
		if(gl.isContextLost())
		{
			gl.error("Lost WebGL context");
			// attempt recovery
		}
	},
	shader_compile_status: function(s)
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
	    var success = gl.getShaderParameter(s, gl.COMPILE_STATUS);
	    if(!success)
	    {
	        console.error("Shader Compile Error: " + gl.getShaderInfoLog(s));
	    }
	},
	shader_link_status: function(p)
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
	    var success = gl.getProgramParameter(p, gl.LINK_STATUS);
	    if(!success)
	    {
	        console.error("Shader Link Error: " + gl.getProgramInfoLog(p));
	    }
	},
	verify_render_target: function(gl)
	{
		var _t = gb.webgl;
		var gl = _t.ctx;
		var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if(status != gl.FRAMEBUFFER_COMPLETE)
		{
			console.error('Error creating framebuffer: ' +  status);
		}
	}
	//END
}
gb.EntityType = 
{
	ENTITY: 0,
	CAMERA: 1,
	EMPTY: 2,
}
gb.Entity = function()
{
	this.name;
	this.id;
	this.entity_type = gb.EntityType.EMPTY;
	this.update = null;
	this.parent = null;
	this.children = [];

	this.active = true;
	this.layer = 0;
	this.dirty = true;

	this.position = gb.vec3.new(0,0,0);
	this.scale = gb.vec3.new(1,1,1);
	this.rotation = gb.quat.new(0,0,0,1);

	this.local_matrix = gb.mat4.new();
	this.world_matrix = gb.mat4.new();
}
gb.entity = 
{
	new: function()
	{
		return new gb.Entity();
	},
	mesh: function(mesh, material)
	{
		var e = gb.entity.new();
		e.entity_type = gb.EntityType.ENTITY;
		e.mesh = mesh;
		e.material = material;
		return e;
	},
	set_active: function(e, val)
	{
		e.active = val;
		var n = e.children.length;
		for(var i = 0; i < n; ++i)
		{
			gb.entity.set_active(e.children[i], val);
		}
	},
	set_parent: function(e, parent)
	{
		if (e.parent === parent) return;

		if (e.parent !== null && parent === null) // clearing parent
		{
			gb.entity.remove_child(parent, e);
			e.parent = null;
		}
		else if (e.parent !== null && parent !== null) // swapping parent
		{
			gb.entity.remove_child(parent, e);
			e.parent = parent;
			gb.entity.add_child(parent, e);
		}
		else // setting new parent from null
		{
			e.parent = parent;
			gb.entity.add_child(parent, e);
		}
	},
	add_child: function(e, child)
	{
		e.children.push(child);
	},
	remove_child: function(e, child)
	{
		var index = e.children.indexOf(child, 0);
		ASSERT(index == undefined, "Cannot remove child - not found!");
		e.children.splice(index, 1);
	},
	move_f: function(e, x,y,z)
	{
		e.position[0] += x;
		e.position[1] += y;
		e.position[2] += z;
		e.dirty = true;
	},
	rotate_f: function(e, x,y,z)
	{
		var rotation = gb.quat.tmp();
		gb.quat.euler(rotation, x, y, z);
		gb.quat.mul(e.rotation, rotation, e.rotation);
		e.dirty = true;
	},
	set_position: function(e, x,y,z)
	{
		gb.vec3.set(e.position, x,y,z);
		e.dirty = true;
	},
	set_scale: function(e, x,y,z)
	{
		gb.vec3.set(e.scale, x,y,z);
		e.dirty = true;
	},
	set_rotation: function(e, x,y,z)
	{
		gb.quat.euler(e.rotation, x,y,z);
		e.dirty = true;
	},
	get_world_position: function(e, r)
	{
		gb.mat4.mul_point(r, e.world_matrix, e.position);
	},

	update: function(e, scene)
	{
		gb.mat4.compose(e.local_matrix, e.position, e.scale, e.rotation);
		if(e.parent === null)
		{
			gb.mat4.eq(e.world_matrix, e.local_matrix);
		}
		else
		{
			gb.mat4.mul(e.world_matrix, e.local_matrix, e.parent.world_matrix);
		}
	
		if(e.update !== null) e.update(e);

		var n = e.children.length;
		for(var i = 0; i < n; ++i)
		{
			var child = e.children[i];
			//child.dirty = true;
			gb.entity.update(child, scene);
		}
		//e.dirty = false;
	},
}
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
gb.Camera = function()
{
	this.entity;
	this.projection_type = null;
	this.projection = gb.mat4.new();
	this.view = gb.mat4.new();
	this.view_projection = gb.mat4.new();
	this.normal = gb.mat3.new();
	this.mask = 0;
	this.dirty = true;
	this.aspect;
	this.near;
	this.far;
	this.fov;
	this.scale;
	return this;
}
gb.camera = 
{
	new: function(projection, near, far, fov, mask, scale)
	{
		var e = gb.entity.new();
		e.entity_type = gb.EntityType.CAMERA;
		e.update = gb.camera.update;
	    var c = new gb.Camera();
	    c.projection_type = projection || gb.Projection.PERSPECTIVE;
	    c.near = near || 0.1;
	    c.far = far || 100;
	    c.fov = fov || 60;
	    c.mask = mask || 0;
	    c.scale = scale || 1;
	    c.entity = e;
	    e.camera = c;
	    return c;
	},
	update_projection: function(c, view)
	{
		c.aspect = view[0] / view[1];
		if(c.projection_type === gb.Projection.ORTHO)
		{
			gb.mat4.ortho_projection(c.projection, c.scale * c.aspect, c.scale, c.near, c.far);
		}
		else
		{
			gb.mat4.perspective_projection(c.projection, c.far, c.near, c.aspect, c.fov);
		}
		c.dirty = false;
	},

	set_clip_range: function(c, near, far)
	{
		c.near = near;
		c.far = far;
		c.dirty = true;
	},

	update: function(e)
	{
		ASSERT(e.camera, 'Entity is not a camera');
		var c = e.camera;
		if(c.dirty === true)
		{
			gb.camera.update_projection(c, gb.webgl.view);
		}
		gb.mat4.inverse(c.view, e.world_matrix);
		gb.mat4.mul(c.view_projection, c.view, c.projection);
		gb.mat3.from_mat4(c.normal, c.view);
		gb.mat3.inverse(c.normal, c.normal);
		gb.mat3.transposed(c.normal, c.normal);
	},
}

gb.Projection = 
{
    ORTHO: 0,
    PERSPECTIVE: 1,
}
gb.gl_draw = 
{
	entity: null,
	offset: null,
	color: null,
	thickness: 1.0,
	matrix: null,

	init: function(config)
	{
		var _t = gb.gl_draw;

		_t.matrix = gb.mat4.new();
		_t.offset = 0;
		_t.color = gb.color.new(1,1,1,1);

		var vb = gb.vertex_buffer.new();
		gb.vertex_buffer.add_attribute(vb, 'position', 3, false);
		gb.vertex_buffer.add_attribute(vb, 'color', 4, true);
		gb.vertex_buffer.alloc(vb, config.buffer_size);
	    _t.mesh = gb.mesh.new(vb, null, 'LINES', 'DYNAMIC_DRAW');

	    var vs = 'attribute vec3 position;attribute vec4 color;uniform mat4 mvp;varying vec4 _color;void main(){_color = color;gl_Position = mvp * vec4(position, 1.0);}';
	    var fs = 'precision highp float;varying vec4 _color;void main(){gl_FragColor = _color;}'; 
		_t.material = gb.material.new(gb.shader.new(vs,fs));
		_t.clear();
	},
	set_matrix: function(m)
	{
		var _t = gb.gl_draw;
		gb.mat4.eq(_t.matrix, m);
	},
	clear: function()
	{
		var _t = gb.gl_draw;
		gb.mat4.identity(_t.matrix);
		gb.color.set(_t.color, 1,1,1,1);
		_t.offset = 0;
		_t.mesh.vertex_count = 0;
		_t.thickness = 1.0;
		var n = _t.mesh.vertex_buffer.data.length;
		for(var i = 0; i < n; ++i)
		{
			_t.mesh.vertex_buffer.data[i] = 0;
		}
	},
	render: function(camera)
	{
		var _t = gb.gl_draw;
		var gl = gb.webgl;

		gb.mat4.identity(_t.matrix);

		gl.update_mesh(_t.mesh);
		gl.use_shader(_t.material.shader);
		//gb.material.set_camera_uniforms(_t.material, camera);
		gb.material.set_matrix_uniforms(_t.material, _t.matrix, camera);
		gl.link_attributes(_t.material.shader, _t.mesh);
		gl.set_uniforms(_t.material);
		gl.set_state(gl.ctx.DEPTH_TEST, false);
		//gl.set_render_target(target, false);
		gl.ctx.depthRange(camera.near, camera.far);
		gl.ctx.lineWidth = _t.thickness;
		gl.draw_mesh(_t.mesh);

		_t.clear();
	},
	set_position_f: function(x,y,z)
	{
		var p = gb.vec3.tmp(x,y,z);
		gb.mat4.set_position(gb.gl_draw.matrix, p);
	},
	set_position: function(p)
	{
		gb.mat4.set_position(gb.gl_draw.matrix, p);
	},
	set_color: function(r,g,b,a)
	{
		gb.color.set(gb.gl_draw.color, r,g,b,a);
	},
	line: function(start, end)
	{
		var _t = gb.gl_draw;
		var c = _t.color;
		var o = _t.offset;
		var d = _t.mesh.vertex_buffer.data;

		var stack = gb.vec3.push();

		var a = gb.vec3.tmp();
		var b = gb.vec3.tmp();
		gb.mat4.mul_point(a, _t.matrix, start);
		gb.mat4.mul_point(b, _t.matrix, end);

		d[o]   = a[0];
		d[o+1] = a[1];
		d[o+2] = a[2];

		d[o+3] = c[0];
		d[o+4] = c[1];
		d[o+5] = c[2];
		d[o+6] = c[3];

		d[o+7] = b[0];
		d[o+8] = b[1];
		d[o+9] = b[2];

		d[o+10] = c[0];
		d[o+11] = c[1];
		d[o+12] = c[2];
		d[o+13] = c[3];

		gb.vec3.pop(stack);

		_t.offset += 14;
		_t.mesh.vertex_count += 2;
		_t.mesh.dirty = true;
	},
	ray: function(r)
	{
		var _t = gb.gl_draw;
		var end = gb.vec3.tmp();
		gb.vec3.add(end, r.point, r.dir);
		_t.line(r.point, end);
	},
	hit: function(h)
	{
		var _t = gb.gl_draw;
		var end = gb.vec3.tmp();
		gb.vec3.add(end, h.point, h.normal);
		_t.line(h.point, end);
	},
	rect: function(r)
	{
		var _t = gb.gl_draw;
		var v3 = gb.vec3;
		var bl = v3.tmp(r.x, r.y);
		var tl = v3.tmp(r.x, r.y + r.height);
		var tr = v3.tmp(r.x + r.width, r.y + r.height);
		var br = v3.tmp(r.x + r.width, r.y);

		_t.line(bl, tl);
		_t.line(tl, tr);
		_t.line(tr, br);
		_t.line(br, bl);
	},
	circle: function(radius, segments)
	{
		var _t = gb.gl_draw;
		var m = gb.math;
		var v3 = gb.vec3;
		var theta = m.TAU / segments;
		var tanf = m.tan(theta);
		var cosf = m.cos(theta);

		var stack = v3.push();

		var current = v3.tmp(radius, 0, 0);
		var last = v3.tmp(radius, 0, 0);

		for(var i = 0; i < segments + 1; ++i)
		{
			_t.line(last, current);
			v3.eq(last, current);
			var tx = -current[1];
			var ty = current[0];
			current[0] += tx * tanf;
			current[1] += ty * tanf;
			current[0] *= cosf;
			current[1] *= cosf;
		}
		v3.pop(stack);
	},
	transform: function(m)
	{
		var _t = gb.gl_draw;
		var v3 = gb.vec3;
		var index = v3.stack.index;
		var m4 = gb.mat4;
		var o = v3.tmp(0,0,0);
		var e = v3.tmp(0,0,0);

		m4.get_position(o, m);

		_t.set_color(1,0,0,1);
		m4.mul_point(e, m, v3.tmp(1.0,0.0,0.0));
		_t.line(o, e);
		_t.set_color(0,1,0,1);
		m4.mul_point(e, m, v3.tmp(0.0,1.0,0.0));
		_t.line(o, e);
		_t.set_color(0,0,1,1);
		m4.mul_point(e, m, v3.tmp(0.0,0.0,1.0));
		_t.line(o, e);

		v3.stack.index = index;
	},
	bounds: function(b)
	{
		var _t = gb.gl_draw;
		var m4 = gb.mat4;
		var ab = gb.aabb;
		
		m4.identity(_t.matrix);

		var center = gb.vec3.tmp();
		ab.center(center, b);

		m4.set_position(_t.matrix, center);

		var w = ab.width(b);
		var h = ab.height(b);
		var d = ab.depth(b);

		_t.cube(w,h,d);
		m4.identity(_t.matrix);
	},
	wire_mesh: function(mesh, matrix)
	{
		var _t = gb.gl_draw;
		var v3 = gb.vec3;
		var mt = gb.mat4;
		m4.eq(_t.matrix, matrix);
		var stride = mesh.vertex_buffer.stride;
		var n = mesh.vertex_count / 3;
		var d = mesh.vertex_buffer.data;
		var c = 0;
		for(var i = 0; i < n; ++i)
		{
			var stack = v3.push();
			var ta = v3.tmp(d[c], d[c+1], d[c+2]);
			c += stride;
			var tb = v3.tmp(d[c], d[c+1], d[c+2]);
			c += stride;
			var tc = v3.tmp(d[c], d[c+1], d[c+2]);
			c += stride;
			_t.line(ta, tb);
			_t.line(tb, tc);
			_t.line(tc, ta);
			v3.pop(stack);
		}
		m4.identity(_t.matrix);
	},
	bezier: function(b, segments)
	{
		var _t = gb.gl_draw;
		var c = gb.bezier;
		var v3 = gb.vec3;
		var stack = v3.push();
		var last = v3.tmp();
		c.eval(last, b, 0);
		var step = 1 / segments;
		var t = step;
		for(var i = 1; i < segments+1; ++i)
		{
			var point = v3.tmp();
			c.eval(point, b, t);
			_t.line(last, point);
			v3.eq(last, point);
			t += step;
		}
		v3.pop(stack);
	},
}

gb.Canvas = function()
{
	this.ctx;
	this.element;
	this.container;
	this.width;
	this.height;
}

gb.canvas = 
{
	canvas: null,

	init: function(container)
	{
		var _t = gb.canvas;

		var canvas = new gb.Canvas();
		canvas.container = container;
		canvas.element = document.createElement('canvas');
		canvas.ctx = canvas.element.getContext('2d');
    	container.appendChild(canvas.element);

		_t.canvas = canvas;
		
		_t.resize();

		return canvas;
	},

	resize: function()
	{
		var canvas = gb.canvas.canvas;
		var w = canvas.container.offsetWidth;
		var h = canvas.container.offsetHeight;

		canvas.element.width = w;
		canvas.element.height = h;
		canvas.width = w;
		canvas.height = h;
	},

	clear: function(color)
	{
		var canvas = gb.canvas.canvas;
		var ctx = canvas.ctx;

		if(color)
		{
			ctx.fillStyle = color;
			ctx.rect(0,0,canvas.width, canvas.height);
			ctx.fill();
		}
		else 
		{
			ctx.clearRect(0,0, canvas.width, canvas.height);
		}
	},

	rect: function(ax,ay, bx,by)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.beginPath();
		ctx.moveTo(ax,ay);
		ctx.lineTo(bx,ay);
		ctx.lineTo(bx,by);
		ctx.lineTo(ax,by);
	},

	line: function(ax,ay, bx,by)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.beginPath();
		ctx.moveTo(ax,ay);
		ctx.lineTo(bx,by);
	},

	fill: function(color)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.fillStyle = color;
		ctx.fill();
	},

	stroke: function(width, color)
	{
		var ctx = gb.canvas.canvas.ctx;
		ctx.strokeWidth = width;
		ctx.strokeStyle = color;
		ctx.stroke();
	},
}

var v3 = gb.vec3;

var camera;
var construct;
var material;
var square;

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

	//gb.canvas.init(gb.dom.get('.canvas'));
	gb.webgl.init(
	{
		container: gb.dom.get('.canvas'),
		fill_container: true,
	});

	var vs = 'attribute vec3 position;attribute vec4 color;uniform mat4 mvp;varying vec4 _color;void main(){_color = color;gl_Position = mvp * vec4(position, 1.0);}';
    var fs = 'precision highp float;varying vec4 _color;void main(){gl_FragColor = _color;}'; 
	material = gb.material.new(gb.shader.new(vs,fs));

	//DEBUG
	gb.gl_draw.init(
	{
		buffer_size: 1024,
	});
	//END

	construct = gb.scene.new();
	
	camera = gb.camera.new();
	camera.entity.position[2] = 3.0;
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
    push_quad(mesh, 0,0,1,1);
    push_quad(mesh, 1,1,1.5,1.5);
    push_quad(mesh, 0,2,3.0,3.0);

	gb.mesh.update(mesh);	

	square = gb.entity.mesh(mesh, material);
	gb.scene.add(square, construct);
}

function update(dt)
{
	gb.camera.fly(camera, dt, 80);
	gb.scene.update(construct, dt);

	gb.gl_draw.clear();
	gb.gl_draw.line(v3.tmp(0,0,0), v3.tmp(1,1,1));
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

function push_quad(mesh, ax,ay, bx,by)
{
	var d = mesh.vertex_buffer.data;
	var i = mesh.index_buffer.data;
	var io = mesh.index_offset;
	var to = mesh.triangle_offset;

	push_vertex(mesh, ax,ay);
	push_vertex(mesh, bx,ay);
	push_vertex(mesh, bx,by);
	push_vertex(mesh, ax,by);

	i[io]   = to;
	i[io+1] = to+1;
	i[io+2] = to+2;

	i[io+3] = to;
	i[io+4] = to+2;
	i[io+5] = to+3;

	mesh.index_offset += 6;
	mesh.triangle_offset += 4;
}
function push_vertex(mesh, x,y)
{
	var d = mesh.vertex_buffer.data;
	var vo = mesh.vertex_offset;

	d[vo]   = x;
	d[vo+1] = y;

	d[vo+2] = 1.0;
	d[vo+3] = 1.0;
	d[vo+4] = 1.0;
	d[vo+5] = 1.0;

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
