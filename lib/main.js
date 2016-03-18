var url = require('url');
var fs = require('fs-plus');

var FramesPreviewView;

function isFramesPreviewView(object)
{
	if (!FramesPreviewView)
	{
		FramesPreviewView = require('./views/preview-view');
	}

	return object instanceof FramesPreviewView;
}

function createFramesPreviewView(state)
{
	console.log('FRAMES: createFramesPreviewView():', state);
	if (!FramesPreviewView)
	{
		FramesPreviewView = require('./views/preview-view');
	}

	if (state.editorId || fs.isFileSync(state.filePath))
	{
		return new FramesPreviewView(state);
	}
}

var FramesAtom = {
	activate: function()
	{
		var that = this;

		console.log('FRAMES: atom version', atom.getVersion());
		console.log('FRAMES: FramesAtom::constructor()', arguments);

		this.serviceStart();

		if (parseFloat(atom.getVersion()) < 1.7)
		{
			atom.deserializers.add({
				name: 'FramesPreviewView',
				deserialize: createFramesPreviewView
			});
		}
		atom.commands.add('atom-workspace', {
			'frames-preview:toggle': function()
			{
				console.log('FRAMES: frames-preview:toggle');
				that.toggle();
			},
			'frames-preview:toggle-break-on-single-newline': function() {
				var keyPath;
				keyPath = 'frames-preview.breakOnSingleNewline';
				return atom.config.set(keyPath, !atom.config.get(keyPath));
			}
		});

		var previewFile = this.previewFile.bind(this);
		atom.commands.add('.tree-view .file .name[data-name$=\\.xvc]', 'frames-preview:open', previewFile);

		return atom.workspace.addOpener(function(uriToOpen)
		{
			var host, pathname, protocol;

			try
			{
				var uri = url.parse(uriToOpen);

				protocol = uri.protocol;
				host = uri.host;
				pathname = uri.pathname;
			}
			catch (e)
			{
				return;
			}

			if (protocol !== 'frames-preview:')
			{
				return;
			}

			try
			{
				if (pathname)
				{
					pathname = decodeURI(pathname);
				}
			}
			catch (e)
			{
				console.warn('FRAMES:', e);
				return;
			}

			if (host === 'editor')
			{
				return createFramesPreviewView({
					editorId: pathname.substring(1)
				});
			}
			else
			{
				return createFramesPreviewView({
					filePath: pathname
				});
			}
		});
	},

	deactivate: function()
	{
		this.serviceStop();
	},

	serviceStart: function()
	{
		// this.service = require('./frames/service');
		// this.service.start();
	},

	serviceStop: function()
	{
		require('./frames/service').stop();
	},

	toggle: function()
	{
		console.log('FRAMES: toggle()');

		if (isFramesPreviewView(atom.workspace.getActivePaneItem()))
		{
			atom.workspace.destroyActivePaneItem();
		}

		var editor = atom.workspace.getActiveTextEditor();
		if (!editor)
		{
			console.log('FRAMES: no editor found!');
			return;
		}

		// validate of current editor has valid grammars
		var grammars = atom.config.get('frames-atom.grammars') || [];
		if (grammars.indexOf(editor.getGrammar().scopeName) < 0)
		{
			atom.notifications.addWarning('Not a valid file! Preview only works on Frames language files (*.xvc, *.xve)');
			return;
		}

		if (!this.removePreviewForEditor(editor))
		{
			return this.addPreviewForEditor(editor);
		}
	},

	uriForEditor: function(editor)
	{
		return 'frames-preview://editor/' + editor.id;
	},

	removePreviewForEditor: function(editor)
	{
		var uri = this.uriForEditor(editor);
		var previewPane = atom.workspace.paneForURI(uri);
		if (previewPane)
		{
			console.log('FRAMES: removing preview editor!');
			previewPane.destroyItem(previewPane.itemForURI(uri));
			return true;
		}
		else
		{
			return false;
		}
	},

	addPreviewForEditor: function(editor)
	{
		var uri = this.uriForEditor(editor);
		var previousActivePane = atom.workspace.getActivePane();
		var options = {
			searchAllPanes: true
		};

		if (atom.config.get('frames-atom.openPreviewInSplitPane'))
		{
			options.split = 'right';
		}

		console.log('FRAMES: opening preview editor:', options);

		atom.workspace.open(uri, options).then(function(framesPreviewView)
		{
			if (isFramesPreviewView(framesPreviewView))
			{
				console.log('FRAMES: activate source code editor!');
				previousActivePane.activate();
			}
		});
	},

	previewFile: function(arg)
	{
		var target = arg.target;
		var filePath = target.dataset.path;

		if (!filePath)
		{
			return;
		}

		var editors = atom.workspace.getTextEditors();
		for (var i = 0, len = editors.length; i < len; i++)
		{
			var editor = editors[i];
			if (editor.getPath() !== filePath)
			{
				continue;
			}

			this.addPreviewForEditor(editor);
			return;
		}

		atom.workspace.open('frames-preview://' + encodeURI(filePath), {
			searchAllPanes: true
		});
	}
};

module.exports = FramesAtom;
