var xsdParser;

xsdParser = require('./xsd-parser');

module.exports = {
	types: {},
	clear: function() {
		return this.types = {};
	},
	load: function(xmlPath, xsdUri, complete) {
		var basePath, fs, path, protocol;
		protocol = null;
		if (xsdUri.substr(0, 7) === 'http://')
		{
			protocol = require('http');
		} else if (xsdUri.substr(0, 8) === 'https://')
		{
			protocol = require('https');
		}
		if (protocol) 
		{
			return protocol.get(xsdUri, (function(_this) {
				return function(res) {
					var body;
					body = '';
					res.on('data', function(chunk) {
						return body += chunk;
					});
					return res.on('end', function() {
						return _this.parseFromString(body, complete);
					});
				};
			})(this)).on('error', function(e) {
				return console.error(e);
			});
		}
		else
		{
			path = require('path');
			if (xsdUri[0] === '/' || xsdUri.substr(1, 2) === ':\\')
      {
				basePath = '';
			}
      else
      {
				basePath = path.dirname(xmlPath);
			}

			fs = require('fs');
			return fs.readFile(path.join(basePath, xsdUri), (function(_this) {
				return function(err, data) {
					if (err) {
						return console.error(err);
					} else {
						return _this.parseFromString(data, complete);
					}
				};
			})(this));
		}
	},
	parseFromString: function(data, complete) {
		this.types = xsdParser.types;
		xsdParser.parseFromString(data);
		return complete();
	},
	getChildren: function(xpath) {
		var el, group, i, j, len, len1, name, ref, ref1, suggestions, type, value;
		if (xpath.length === 0)
    {
			return (function() {
				var ref, results;
				ref = xsdParser.roots;
				results = [];
				for (name in ref)
        {
					value = ref[name];
					results.push(value);
				}
				return results;
			})();
		}
		type = this.findTypeFromXPath(xpath);
		if (!type || type.xsdType !== 'complex')
    {
			return [];
		}
		suggestions = [];
		ref = type.xsdChildren;
		for (i = 0, len = ref.length; i < len; i++)
    {
			group = ref[i];
			ref1 = group.elements;
			for (j = 0, len1 = ref1.length; j < len1; j++)
      {
				el = ref1[j];
				suggestions.push(this.createChildSuggestion(el));
			}
		}
		return suggestions.filter(function(n) {
			return n !== void 0;
		});
	},
	findTypeFromXPath: function(xpath) {
		var nextTag, nextTypeName, type;
		type = xsdParser.roots[xpath[0]];
		xpath.shift();
		while (xpath && xpath.length > 0 && type)
    {
			nextTag = xpath.shift();
			nextTypeName = this.findTypeFromTag(nextTag, type);
			type = this.types[nextTypeName];
		}
		return type;
	},
	findTypeFromTag: function(tagName, node) {
		var el, group, i, j, len, len1, ref, ref1;
		ref = node.xsdChildren;
		for (i = 0, len = ref.length; i < len; i++)
    {
			group = ref[i];
			ref1 = group.elements;
			for (j = 0, len1 = ref1.length; j < len1; j++)
      {
				el = ref1[j];
				if (el.tagName === tagName)
        {
					return el.xsdTypeName;
				}
			}
		}
	},
	createChildSuggestion: function(child) {
		var attr, childType, closingConfig, i, len, ref, ref1, ref2, ref3, ref4, snippet, snippetId, sug;
		childType = this.types[child.xsdTypeName];
		snippet = child.tagName;
		snippetId = 1;
		ref = (childType != null ? childType.xsdAttributes : void 0) || [];
		for (i = 0, len = ref.length; i < len; i++)
    {
			attr = ref[i];
			if (!(attr.use === 'required'))
      {
				continue;
			}
			snippet += " " + attr.name + "=\"";
			snippet += "${" + (snippetId++) + ":" + ((ref1 = (ref2 = attr.fixed) != null ? ref2 : attr["default"]) != null ? ref1 : '') + "}\"";
		}
		snippet += ">";
		closingConfig = atom.config.get('autocomplete-xml.addClosingTag');
		if (closingConfig) {
			snippet += ("${" + (snippetId++) + ":}</") + child.tagName + '>';
		}
		return sug = {
			snippet: snippet,
			displayText: child.tagName,
			description: (ref3 = child.description) != null ? ref3 : childType != null ? childType.description : void 0,
			type: 'tag',
			rightLabel: 'Tag',
			leftLabel: (ref4 = childType != null ? childType.leftLabel : void 0) != null ? ref4 : (!childType ? child.xsdTypeName : void 0)
		};
	},
	getValues: function(xpath) {
		var el, group, i, j, len, len1, ref, ref1, suggestions, type;
		type = this.findTypeFromXPath(xpath);
		if (!type || type.xsdType !== 'simple') {
			return [];
		}
		suggestions = [];
		ref = type.xsdChildren;
		for (i = 0, len = ref.length; i < len; i++) {
			group = ref[i];
			ref1 = group.elements;
			for (j = 0, len1 = ref1.length; j < len1; j++) {
				el = ref1[j];
				suggestions.push(this.createValueSuggestion(el));
			}
		}
		return suggestions.filter(function(n) {
			return n !== void 0;
		});
	},
	getAttributeValues: function(xpath, attrName) {
		var attr, attrType, attribute, el, group, i, j, len, len1, ref, ref1, ref2, suggestions, type;
		type = this.findTypeFromXPath(xpath);
		if (!type) {
			return [];
		}
		attribute = (function() {
			var i, len, ref, results;
			ref = type.xsdAttributes;
			results = [];
			for (i = 0, len = ref.length; i < len; i++) {
				attr = ref[i];
				if (attr.name === attrName) {
					results.push(attr);
				}
			}
			return results;
		})();
		attrType = this.types[(ref = attribute[0]) != null ? ref.type : void 0];
		if (!attrType) {
			return [];
		}
		suggestions = [];
		ref1 = attrType.xsdChildren;
		for (i = 0, len = ref1.length; i < len; i++) {
			group = ref1[i];
			ref2 = group.elements;
			for (j = 0, len1 = ref2.length; j < len1; j++) {
				el = ref2[j];
				suggestions.push(this.createValueSuggestion(el));
			}
		}
		return suggestions.filter(function(n) {
			return n !== void 0;
		});
	},
	createValueSuggestion: function(child) {
		return {
			text: child.tagName,
			displayText: child.tagName,
			type: 'value',
			rightLabel: 'Value'
		};
	},
	getAttributes: function(xpath) {
		var attr, type;
		type = this.findTypeFromXPath(xpath);
		if (!type) {
			return [];
		}
		return (function() {
			var i, len, ref, results;
			ref = type.xsdAttributes;
			results = [];
			for (i = 0, len = ref.length; i < len; i++) {
				attr = ref[i];
				results.push(this.createAttributeSuggestion(attr));
			}
			return results;
		}).call(this);
	},
	createAttributeSuggestion: function(attr) {
		var ref, ref1;
		return {
			displayText: attr.name,
			snippet: attr.name + '="${1:' + ((ref = (ref1 = attr.fixed) != null ? ref1 : attr["default"]) != null ? ref : '') + '}"',
			description: attr.description,
			type: 'attribute',
			rightLabel: 'Attribute',
			leftLabel: attr.type
		};
	}
};
