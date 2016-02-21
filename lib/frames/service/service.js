var http = require("http");
var mime = require('mime-types');
var url = require("url");
var path = require("path");
var fs = require("fs-plus");
var temp = require('temp').track();

// TODO: check port availability
var port = 8888;
var WEBAPPS = [];
var _service;

process.on('message', function(data)
{
	var method = data.method;
	var args = data.arguments;
	var func = FramesService[method];
	if (func)
	{
		process.stdout.write('FRAMES: ' + method);
		func.apply(FramesService, args);
	}
});

//process.send({ port: port });

var FramesService = {
	addWebApp: function(rootpath)
	{
		// validate that exits
		for (var i = 0; i < WEBAPPS.length; i++)
		{
			var app = WEBAPPS[i];

			if (app.root == rootpath)
			{
				process.send({ method: 'addWebApp', response: app });
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

		process.stdout.write('FRAMES: added webapp ' + context);

		process.send({ method: 'addWebApp', response: obj });
		return obj;
	},

	start: function()
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
					process.stdout.write('FRAMES-SERVICE: ' + 404 + ' ' + request.url);

					response.writeHead(404, {"Content-Type": "text/plain"});
					response.write("404 Not Found\n");
					response.end();
					return;
				}

				// process.stdout.write('FRAMES-SERVICE', filename);

				fs.exists(filename, function(exists)
				{
					if (!exists)
					{
						process.stdout.write('FRAMES-SERVICE: ' + 404 + ' ' + request.url);

						response.writeHead(404, {"Content-Type": "text/plain"});
						response.write("404 Not Found\n");
						response.end();
						return;
					}

					if (fs.statSync(filename).isDirectory())
					{
						filename += '/index.html';
					}

					fs.readFile(filename, "binary", function(err, file)
					{
						if (err)
						{
							process.stdout.write('FRAMES-SERVICE: ' + 500 + ' ' + request.url);

							response.writeHead(500, {"Content-Type": "text/plain"});
							response.write(err + "\n");
							response.end();
							return;
						}

						response.writeHead(200, {'Content-Type': mime.lookup(filename) || 'application/octet-stream'});
						response.write(file, "binary");
						response.end();
					});
				});
			}

			// TODO: list all webapps and some status and use some template
			else
			{
				response.writeHead(200, {"Content-Type": "text/html"});
				response.write("<html><head><title>Frames Service</title></head><body><p>Frames Service it's running!</p></body></html>\n");
				response.end();
				return;
			}
		});

		_service.listen(parseInt(port, 10), function()
		{
			process.send({ method: 'start', response: { port: port } });
		});
	},

	stop: function()
	{
		temp.cleanup(function(err, stats)
		{
			_service.close(function()
			{
				process.send({ method: 'stop', response: undefined });
			});
		});
	},

	getUrl: function()
	{
		return 'http://localhost:' + port + '/';
	}
};

//FramesService.start();
