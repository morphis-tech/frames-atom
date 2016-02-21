var path = require('path');
var fork = require('child_process').fork;
var deasync = require('deasync');

var filepath = path.resolve(__dirname, 'child.js');
var _service;
var _response;
var port;

var FramesService = {
	_waitForReponse: function(method)
	{
		console.log('FRAMES-SERVICE: _waitForReponse', method);

		var i = 0;
		deasync.loopWhile(function()
		{
			//deasync.sleep(100);
			//console.log('FRAMES-SERVICE: waiting for ' + method + 'response...', i, _response);
			return _service && _response === undefined;
		});
	},

	callAndWait: function(method, args)
	{
		_response = undefined;
		console.log('FRAMES-SERVICE: calling', method, '..');
		_service.send({method: method, arguments: args});
		FramesService._waitForReponse(method);
		console.log('FRAMES-SERVICE: done', method);
		return _response;
	},

	addWebApp: function(rootpath)
	{
		return FramesService.callAndWait('addWebApp', [rootpath]);
	},

	start: function()
	{
		if (!_service)
		{
			_service = fork(filepath);

			_service.on('message', function(res)
			{
				console.log('FRAMES-SERVICE: message', res);
				_response = res.response || {};
			});

			_service.on('close', function()
			{
				console.log('FRAMES-SERVICE: CLOSED', arguments);
				_service = undefined;
			});

			var res = FramesService.callAndWait('start');
			port = res.port;
		}
	},

	stop: function()
	{
		FramesService.callAndWait('stop');
		console.log('FRAMES-SERVICE: STOPPED!!');

		//_service.kill('SIGINT');
		_service = undefined;
	},

	getUrl: function()
	{
		return 'http://localhost:' + port + '/';
	}
};

module.exports = FramesService;
