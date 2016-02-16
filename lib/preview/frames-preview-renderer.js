var path = require('path');
var _ = require('underscore-plus');
var fs = require('fs-plus');
var $ = require('atom-space-pen-views').$;

var roaster = null;
var highlighter = null;

var resourcePath = atom.getLoadSettings().resourcePath;
var packagePath = path.dirname(__dirname);


exports.toDOMFragment = function(text, filePath, grammar, callback)
{
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


		var defaultCodeLanguage;
		var g = grammar ? grammar.scopeName : undefined;
		if (g === 'source.litcoffee')
		{
			defaultCodeLanguage = 'coffee';
		}

		convertCodeBlocksToAtomEditors(domFragment, defaultCodeLanguage);
		return callback(null, domFragment);
	});
};

exports.toHTML = function(text, filePath, grammar, callback)
{
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

		var defaultCodeLanguage;
		var g = grammar ? grammar.scopeName : undefined;
		if (g === 'source.litcoffee')
		{
			defaultCodeLanguage = 'coffee';
		}

		//html = tokenizeCodeBlocks(html, defaultCodeLanguage);
		return callback(null, html);
	});
};

render = function(text, filePath, callback)
{
	if (!roaster)
	{
		roaster = require('roaster');
	}

	var options = {
		sanitize: false,
		breaks: atom.config.get('frames-preview.breakOnSingleNewline')
	};

	text = text.replace(/^\s*<!doctype(\s+.*)?>\s*/i, '');
	return roaster(text, options, function(error, html) {
		if (error)
		{
			return callback(error);
		}

		html = sanitize(html);
		return callback(null, html.trim());
	});
};

function sanitize(html)
{
	return html;
}

function convertCodeBlocksToAtomEditors(domFragment, defaultLanguage)
{
	if (!defaultLanguage)
	{
		defaultLanguage = 'text';
	}

	var fontFamily = atom.config.get('editor.fontFamily');
	if (fontFamily)
	{
		var ref = domFragment.querySelectorAll('code');
		for (var i = 0, len = ref.length; i < len; i++)
		{
			var codeElement = ref[i];
			codeElement.style.fontFamily = fontFamily;
		}
	}

	var ref1 = domFragment.querySelectorAll('pre');
	for (var j = 0, len1 = ref1.length; j < len1; j++)
	{
		var preElement = ref1[j];
		var codeBlock = (ref2 = preElement.firstElementChild) !== null ? ref2 : preElement;
		var fenceName = (ref3 = (ref4 = codeBlock.getAttribute('class')) !== null ? ref4.replace(/^lang-/, '') : void 0) !== null ? ref3 : defaultLanguage;
		var editorElement = document.createElement('atom-text-editor');

		editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
		editorElement.removeAttribute('tabindex');
		preElement.parentNode.insertBefore(editorElement, preElement);
		preElement.remove();
		editor = editorElement.getModel();
		editor.getDecorations({
			"class": 'cursor-line',
			type: 'line'
		})[0].destroy();
		editor.setText(codeBlock.textContent.trim());

		//var grammar = atom.grammars.grammarForScopeName(scopeForFenceName(fenceName));
		//if (grammar)
		//{
		//	editor.setGrammar(grammar);
		//}
	}
	return domFragment;
}
