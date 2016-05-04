var AtomUtils = {
	editorHasValidGrammar: function(editor)
	{
		if (editor)
		{
			return this.isValidGrammar(this.getGrammar(editor));
		}
		return false;
	},

	getGrammar: function(editor)
	{
		return editor ? editor.getGrammar().scopeName : undefined;
	},

	isValidGrammar: function(grammar)
	{
		var grammars = atom.config.get('frames-atom.grammars') || [];
		return grammars.indexOf(grammar) >= 0;
	}
};

module.exports = AtomUtils;
