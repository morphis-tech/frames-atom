var startTagPattern = '<\s*[\\.\\-:_a-zA-Z0-9]+';
var endTagPattern = '<\\/\s*[\\.\\-:_a-zA-Z0-9]+';
var autoClosePattern = '\\/>';
var startCommentPattern = '\s*<!--';
var endCommentPattern = '\s*-->';
var fullPattern = new RegExp('(' + startTagPattern + '|' + endTagPattern + '|' +
  autoClosePattern + '|' + startCommentPattern + '|' + endCommentPattern + ')', 'g');

module.exports = {
	getXPath: function(buffer, bufferPosition, prefix, maxDepth) {
		var column, i, idx, len, line, match, matches, ref, row, skipList, tagName, waitingStarTComment, waitingStartComment, waitingStartTag, xpath;
		row = bufferPosition.row, column = bufferPosition.column;
		xpath = [];
		skipList = [];
		waitingStartTag = false;
		waitingStarTComment = false;
		line = buffer.getTextInRange([[row, 0], [row, column - prefix.length]]);
		while (row >= 0 && (!maxDepth || xpath.length < maxDepth))
		{
			row--;
			matches = line.match(fullPattern);
			if (matches !== null)
			{
				matches.reverse();
			}
			ref = matches !== null ? matches : [];
			for (i = 0, len = ref.length; i < len; i++)
      {
				match = ref[i];
				if (match === '<!--')
				{
					waitingStartComment = false;
				}
				else if (match === '-->')
				{
					waitingStartComment = true;
				}
				else if (waitingStartComment)
				{
					continue;
				}
				else if (match === '/>')
				{
					waitingStartTag = true;
				}
				else if (match[0] === '<' && match[1] === '/')
				{
					skipList.push(match.slice(2));
				}
				else if (match[0] === '<' && waitingStartTag)
				{
					waitingStartTag = false;
				}
				else if (match[0] === '<')
				{
					tagName = match.slice(1);
					if (tagName === '?xml')
					{
						continue;
					}
					idx = skipList.lastIndexOf(tagName);
					if (idx !== -1)
					{
						skipList.splice(idx, 1);
					}
					else
					{
						xpath.push(tagName);
					}
				}
			}
			line = buffer.lineForRow(row);
		}
		return xpath.reverse();
	}
};
