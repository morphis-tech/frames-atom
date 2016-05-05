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

			callback(null, out || html);
		});
	},

	toHTML: function(text, filePath, callback)
	{
		console.log('FRAMES: toHTML()');

		if (!text)
		{
			text = '';
		}

		Frames.createPreview(text, filePath, function(error, preview)
		{
			var data = {};
			var iframeId = 'frames-preview-' + preview.ctx;

			var iframe = atom.document.getElementById(iframeId);
			if (iframe)
			{
				// If iframe for that context already exists the html will not be created again
				data.iframeId = 'frames-preview-' + preview.ctx;
			}
			else
			{
				data = '<html><body><iframe id="' + iframeId + '" src="' + preview.src + '"></body></html>';
			}

			callback(null, data);
		});
	}
};

module.exports = FramesRenderer;
