var xsd = require('./xsd');
var utils = require('./xml-utils');
var xmlValidation = /xmlns:xsi="http:\/\/www.w3.org\/2001\/XMLSchema-instance"/;
var xsdPattern = /xsi:noNamespaceSchemaLocation="(.+)"/;

module.exports = {
	selector: '.text.xvc',
	disableForSelector: '.text.xvc .comment',
	inclusionPriority: 1,
	excludeLowerPriority: true,
	lastXsdUri: '',
	getSuggestions: function(options) {
		var newUri;
		newUri = this.getXsdUri(options);
		if (!newUri)
		{
			this.lastXsdUri = '';
			xsd.clear();
			return [];
		}
		else if (newUri === this.lastXsdUri)
		{
			return this.detectAndGetSuggestions(options);
		}
		else
		{
			return new Promise((function(_this) {
				return function(resolve) {
					return xsd.load(options.editor.getPath(), newUri, function() {
						_this.lastXsdUri = newUri;
						return resolve(_this.detectAndGetSuggestions(options));
					});
				};
			})(this));
		}
	},
	detectAndGetSuggestions: function(options) {
		if (this.isTagName(options)) {
			return this.getTagNameCompletions(options);
		} else if (this.isCloseTagName(options)) {
			return this.getCloseTagNameCompletion(options);
		} else if (this.isAttributeValue(options)) {
			return this.getAttributeValueCompletions(options);
		} else if (this.isAttribute(options)) {
			return this.getAttributeCompletions(options);
		} else if (this.isTagValue(options)) {
			return this.getValuesCompletions(options);
		} else {
			return [];
		}
	},
	getXsdUri: function(arg) {
		
		return atom.packages.getPackageDirPaths()[0] + '/frames-atom/lib/autocomplete/xvc.xsd';
	},
	filterCompletions: function(sugs, pref) {
		var completions, i, len, ref, s;
		completions = [];
		pref = pref != null ? pref.trim() : void 0;
		for (i = 0, len = sugs.length; i < len; i++) {
			s = sugs[i];
			if (!pref || ((ref = s.text) != null ? ref : s.snippet).indexOf(pref) !== -1) {
				completions.push(this.buildCompletion(s));
			}
		}
		return completions;
	},
	buildCompletion: function(value) {
		return {
			text: value.text,
			snippet: value.snippet,
			displayText: value.displayText,
			description: value.description,
			type: value.type,
			rightLabel: value.rightLabel,
			leftLabel: value.leftLabel
		};
	},
	isTagName: function(arg) {
		var bufferPosition, column, editor, prefix, row, tagChars, tagPos;
		editor = arg.editor, bufferPosition = arg.bufferPosition, prefix = arg.prefix;
		row = bufferPosition.row, column = bufferPosition.column;
		tagPos = column - prefix.length - 1;
		tagChars = editor.getTextInBufferRange([[row, tagPos], [row, tagPos + 1]]);
		return tagChars === '<' || prefix === '<';
	},
	getTagNameCompletions: function(arg) {
		var bufferPosition, children, editor, prefix;
		editor = arg.editor, bufferPosition = arg.bufferPosition, prefix = arg.prefix;
		children = xsd.getChildren(utils.getXPath(editor.getBuffer(), bufferPosition, prefix));
		return this.filterCompletions(children, (prefix === '<' ? '' : prefix));
	},
	isCloseTagName: function(arg) {
		var bufferPosition, column, editor, prefix, row, tagChars, tagClosePos;
		editor = arg.editor, bufferPosition = arg.bufferPosition, prefix = arg.prefix;
		row = bufferPosition.row, column = bufferPosition.column;
		tagClosePos = column - prefix.length - 2;
		tagChars = editor.getTextInBufferRange([[row, tagClosePos], [row, tagClosePos + 2]]);
		return tagChars === "</";
	},
	getCloseTagNameCompletion: function(arg) {
		var bufferPosition, editor, parentTag, prefix;
		editor = arg.editor, bufferPosition = arg.bufferPosition, prefix = arg.prefix;
		parentTag = utils.getXPath(editor.getBuffer(), bufferPosition, prefix, 1);
		parentTag = parentTag[parentTag.length - 1];
		return [
			{
				text: parentTag + '>',
				displayText: parentTag,
				type: 'tag',
				rightLabel: 'Tag'
			}
		];
	},
	isTagValue: function(arg) {
		var scopeDescriptor;
		scopeDescriptor = arg.scopeDescriptor;
		return scopeDescriptor.getScopesArray().indexOf('text.xvc') !== -1;
	},
	getValuesCompletions: function(arg) {
		var bufferPosition, children, editor, prefix;
		editor = arg.editor, bufferPosition = arg.bufferPosition, prefix = arg.prefix;
		children = xsd.getValues(utils.getXPath(editor.getBuffer(), bufferPosition, ''));
		return this.filterCompletions(children, prefix);
	},
	isAttribute: function(arg) {
		var bufferPosition, column, editor, prefix, previousChar, row, scopeDescriptor, scopes;
		scopeDescriptor = arg.scopeDescriptor, editor = arg.editor, prefix = arg.prefix, bufferPosition = arg.bufferPosition;
		row = bufferPosition.row, column = bufferPosition.column;
		column -= prefix.length;
		previousChar = editor.getTextInBufferRange([[row, column - 1], [row, column]]);
		scopes = scopeDescriptor.getScopesArray();
		return (scopes.indexOf('meta.tag.xml') !== -1 || scopes.indexOf('meta.tag.no-content.xml') !== -1) && previousChar !== '>';
	},
	getAttributeCompletions: function(arg) {
		var attributes, bufferPosition, editor, prefix;
		editor = arg.editor, bufferPosition = arg.bufferPosition, prefix = arg.prefix;
		attributes = xsd.getAttributes(utils.getXPath(editor.getBuffer(), bufferPosition, ''));
		return this.filterCompletions(attributes, prefix);
	},
	isAttributeValue: function(arg) {
		var prefix, scopeDescriptor, scopes;
		scopeDescriptor = arg.scopeDescriptor, prefix = arg.prefix;
		scopes = scopeDescriptor.getScopesArray();
		return scopes.indexOf('string.quoted.double.xml') !== -1;
	},
	getAttributeValueCompletions: function(arg) {
		var attrName, attrNamePattern, bufferPosition, children, column, editor, line, matches, prefix, ref, row, xpath;
		editor = arg.editor, prefix = arg.prefix, bufferPosition = arg.bufferPosition;
		row = bufferPosition.row, column = bufferPosition.column;
		line = editor.getTextInBufferRange([[row, 0], [row, column - prefix.length]]);
		attrNamePattern = /[\.\-:_a-zA-Z0-9]+=/g;
		attrName = matches = (ref = line.match(attrNamePattern)) != null ? ref.reverse()[0] : void 0;
		attrName = attrName.slice(0, -1);
		xpath = utils.getXPath(editor.getBuffer(), bufferPosition, '');
		children = xsd.getAttributeValues(xpath, attrName);
		return this.filterCompletions(children, prefix);
	}
};
