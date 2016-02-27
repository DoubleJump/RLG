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
	    c.projection_type = projection;
	    c.near = near;
	    c.far = far;
	    c.fov = fov;
	    c.mask = mask;
	    c.scale = scale;
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