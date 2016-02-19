var fs = require('fs');
var deasync = require('deasync');
var parseString = deasync(require('xml2js').parseString);
var processors = require('xml2js').processors;
var XMLBuilder = require('xml2js').Builder;


var Parser = function(data)
{
	this._data = data;
};

Parser.load = function(file, callback)
{
	var xml = fs.readFileSync(file);
	return Parser.parseString(xml.toString());
};

Parser.parseString = function(str, callback)
{
	var options = {
		tagNameProcessors: [
			processors.stripPrefix,
			processors.normalize
		],
		explicitArray: false,
		explicitCharkey: true
	};

	var obj = parseString(str, options);

	return new Parser(obj);
};

Parser.toXML = function(obj, rootname)
{
	var builder = new XMLBuilder(
		{
			rootName: rootname,
			headless: true,
			attrkey: '$',
			charkey: '_'

		});
	return builder.buildObject(obj);
};

Parser.prototype = {
	_findNode: function(obj, path)
	{
		var parts = path.split('/');
		var part = parts.shift();

		obj = obj[part];

		if (obj !== undefined)
		{
			if (Array.isArray(obj))
			{
				obj = obj[0];
			}

			if (parts.length !== 0)
			{
				obj = this._findNode(obj, parts.join('/'));
			}
		}

		return obj;
	},

	find: function(path)
	{
		return this._findNode(this._data, path);
	},

	toJSON: function()
	{
		return this._data;
	},

	toXML: function()
	{
		// TODD: get rootname from this._data and use Parser.toXML()
	}
};

module.exports = Parser;
