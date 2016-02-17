exports.toDOMFragment = function(text, filePath, grammar, callback)
{
	console.log('FRAMES: toDOMFragment()');

	if (!text)
	{
		text = '';
	}

	return render(text, filePath, function(error, html)
	{
		if (error)
		{
			return callback(error);
		}

		var template = document.createElement('template');
		template.innerHTML = html;

		var domFragment = template.content.cloneNode(true);

		return callback(null, domFragment);
	});
};

exports.toHTML = function(text, filePath, grammar, callback)
{
	console.log('FRAMES: toHTML()');

	if (!text)
	{
		text = '';
	}

	return render(text, filePath, function(error, html)
	{
		if (error)
		{
			return callback(error);
		}

		// TODO: convert to HTML
		
		return callback(null, html);
	});
};

render = function(text, filePath, callback)
{
	// TODO: do convertion
	var html = text;

	callback(null, html.trim());
};
