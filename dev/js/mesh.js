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