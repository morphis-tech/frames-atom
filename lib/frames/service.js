var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs-plus");

// TODO: check port availability
var port = 8888;

var WEBAPPS = [];
var WEBROOT = path.resolve(__dirname, '../../static');

FramesService = {
	addWebapp: function(context, rootpath)
	{
		WEBAPPS.push({
			context: context,
			rootpath: rootpath
		});
	},

	start: function()
	{
		this.server = http.createServer(function(request, response)
		{
			var uri = url.parse(request.url).pathname;
			var filename = path.join(WEBROOT, uri);

			fs.exists(filename, function(exists)
			{
				if (!exists)
				{
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
						response.writeHead(500, {"Content-Type": "text/plain"});
						response.write(err + "\n");
						response.end();
						return;
					}

					response.writeHead(200);
					response.write(file, "binary");
					response.end();
				});
			});
		});

		this.server.listen(parseInt(port, 10));
	},

	stop: function()
	{
		this.server.close();
	},

	getUrl: function()
	{
		return 'http://localhost:' + port + '/';
	}
};

module.exports = FramesService;
