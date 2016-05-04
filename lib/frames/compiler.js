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
				var webprojectroot = cfg.getParameter('projectroot');
				var webprojectrootpath = webprojectroot ? cfg.resolve(webprojectroot) : undefined;
				if (!webprojectroot || !fs.existsSync(webprojectrootpath))
				{
					callback(new Error('Invalid projectroot parameter in frames.config!'));
					return;
				}

				if (!fs.existsSync(path.resolve(webprojectrootpath, 'index.html')) || !fs.existsSync(path.resolve(webprojectrootpath, 'config.xml')))
				{
					callback(new Error('No index.html or config.xml found!'));
					return;
				}

				if (!fs.existsSync(path.resolve(webprojectrootpath, 'runtime')))
				{
					callback(new Error('No frames runtime found!'));
					return;
				}

				// TODO: get source folder from project (ex: java could be src/main/java)
				//       get source folder from config parameter sourceoath
				var projectsourceroot = cfg.root;

				var srcpath = cfg.getParameter('sourcepath');
				if (srcpath)
				{
					projectsourceroot = path.resolve(projectsourceroot, srcpath);
				}

				var debug = cfg.getParameter('debug') || 'false';

				console.log('FRAMES-COMPILER: projet source', projectsourceroot);

				// TODO: get all projects to create a classpath to resolve includes

				Service.start(function(err)
				{
					if (err)
					{
						callback(new Error('No frames service running or some error ocurred!'));
						return;
					}

					Service.addWebApp(webprojectrootpath, function(err, ctx)
					{
						if (!ctx || err)
						{
							callback(new Error('No frames service running or some error ocurred!'));
							return;
						}

						var tmpinfile = path.join(ctx.viewroot, 'view.xvc');
						var tmpoutfile = path.join(ctx.viewroot, 'view.html');

						try
						{
							fs.writeFileSync(tmpinfile, text);

							// console.log('FRAMES-COMPILER', tmpoutfile);

							var _params = { viewfolder: '.' };
							var settings = new Settings({
								configfile: cfgpath,
								approot: projectsourceroot,
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
									console.log('FRAMES-COMPILER: ERROR', err);
									callback(err);
									return;
								}

								var purl = ctx.url + '?v=view&debug=' + debug;

								console.log('FRAMES-COMPILER:', purl);
								console.log('FRAMES-COMPILER:', ctx);
								console.log('FRAMES-COMPILER:', ctx.context);

								fs.writeFileSync(tmpoutfile, data);

								// TODO compiler should return only the generated html?!!
								// reload preview in runtime ( after edit xvc)

								/*var iframe = atom.document.getElementById('frames-preview-' + ctx.context);
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
								else
								{
									data = '<html><body><iframe id="frames-preview-' + ctx.context + '" src="' + purl + '"></body></html>';
								}*/
								// TODO passar json com duas props, context (applicacao) e html

								data = '<html><body><iframe id="frames-preview-' + ctx.context + '" src="' + purl + '"></body></html>';
								callback(undefined, data);
							});
						}
						catch (e)
						{
							callback(new Error('Some error ocurred compiling file!'));
						}
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
