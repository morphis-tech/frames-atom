var path = require('path');
var Emitter = require('atom').Emitter;
var Disposable = require('atom').Disposable;
var CompositeDisposable = require('atom').CompositeDisposable;
var File = require('atom').File;
var $ = require('atom-space-pen-views').$;
var $$$ = require('atom-space-pen-views').$$$;
var ScrollView = require('atom-space-pen-views').ScrollView;
// var util = require('util');
var _ = require('underscore-plus');

var renderer = require('../frames/renderer');
var AtomUtils = require('../frames/utils/atom');

// TODO: use some library for inheritance
__extends = function(child, parent) { for (var key in parent) { if (parent.hasOwnProperty(key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

var FramesPreviewView = function()
{
	console.log('FRAMES: FramesPreviewView::constructor()');

	atom.deserializers.add(this);

	ScrollView.__super__.constructor.apply(this, arguments);

	this.emitter = new Emitter();
	this.disposables = new CompositeDisposable();
};

// util.inherits(FramesPreviewView, ScrollView);
__extends(FramesPreviewView, ScrollView);


FramesPreviewView.content = function()
{
	return this.div(
	{
		class: 'frames-atom native-key-bindings',
		tabindex: -1
	});
};

FramesPreviewView.deserialize = function(arg)
{
	console.log('FRAMES: FramesPreviewView::deserialize()');
	return new FramesPreviewView(arg.data);
};

FramesPreviewView.prototype.serialize = function()
{
	console.log('FRAMES: FramesPreviewView::serialize()');
	return {
		deserializer: 'FramesPreviewView',
		filePath: this.getPath() || this.filePath
	};
};

FramesPreviewView.prototype.destroy = function()
{
	console.log('FRAMES: FramesPreviewView::destroy()');
	return this.disposables.dispose();
};

FramesPreviewView.prototype.attached = function()
{
	/*console.log('FRAMES: FramesPreviewView::attached()');
	var that = this;

	if (this.isAttached)
	{
		return;
	}

	this.isAttached = true;
	if (this.editorId)
	{
		this.resolveEditor(this.editorId);
	}
	else
	{
		if (atom.workspace)
		{
			this.subscribeToFilePath(this.filePath);
		}
		else
		{
			this.disposables.add(atom.packages.onDidActivateInitialPackages(function()
			{
				that.subscribeToFilePath(that.filePath);
			}));
		}
	}
	*/
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
	return this.renderPreview();
};

FramesPreviewView.prototype.resolveEditor = function(editorId)
{
	var that = this;

	console.log('FRAMES: resolveEditor()', editorId);

	var resolve = function()
	{
		that.editor = that.editorForId(editorId);
		console.log('FRAMES: resolve(): editor', that.editor);
		if (that.editor)
		{
			that.emitter.emit('did-change-title');
			that.handleEvents();
			that.renderPreview();
		}
		else
		{
			if (atom.workspace)
			{
				var pane = atom.workspace.paneForItem(that);
				if (pane)
				{
					// The editor preview that was created for has been closed so close
					// this preview since a preview cannot be rendered without an editor
					pane.destroyItem(that);
				}
			}
		}
	};

	if (atom.workspace)
	{
		console.log('FRAMES: resolve(): atom.workspace');
		resolve();
	}
	else
	{
		console.log('FRAMES: resolve(): onDidActivateInitialPackages');
		this.disposables.add(atom.packages.onDidActivateInitialPackages(resolve));
	}
};

FramesPreviewView.prototype.editorForId = function(editorId)
{
	var editors = atom.workspace.getTextEditors();
	for (var i = 0, len = editors.length; i < len; i++)
	{
		var editor = editors[i];
		if (editor.id == editorId)
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
			console.log('FRAMES: FramesPreviewView::handleEvents(): onDidAddGrammar');
			that.renderPreview();
		}, 250)
	));

	this.disposables.add(atom.grammars.onDidUpdateGrammar(
		_.debounce(function()
		{
			console.log('FRAMES: FramesPreviewView::handleEvents(): onDidUpdateGrammar');
			that.renderPreview();
		}, 250)
	));

	this.disposables.add(atom.workspace.onDidChangeActivePaneItem(
		_.debounce(function()
		{
			console.log('FRAMES: FramesPreviewView::handleEvents(): onDidChangeActivePaneItem');
			var editor = atom.workspace.getActiveTextEditor();
			if (editor && AtomUtils.editorHasValidGrammar(editor) && editor.id != that.editor.id)
			{
				that.resolveEditor(editor.id);
			}
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
		console.log('FRAMES: changeHandler()');

		that.renderPreview();

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
			console.log('FRAMES: changeHandler(): pane', pane);
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
			if (atom.config.get('frames-atom.liveUpdate'))
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
			if (!atom.config.get('frames-atom.liveUpdate'))
			{
				changeHandler();
			}
		}));
		this.disposables.add(this.editor.getBuffer().onDidReload(function()
		{
			if (!atom.config.get('frames-atom.liveUpdate'))
			{
				changeHandler();
			}
		}));
	}
};

FramesPreviewView.prototype.getEditorSource = function()
{
	console.log('FRAMES: FramesPreviewView::getEditorSource()');

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

FramesPreviewView.prototype.hideIframes = function()
{
	console.log('FRAMES: FramesPreviewView::hideIframes()');
	this.find('iframe').hide();
};

FramesPreviewView.prototype.showIframe = function(iframeId)
{
	console.log('FRAMES: FramesPreviewView::showIframe(): ' + iframeId);
	if (iframeId)
	{
		return this.find('iframe[id="' + iframeId + '"]').show();
	}
};

FramesPreviewView.prototype.renderPreview = function()
{
	console.log('FRAMES: FramesPreviewView::renderPreview()');

	var that = this;

	that.hideIframes();
	this.showLoading();

	return this.getEditorSource().then(function(source)
	{
		if (source)
		{
			renderer.toDOMFragment(source, that.getPath(), function(error, domFragment)
			{
				console.log('FRAMES: FramesPreviewView::renderPreview()', domFragment);

				if (error)
				{
					that.showError(error);
				}
				else
				{
					that.hideLoading();

					if (domFragment && domFragment.nodeName == '#document-fragment')
					{ // Append iframe from a new app
						that.append(domFragment);
					} else
					{
						// App iframe was already created. Show it and reload the view.
						var iframe = that.showIframe(domFragment.iframeId);
						if (iframe)
						{
							try
							{
								iframe[0].contentWindow.Frames.Application.task.view.reload();
							}
							catch (e)
							{
								console.log(e);
							}
						}
					}

					that.emitter.emit('did-change-markdown');
					that.originalTrigger('frames-preview:markdown-changed');
				}
			});
		}
	});
};

FramesPreviewView.prototype.getTitle = function()
{
	if (this.file)
	{
		return (path.basename(this.getPath())) + ' Preview';
	}
	else if (this.editor)
	{
		return (this.editor.getTitle()) + ' Preview';
	}
	else
	{
		return 'Frames Preview';
	}
};

FramesPreviewView.prototype.getIconName = function()
{
	return 'frames';
};

FramesPreviewView.prototype.getURI = function()
{
	if (this.file)
	{
		return 'frames-preview://' + (this.getPath());
	}
	else
	{
		return 'frames://editor/preview/';
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

FramesPreviewView.prototype.getDocumentStyleSheets = function()
{
	return document.styleSheets;
};

FramesPreviewView.prototype.showError = function(result)
{
	var failureMessage = result ? result.message : undefined;
	return this.html($$$(function()
	{
		this.div('Previewing Failed');
		if (failureMessage)
		{
			atom.notifications.addError(failureMessage);
		}
	}));
};

FramesPreviewView.prototype.showLoading = function()
{
	var sId = 'frames-loading-spinner';

	var $spinner = this.find('#' + sId);
	if ($spinner.length > 0)
	{
		$spinner.show();
	} else
	{
		this.append($$$(function()
		{
			return this.div({
				id: sId,
				class: 'frames-spinner'
			}, 'Loading\u2026');
		}));
	}
};

FramesPreviewView.prototype.hideLoading = function()
{
	this.find('#frames-loading-spinner').hide();
};

module.exports = FramesPreviewView;
