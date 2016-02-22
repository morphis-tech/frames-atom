var Service = require('../service');

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

var FramesService = {
	addWebApp: function(rootpath)
	{
		Service.addWebApp(rootpath, function(err, ctx)
		{
			process.send({ method: 'addWebApp', response: ctx, error: err });
		});
	},

	start: function()
	{
		Service.start(function(err, port)
		{
			process.send({ method: 'start', response: { port: port }, error: err });
		});
	},

	stop: function()
	{
		Service.stop(function(err)
		{
			process.send({ method: 'stop', response: undefined, error: err });
		});
	},

	getUrl: function()
	{
		var url = Service.getUrl(function(err, url)
		{
			process.send({ method: 'stop', response: { url: url}, error: err });
		});
	}
};

// this will be a service so, we will start with a timeout before start() i'ts called:
/*
setTimeout(function()
{
	console.log('waiting 10 secs...');
}, 1000 * 10);
*/
