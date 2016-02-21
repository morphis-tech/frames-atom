var Service = require('../service.js');

process.on('message', function(data)
{
	var method = data.method;
	var args = data.arguments;
	var func = FramesService[method];
	if (func)
	{
		func.apply(FramesService, args);
	}
});

//process.send({ port: port });

var FramesService = {
	addWebApp: function(rootpath)
	{
		var ctx = Service.addWebApp();
		process.send({ method: 'addWebApp', response: ctx });
	},

	start: function()
	{
		Service.start(function(err, port)
		{
			process.send({ method: 'start', response: { port: port } });
		});
	},

	stop: function()
	{
		Service.stop(function(err)
		{
			process.send({ method: 'stop', response: undefined });
		});
	},

	getUrl: function()
	{
		var url = Service.getUrl();
		process.send({ method: 'stop', response: { url: url} });
	}
};

module.expect = FramesService;
