var path = require('path');
var fs = require('fs');
var Parser = require('./xml2js');


var JSObject = function(file, options)
{
	this.options = options || {};
	this.options.type = this.options.type || 'json';

	this.file = path.resolve(file);
	this.root = path.dirname(this.file);
};

JSObject.load = function(file, callback)
{
	var obj = new JSObject(file);
	obj.load(function(err, obj)
	{
		callback(err, obj);
	});
};

JSObject.prototype = {
	_define: function(defaults)
	{
		this._data = defaults;

		for (var prop in this._data)
		{
			if (defaults.hasOwnProperty(prop))
			{
				this._defineprop(prop);
			}
		}
	},

	_defineprop: function(prop)
	{
		if (!this.hasOwnProperty(prop))
		{
			Object.defineProperty(this, prop, {
				enumerable: true,
				set: function(arg)
				{
					var o = this.options.type == 'xml' && this.options.rootname ? this._data[this.options.rootname] : this._data;
					o[prop] = arg;
				},
				get: function()
				{
					var o = this.options.type == 'xml' && this.options.rootname ? this._data[this.options.rootname] : this._data;
					return o[prop];
				}
			});
		}
	},

	resolve: function (url)
	{
		if (url === undefined) return;

		if (path.isAbsolute(url))
		{
			return path.resolve(url);
		}
		else
		{
			return path.resolve(this.root, url);
		}
	},

	load: function(callback)
	{
		if (this.options.type == 'json')
		{
			try
			{
				this._data = require(this.file);
			}
			catch(e)
			{
				console.error(e);
			}
			callback(undefined, this._data);
		}
		else if (this.options.type == 'xml')
		{
			var that = this;
			Parser.load(this.file, function(err, obj)
			{
				that._data = obj ? obj._data : {};
				callback(undefined, that._data);
			});
		}
	},

	save: function(callback)
	{

		var data;

		if (this.options.type == 'json')
		{
			data = JSON.stringify(this.toJSON(), null, 4);
		}
		else if (this.options.type == 'xml')
		{
			data = this.toXML();
		}

		fs.writeFile(this.file, data, function(err)
		{
			callback(err);
		});
	},

	toJSON: function()
	{
		return this._data;
	},

	toXML: function()
	{
		// TODO: add ns to object for serialization
		// $: {'xmlns:SOAP-ENV': 'http://schemas.xmlsoap.org/soap/envelope/'},

		return Parser.toXML(this._data, this.options.rootname);
	}
};

module.exports = JSObject;
