var path = require('path');
var fs = require('fs-plus');

var Compiler = require('frames-compiler').compiler;
var Settings = require('frames-compiler').settings;
var Service = require('./service');
var Config = require('./objects/config');


var Frames = {
	createPreview: function(text, viewpath, callback)
	{
		Frames.compile(text, viewpath, callback);
	},

	compile: function(text, viewpath, callback)
	{
		if (fs.existsSync(viewpath))
		{
			var cfgpath = Frames.getconfig(viewpath);
			if (!cfgpath)
			{
				callback(new Error('No frames.config found! Please use a Frames project to preview files.'));
				return;
			}

			Config.load(cfgpath, function(err, cfg)
			{
				var projectroot = cfg.getParameter('projectroot');
				var projectrootpath = projectroot ? cfg.resolve(projectroot) : undefined;
				if (!projectroot || !fs.existsSync(projectrootpath))
				{
					callback(new Error('Invalid projectroot parameter in frames.config!'));
					return;
				}

				Service.start(function(err)
				{
					Service.addWebApp(projectroot, function(err, ctx)
					{
						if (!ctx)
						{
							callback(new Error('No frames service running or some error ocurred!'));
							return;
						}

						var tmpinfile = path.join(ctx.viewroot, 'view.xvc');
						var tmpoutfile = path.join(ctx.viewroot, 'view.html');

						fs.writeFileSync(tmpinfile, text);

						// console.log('FRAMES-COMPILER', tmpoutfile);

						var _params = { viewfolder: '.' };
						var settings = new Settings({
							configfile: cfgpath,
							approot: cfg.root,
							input: tmpinfile,
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

							var purl = ctx.url + '?v=view&debug=true';

							console.log('FRAMES-COMPILER:', purl);
							console.log('FRAMES-COMPILER:', ctx.context);

							fs.writeFileSync(tmpoutfile, data);

							var iframe = atom.document.getElementById('frames-preview-' + ctx.context );
							console.log('FRAMES-COMPILER:', iframe);
							if (iframe)
							{
								try
								{
									iframe.contentWindow.Frames.Application.task.view.reload();
								}
								catch (e)
								{
									console.log(e);
								}
								data = {};
							}
							else {
								data = '<html><body><iframe id="frames-preview-' + ctx.context + '" src="' + purl + '"></body></html>';
							}

							callback(undefined, data);
						});
					});
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
	}
};

module.exports = Frames;
