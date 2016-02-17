var path = require('path');
var fs = require('fs-plus');
var temp = require('temp').track();

var Compiler = require('frames-compiler').compiler;
var Settings = require('frames-compiler').settings;

var Frames = {
	createPreview: function(text, viewpath, callback)
	{
		Frames.compile(text, viewpath, callback);
	},

	compile: function(text, viewpath, callback)
	{
		if (fs.existsSync(viewpath))
		{
			var tmpfile = path.join(temp.mkdirSync('frames-'), 'file.xvc');
			fs.writeFileSync(tmpfile, text);

			var root;
			var cfgpath = Frames.getconfig(viewpath);
			if (!cfgpath)
			{
				callback(new Error('No frames.config found! Please use a Frames project to preview files.'));
				return;
			}

			var _params = { viewfolder: '.' };
			var settings = new Settings({
				configfile: cfgpath,
				approot: root,
				input: tmpfile,
				lang: 'en'
			});

			for (var p in _params)
			{
				if (_params.hasOwnProperty(p))
				{
					settings.addParam(p, _params[p]);
				}
			}

			Compiler.process(settings, function(err, data)
			{
				if (err)
				{
					callback(err);
				}

				// just put an iframe
				data= '<html><iframe src="http://morphis-tech.com"></html>';

				temp.cleanup(function(err, stats)
				{
					callback(err, data);
			    });
			});
		}
	},

	getconfig: function(dirpath)
	{
		if (!fs.isDirectorySync(dirpath))
		{
			dirpath = path.dirname(dirpath);
		}

		function _getconfig(d)
		{
			var cfg = fs.resolve(d, 'frames.config');
			if (fs.existsSync(cfg))
			{
				return cfg;
			}
			else
			{
				var dd = path.dirname(d);
				if (dd !== d)
				{
					return _getconfig(dd);
				}
			}
		}

		return _getconfig(dirpath);
	},

	uuid: function()
	{
		var n = 8;
		var a = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
  		var index = (Math.random() * (a.length - 1)).toFixed(0);
  		return n > 0 ? a[index] + make_passwd(n - 1, a) : '';
	}
};

module.exports = Frames;
