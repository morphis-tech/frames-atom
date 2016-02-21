var Frames = require('./compiler');

var FramesRenderer = {

	toDOMFragment: function(text, filePath, callback)
	{
		console.log('FRAMES: toDOMFragment()');

		if (!text)
		{
			text = '';
		}

		FramesRenderer.toHTML(text, filePath, function(error, html)
		{
			if (error)
			{
				callback(error);
				return;
			}

			console.log('FRAMES: toDOMFragment::toHTML()');

			var out;
			if (typeof(html) == 'string')
			{
				var template = document.createElement('template');
				template.innerHTML = html;
				out = template.content.cloneNode(true);
			}

			callback(null, out || {});
		});
	},

	toHTML: function(text, filePath, callback)
	{
		console.log('FRAMES: toHTML()');

		if (!text)
		{
			text = '';
		}

		Frames.createPreview(text, filePath, callback);
	}
};

module.exports = FramesRenderer;
