var path = require('path');
var Config = require('../lib/frames/objects/config');

var rootdir;
var cfg;

describe("Frames Atom package", function()
{
	beforeEach(function()
	{
		rootdir = path.resolve(__dirname, '..');
		console.log(rootdir);
	});

	describe("Config", function()
	{
		it("load frames.config file", function()
		{
			var file = path.resolve(rootdir, 'example/frames.config');
			cfg = Config.load(file);
			expect(cfg.parameters).toBeDefined();
		});

		it("parse frames.config file", function()
		{
			expect(cfg.getParameter('debug')).toEqual('false');
		});
	});
});
