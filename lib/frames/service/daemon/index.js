var path = require('path');
var fork = require('child_process').fork;

var filepath = path.resolve(__dirname, 'child.js');
var _service;
var _callback;
var port;

var FramesService = {
	callAndWait: function(method, args, callback)
	{
		_callback = callback;

		console.log('FRAMES-SERVICE: calling', method, '..');
		_service.send({method: method, arguments: args});
	},

	addWebApp: function(rootpath, callback)
	{
		FramesService.callAndWait('addWebApp', [rootpath], callback);
	},

	start: function(callback)
	{
		if (!_service)
		{
			_service = fork(filepath);

			_service.on('message', function(res)
			{
				console.log('FRAMES-SERVICE: message', res);
				if (_callback)
				{
					_callback(undefined, res.response || {});
				}
			});

			_service.on('close', function()
			{
				console.log('FRAMES-SERVICE: CLOSED', arguments);
				_service = undefined;
			});

			FramesService.callAndWait('start', [], function(err, res)
			{
				port = res.port;
				callback(undefined, port);
			});
			return;
		}

		callback(undefined, port);
	},

	stop: function(callback)
	{
		FramesService.callAndWait('stop', [], function(err, res)
		{
			console.log('FRAMES-SERVICE: STOPPED!!');

			_service.kill('SIGINT');
			_service = undefined;

			callback(undefined);
		});
	},

	getUrl: function(callback)
	{
		var res = FramesService.callAndWait('getUrl', [], function(err, res)
		{
			callback(undefined, res);
		});
	}
};

module.exports = FramesService;
