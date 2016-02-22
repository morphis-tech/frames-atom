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
					console.log('FRAMES-SERVICE: callback:', res.method);
					_callback(res.error, res.response || {});
				}
			});

			_service.on('close', function(code)
			{
				console.log('FRAMES-SERVICE: CLOSED', code);
				if (_callback)
				{
					_callback(new Error('Service terminated with code ' + code));
				}
				_service = undefined;
			});

			FramesService.callAndWait('start', [], function(err, res)
			{
				if (!err)
				{
					port = res.port;
					console.log('FRAMES-SERVICE: service started on port', port);
				}
				callback(err, port);
			});
			return;
		}

		console.log('FRAMES-SERVICE: service already started on port', port);
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
