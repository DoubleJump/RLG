gb.array = 
{
	insert_at: function(array, item, index)
	{
		array.splice(index, 0, item);
	},
	insert_items: function(array, index)
	{
		var insert = Array.prototype.splice.apply(arguments, [2]);
		return gb.array.insert_array(array, index, insert);
	},
	insert_array: function(array, index, insert)
	{
		Array.prototype.splice.apply(array, [index, 0].concat(insert));
		return array;
	},
}