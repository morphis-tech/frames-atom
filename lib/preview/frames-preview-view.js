var path = require('path');
var Emitter = require('atom').Emitter;
var Disposable = require('atom').Disposable;
var CompositeDisposable = require('atom').CompositeDisposable;
var File = require('atom').File;
var $ = require('atom-space-pen-views').$;
var $$$ = require('atom-space-pen-views').$$$;
var ScrollView = require('atom-space-pen-views').ScrollView;
var util = require('util');
var _ = require('underscore-plus');
var fs = require('fs-plus');

var renderer = require('./frames-preview-renderer');

var FramesPreviewView = function(arg)
{
	this.editorId = arg.editorId;
	this.filePath = arg.filePath;

	console.log(arg);

	ScrollView.constructor.call(this, arg);

	this.emitter = new Emitter();
	this.disposables = new CompositeDisposable();
	this.loaded = false;
};

util.inherits(FramesPreviewView, ScrollView);


FramesPreviewView.content = function()
{
	return this.div({
		"class": 'frames-preview native-key-bindings',
		tabindex: -1
	});
};


FramesPreviewView.prototype.attached = function()
{
	var that = this;

	if (this.isAttached)
	{
		return;
	}

	this.isAttached = true;
	if (this.editorId)
	{
		return this.resolveEditor(this.editorId);
	}
	else
	{
		if (atom.workspace)
		{
			return this.subscribeToFilePath(this.filePath);
		}
		else
		{
			return this.disposables.add(atom.packages.onDidActivateInitialPackages(function()
			{
				return that.subscribeToFilePath(that.filePath);
			}));
		}
	}
};

FramesPreviewView.prototype.serialize = function()
{
	return {
		deserializer: 'FramesPreviewView',
		filePath: this.getPath() || this.filePath,
		editorId: this.editorId
	};
};

FramesPreviewView.prototype.destroy = function()
{
	return this.disposables.dispose();
};

FramesPreviewView.prototype.onDidChangeTitle = function(callback)
{
	return this.emitter.on('did-change-title', callback);
};

FramesPreviewView.prototype.onDidChangeModified = function(callback)
{
	return new Disposable();
};

FramesPreviewView.prototype.onDidChangeMarkdown = function(callback)
{
	return this.emitter.on('did-change-markdown', callback);
};

FramesPreviewView.prototype.subscribeToFilePath = function(filePath)
{
	this.file = new File(filePath);
	this.emitter.emit('did-change-title');
	this.handleEvents();
	return this.renderXML();
};

FramesPreviewView.prototype.resolveEditor = function(editorId)
{
	var that = this;

	var resolve = function()
	{
		that.editor = that.editorForId(editorId);
		if (that.editor)
		{
			that.emitter.emit('did-change-title');
			that.handleEvents();
			return that.renderXML();
		}
		else
		{
			if (atom.workspace)
			{
				var pane = atom.workspace.paneForItem(that);
				if (pane)
				{
					return pane.destroyItem(that);
				}
			}
			return void(0);
		}
	};

	if (atom.workspace)
	{
		return resolve();
	}
	else
	{
		return this.disposables.add(atom.packages.onDidActivateInitialPackages(resolve));
	}
};

FramesPreviewView.prototype.editorForId = function(editorId)
{
	var editors = atom.workspace.getTextEditors();
	for (var i = 0, len = editors.length; i < len; i++)
	{
		var editor = editors[i];
		if (editor.id === editorId)
		{
			return editor;
		}
	}
	return null;
};

FramesPreviewView.prototype.handleEvents = function()
{
	var that = this;

	this.disposables.add(atom.grammars.onDidAddGrammar(
		_.debounce(function()
		{
			return that.renderXML();
		}, 250)
	));

	this.disposables.add(atom.grammars.onDidUpdateGrammar(
		_.debounce(function()
		{
			return that.renderXML();
		}, 250)
	));

	atom.commands.add(this.element, {
		'core:move-up': function() { return that.scrollUp(); },
		'core:move-down': function() { return that.scrollDown(); },
		/*'frames-preview:zoom-in': function()
		{
			var zoomLevel = parseFloat(that.css('zoom')) || 1;
			return that.css('zoom', zoomLevel + .1);
			};
		}*/
	});

	var changeHandler = function()
	{
		that.renderXML();

		var pane;
		if (atom.workspace)
		{
			if (typeof(atom.workspace.paneForItem) == 'function')
			{
				pane = atom.workspace.paneForItem(that);
			}
			else
			{
				pane = atom.workspace.paneForURI(that.getURI());
			}
		}

		if (pane && pane !== atom.workspace.getActivePane())
		{
			pane.activateItem(that);
		}
	};

	if (this.file)
	{
		this.disposables.add(this.file.onDidChange(changeHandler));
	}
	else if (this.editor)
	{
		this.disposables.add(this.editor.getBuffer().onDidStopChanging(function()
		{
			if (atom.config.get('frames-preview.liveUpdate'))
			{
				changeHandler();
			}
		}));
		this.disposables.add(this.editor.onDidChangePath(function()
		{
			that.emitter.emit('did-change-title');
		}));
		this.disposables.add(this.editor.getBuffer().onDidSave(function()
		{
			if (!atom.config.get('frames-preview.liveUpdate'))
			{
				changeHandler();
			}
		}));
		this.disposables.add(this.editor.getBuffer().onDidReload(function()
		{
			if (!atom.config.get('frames-preview.liveUpdate'))
			{
				changeHandler();
			}
		}));
	}
};

FramesPreviewView.prototype.renderXML = function()
{
	var that = this;

	if (!this.loaded)
	{
		this.showLoading();
	}

	return this.getEditorSource().then(function(source)
	{
		if (source)
		{
			that.renderXMLText(source);
		}
	});
};

FramesPreviewView.prototype.getEditorSource = function()
{
	if (this.file && this.file.getPath())
	{
		return this.file.read();
	}
	else if (this.editor)
	{
		return Promise.resolve(this.editor.getText());
	}
	else
	{
		return Promise.resolve(null);
	}
};

FramesPreviewView.prototype.getHTML = function(callback)
{
	var that = this;

	return this.getEditorSource().then(function(source)
	{
		if (source)
		{
			return;
		}
		return renderer.toHTML(source, that.getPath(), that.getGrammar(), callback);
	});
};

FramesPreviewView.prototype.renderXMLText = function(text)
{
	var that = this;

	return renderer.toDOMFragment(text, this.getPath(), this.getGrammar(), function(error, domFragment)
	{
		if (error) {
			return that.showError(error);
		} else {
			that.loading = false;
			that.loaded = true;
			that.html(domFragment);
			that.emitter.emit('did-change-markdown');
			return that.originalTrigger('frames-preview:markdown-changed');
		}
	});
};

FramesPreviewView.prototype.getTitle = function()
{
	if (this.file)
	{
		return (path.basename(this.getPath())) + " Preview";
	}
	else if (this.editor)
	{
		return (this.editor.getTitle()) + " Preview";
	}
	else
	{
		return "Frames Preview";
	}
};

FramesPreviewView.prototype.getIconName = function()
{
	return "frames";
};

FramesPreviewView.prototype.getURI = function()
{
	if (this.file)
	{
		return "frames-preview://" + (this.getPath());
	}
	else
	{
		return "frames-preview://editor/" + this.editorId;
	}
};

FramesPreviewView.prototype.getPath = function()
{
	if (this.file)
	{
		return this.file.getPath();
	}
	else if (this.editor)
	{
		return this.editor.getPath();
	}
};

FramesPreviewView.prototype.getGrammar = function()
{
	return this.editor ? this.editor.getGrammar() : void(0);
};

FramesPreviewView.prototype.getDocumentStyleSheets = function()
{
	return document.styleSheets;
};

FramesPreviewView.prototype.getTextEditorStyles = function()
{
	var textEditorStyles;
	textEditorStyles = document.createElement("atom-styles");
	textEditorStyles.initialize(atom.styles);
	textEditorStyles.setAttribute("context", "atom-text-editor");
	document.body.appendChild(textEditorStyles);
	return Array.prototype.slice.apply(textEditorStyles.childNodes).map(function(styleElement)
	{
		return styleElement.innerText;
	});
};

FramesPreviewView.prototype.showError = function(result)
{
	var failureMessage = result ? result.message : undefined;
	return this.html($$$(function()
	{
		this.h2('Previewing Failed');
		if (failureMessage)
		{
			this.h3(failureMessage);
		}
	}));
};

FramesPreviewView.prototype.showLoading = function()
{
	this.loading = true;
	return this.html($$$(function()
	{
		return this.div({
			"class": 'frames-spinner'
		}, 'Loading\u2026');
	}));
};

FramesPreviewView.prototype.isEqual = function(other)
{
	if (other)
	{
		return this[0] === other[0];
	}
	return void(0);
};


module.exports = FramesPreviewView;
