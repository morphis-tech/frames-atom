var http = require('http');
var mime = require('mime-types');
var url = require('url');
var path = require('path');
var fs = require('fs-plus');
var temp = require('temp').track();

// TODO: check port availability
var port = 8888;
var WEBAPPS = [];
var _service;

var FramesService = {
	addWebApp: function(rootpath, callback)
	{
		// validate that exits
		for (var i = 0; i < WEBAPPS.length; i++)
		{
			var app = WEBAPPS[i];

			if (app.root == rootpath)
			{
				if (callback)
				{
					callback(undefined, app);
					return;
				}
				return app;
			}
		}

		var context = 'app' + (WEBAPPS.length + 1);
		var tmpdir = temp.mkdirSync('frames-');

		var obj = {
			root: rootpath,
			viewroot: tmpdir,
			context: context,
			url: FramesService.getUrl() + context + '/'
		};
		WEBAPPS.push(obj);

		if (callback)
		{
			callback(undefined, obj);
			return;
		}

		return obj;
	},

	start: function(callback)
	{
		_service = http.createServer(function(request, response)
		{
			var pathname = url.parse(request.url).pathname;

			if (pathname != '/')
			{
				var filename;
				for (var i = 0; i < WEBAPPS.length; i++)
				{
					var app = WEBAPPS[i];

					if (pathname.startsWith('/' + app.context + '/'))
					{
						pathname = pathname.substring(app.context.length + 1);

						if (pathname.startsWith('/views/'))
						{
							pathname = pathname.substring('/views/'.length);
							filename = path.join(app.viewroot, pathname);
						}
						else
						{
							filename = path.join(app.root, pathname);
						}
						break;
					}
				}

				if (!filename)
				{
					response.writeHead(404, {'Content-Type': 'text/plain'});
					response.write('404 Not Found\n');
					response.end();
					return;
				}

				fs.exists(filename, function(exists)
				{
					if (!exists)
					{
						response.writeHead(404, {'Content-Type': 'text/plain'});
						response.write('404 Not Found\n');
						response.end();
						return;
					}

					if (fs.statSync(filename).isDirectory())
					{
						filename += '/index.html';
					}

					fs.readFile(filename, 'binary', function(err, file)
					{
						if (err)
						{
							response.writeHead(500, {'Content-Type': 'text/plain'});
							response.write(err + '\n');
							response.end();
							return;
						}

						response.writeHead(200, {'Content-Type': mime.lookup(filename) || 'application/octet-stream'});
						response.write(file, 'binary');
						response.end();
					});
				});
			}

			// TODO: list all webapps and some status and use some template
			else
			{
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write("<html><head><title>Frames Service</title></head><body><p>Frames Service it's running!</p></body></html>\n");
				response.end();
				return;
			}
		});

		_service.listen(parseInt(port, 10), function(err)
		{
			if (callback)
			{
				callback(err, port);
			}
		});
	},

	stop: function(callback)
	{
		temp.cleanup(function(err, stats)
		{
			_service.close(function()
			{
				if (callback)
				{
					callback(err, port);
				}
			});
		});
	},

	getUrl: function(callback)
	{
		var _url = 'http://localhost:' + port + '/';
		if (callback)
		{
			callback(undefined, _url);
		}
		else
		{
			return _url;
		}
	}
};


module.exports = FramesService;
