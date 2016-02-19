var inherits = require('util').inherits;
var JSObject = require('../utils/object');

var Config = function(file)
{
	JSObject.call(this, file, {
		type: 'xml',
		rootname: 'config',
		namespace: 'urn:schemas:morphis:frames:config'
	});

	this._define({
		parameters: [],
		locales: []
	});
};

Config.load = function(file)
{
	var obj = new Config(file);
	obj.load();
	return obj;
};

inherits(Config, JSObject);


Config.prototype.getParameter = function(name)
{
	var arr = this.parameters.parameter;

	for (var i = 0; i < arr.length; i++)
	{
		var p = arr[i].$;
		if (p.name == name)
		{
			return p.value;
		}
	}
};

module.exports = Config;
