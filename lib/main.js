var url = require('url');
var fs = require('fs-plus');
var AtomUtils = require('./frames/utils/atom');

var FramesPreviewView;

function isFramesPreviewView(object)
{
	if (!FramesPreviewView)
	{
		FramesPreviewView = require('./views/preview-view');
	}

	return object instanceof FramesPreviewView;
}

function createFramesPreviewView(opts)
{
	console.log('FRAMES: createFramesPreviewView()');
	if (!FramesPreviewView)
	{
		FramesPreviewView = require('./views/preview-view');
	}

	return new FramesPreviewView();
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
		atom.commands.add('.tree-view .file .name[data-name$=\\.xvc],[data-name$=\\.xve]', 'frames-preview:open', previewFile);

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

			if (protocol !== 'frames:')
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
				// TODO check if path is to open designer or preview
				return createFramesPreviewView();
			}
		});
	},

	deactivate: function()
	{
		this.serviceStop();
	},

	getProvider: function() {
		return require('./autocomplete/provider');
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
		if (!AtomUtils.editorHasValidGrammar(editor))
		{
			atom.notifications.addWarning('Not a valid file! Preview only works on Frames language files (*.xvc, *.xve)');
			return;
		}

		if (!this.removePreview(editor))
		{
			return this.openPreview(editor);
		}
	},

	uriForPreview: function(editor)
	{
		return 'frames://editor/preview/';
	},

	uriForDesigner: function(editor)
	{
		return 'frames://editor/designer/';
	},

	removePreview: function(editor)
	{
		var uri = this.uriForPreview(editor);
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

	openPreview: function(editor)
	{
		var uri = this.uriForPreview(editor);
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
				framesPreviewView.resolveEditor(editor.id);
			}
		});
	},

	previewFile: function(arg)
	{
		var that = this;
		var target = arg.target;
		var filePath = target.dataset.path;

		if (!filePath || !fs.isFileSync(filePath))
		{
			return;
		}

		var activeEditor = atom.workspace.getActiveTextEditor();
		if (activeEditor && activeEditor.getPath() === filePath)
		{
			// Editor already has focus
			this.openPreview(activeEditor);
		} else
		{
			// Editor isn't open or doesn't have focus
			atom.workspace.open(filePath, {
				searchAllPanes: true
			}).then(function(editor)
			{
				// After focus the editor (xvc/xve) open its preview
				that.openPreview(editor);
			});
		}
	}
};

module.exports = FramesAtom;
