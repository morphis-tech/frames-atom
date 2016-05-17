module.exports = {
	types: {},
	roots: {},
	attributeGroups: {},
	parseFromString: function(xmlString, complete) {
		var xml2js;
		xml2js = require('xml2js');
		return xml2js.parseString(xmlString, {
			tagNameProcessors: [xml2js.processors.stripPrefix],
			preserveChildrenOrder: true,
			explicitChildren: true
		}, (function(_this) {
			return function(err, result) {
				if (err)
				{
					return console.error(err);
				} else
				{
					return _this.parse(result, complete);
				}
			};
		})(this));
	},
	parse: function(xml, complete) {
		var i, j, k, len, len1, len2, name, node, ref, ref1, ref2, ref3, ref4, value, xsdStandard;
		xml = xml.schema;
		if (!xml)
		{
			return;
		}
		xsdStandard = xml.$['xmlns:xs'];
		if (!xsdStandard || xsdStandard !== 'http://www.w3.org/2001/XMLSchema')
		{
			console.log('The schema doesn\'t follow the standard.');
			return;
		}
		ref = xml.$$;
		for (i = 0, len = ref.length; i < len; i++)
		{
			node = ref[i];
			this.parseType(node);
		}
		ref1 = xml.element;
		for (j = 0, len1 = ref1.length; j < len1; j++)
		{
			node = ref1[j];
			this.parseRoot(node);
		}
		ref2 = this.roots;
		for (name in ref2)
		{
			value = ref2[name];
			this.types[name] = value;
		}
		ref4 = (ref3 = xml.attributeGroup) != null ? ref3 : [];
		for (k = 0, len2 = ref4.length; k < len2; k++)
		{
			node = ref4[k];
			this.parseAttributeGroup(node);
		}
		return this.postParsing();
	},
	parseType: function(node, typeName) {
		var nodeName, type;
		type = this.initTypeObject(node, typeName);
		if (!type.xsdTypeName)
		{
			return null;
		}
		nodeName = node['#name'];
		if (nodeName === 'simpleType')
		{
			return this.parseSimpleType(node, type);
		} else if (nodeName === 'complexType')
		{
			return this.parseComplexType(node, type);
		} else if (nodeName === 'group')
		{
			return this.parseGroupType(node, type);
		}
	},
	normalizeString: function(str) {
		return str != null ? typeof str.replace === 'function' ? str.replace(/[\n\r]/, '').trim() : void 0 : void 0;
	},
	getDocumentation: function(node) {
		var ref, ref1, ref2;
		return this.normalizeString((ref = node != null ? (ref1 = node.annotation) != null ? ref1[0].documentation[0]._ : void 0 : void 0) != null ? ref : node != null ? (ref2 = node.annotation) != null ? ref2[0].documentation[0] : void 0 : void 0);
	},
	initTypeObject: function(node, typeName) {
		var ref, type;
		return type = {
			xsdType: '',
			xsdTypeName: typeName != null ? typeName : (ref = node.$) != null ? ref.name : void 0,
			xsdAttributes: [],
			xsdChildrenMode: '',
			xsdChildren: [],
			text: '',
			displayText: '',
			description: this.getDocumentation(node),
			type: 'tag',
			rightLabel: 'Tag'
		};
	},
	parseSimpleType: function(node, type) {
		var childrenNode, group, i, len, ref, ref1, val;
		type.xsdType = 'simple';
		if ((ref = node.restriction) != null ? ref[0].enumeration : void 0)
		{
			type.xsdChildrenMode = 'restriction';
			childrenNode = node.restriction[0];
			type.leftLabel = childrenNode.$.base;
		} else if (node.union)
		{
			type.xsdChildrenMode = 'union';
			type.leftLabel = node.union[0].$.memberTypes;
		}
		if (childrenNode)
		{
			group = {
				childType: 'choice',
				description: '',
				minOccurs: 0,
				maxOccurs: 'unbounded',
				elements: []
			};
			type.xsdChildren.push(group);
			ref1 = childrenNode.enumeration;
			for (i = 0, len = ref1.length; i < len; i++)
			{
				val = ref1[i];
				group.elements.push({
					tagName: val.$.value,
					xsdTypeName: null,
					description: '',
					minOccurs: 0,
					maxOccurs: 1
				});
			}
		}
		this.types[type.xsdTypeName] = type;
		return type;
	},
	parseComplexType: function(node, type) {
		var childrenNode, n, ref;
		type.xsdType = 'complex';
		childrenNode = null;
		if (node.sequence)
		{
			type.xsdChildrenMode = 'sequence';
			childrenNode = node.sequence[0];
		} else if (node.choice)
		{
			type.xsdChildrenMode = 'choice';
			childrenNode = node.choice[0];
		} else if (node.all)
		{
			type.xsdChildrenMode = 'all';
			childrenNode = node.all[0];
		} else if ((ref = node.complexContent) != null ? ref[0].extension : void 0)
		{
			type.xsdChildrenMode = 'extension';
			type.xsdChildren = node.complexContent[0].extension[0];
		} else if (node.group)
		{
			type.xsdChildrenMode = 'group';
			type.xsdChildren = node.group[0];
		}
		if (childrenNode)
		{
			type.xsdChildren = (this.parseChildrenGroups(childrenNode.element, 'element'))
				.concat(this.parseChildrenGroups(childrenNode.choice, 'choice'))
				.concat(this.parseChildrenGroups(childrenNode.sequence, 'sequence'))
				.concat(this.parseChildrenGroups(childrenNode.group, 'group'));
		}
		if (node.attribute)
		{
			type.xsdAttributes = ((function() {
				var i, len, ref1, results;
				ref1 = node.$$;
				results = [];
				for (i = 0, len = ref1.length; i < len; i++)
				{
					n = ref1[i];
					results.push(this.parseAttribute(n));
				}
				return results;
			}).call(this)).filter(Boolean);
		}
		this.types[type.xsdTypeName] = type;
		return type;
	},
	parseChildrenGroups: function(groupNodes, mode) {
		var childNode, groups, i, len, node, ref, ref1, ref2, ref3, ref4;
		if (!groupNodes)
		{
			return [];
		}
		groups = [];
		for (i = 0, len = groupNodes.length; i < len; i++)
		{
			node = groupNodes[i];
			groups.push({
				childType: mode,
				ref: (ref = node.$) != null ? ref.ref : void 0,
				description: this.getDocumentation(node),
				minOccurs: (ref1 = (ref2 = node.$) != null ? ref2.minOccurs : void 0) != null ? ref1 : 0,
				maxOccurs: (ref3 = (ref4 = node.$) != null ? ref4.maxOccurs : void 0) != null ? ref3 : 'unbounded',
				elements: mode === 'element' ? [].concat(this.parseElement(node)) : (function() {
					var j, len1, ref5, ref6, results;
					ref6 = (ref5 = node.element) != null ? ref5 : [];
					results = [];
					for (j = 0, len1 = ref6.length; j < len1; j++)
					{
						childNode = ref6[j];
						results.push(this.parseElement(childNode));
					}
					return results;
				}).call(this)
			});
		}
		return groups;
	},
	parseAnonElements: function(node) {
		var childNode, i, len, randomName, ref;
		randomName = require('uuid')();
		ref = node.$$;
		for (i = 0, len = ref.length; i < len; i++)
		{
			childNode = ref[i];
			this.parseType(childNode, randomName);
		}
		return randomName;
	},
	parseElement: function(node) {
		var child, ref, ref1, ref2, ref3;
		child = {
			tagName: (ref = node.$.name) != null ? ref : node.$.ref,
			xsdTypeName: (ref1 = node.$.type) != null ? ref1 : node.$.ref,
			minOccurs: (ref2 = node.$.minOccurs) != null ? ref2 : 0,
			maxOccurs: (ref3 = node.$.maxOccurs) != null ? ref3 : 'unbounded',
			description: this.getDocumentation(node)
		};
		if (!child.xsdTypeName && node.$$)
		{
			child.xsdTypeName = this.parseAnonElements(node);
		}
		return child;
	},
	parseAttribute: function(node) {
		var attr, nodeName;
		nodeName = node['#name'];
		if (nodeName === 'attribute' && node.$.use !== 'prohibited')
		{
			attr = {
				name: node.$.name,
				type: node.$.type,
				description: this.getDocumentation(node),
				fixed: node.$.fixed,
				use: node.$.use,
				default: node.$['default']
			};
			if (!node.$.type && node.$$)
			{
				attr.type = this.parseAnonElements(node);
			}
			return attr;
		} else if (nodeName === 'attributeGroup')
		{
			return {
				ref: node.$.ref
			};
		} else
		{
			return null;
		}
	},
	parseAttributeGroup: function(node) {
		var attributes, name, xattr;
		name = node.$.name;
		attributes = ((function() {
			var i, len, ref, results;
			ref = node.$$;
			results = [];
			for (i = 0, len = ref.length; i < len; i++)
			{
				xattr = ref[i];
				results.push(this.parseAttribute(xattr));
			}
			return results;
		}).call(this)).filter(Boolean);
		return this.attributeGroups[name] = attributes;
	},
	parseGroupType: function(node, type) {
		return this.parseComplexType(node, type);
	},
	parseRoot: function(node) {
		var ref, root, rootElement, rootTagName, rootType;
		rootElement = this.parseElement(node);
		rootTagName = rootElement.tagName;
		rootType = this.types[rootElement.xsdTypeName];
		root = this.initTypeObject(null, rootElement.xsdTypeName);
		root.description = (ref = rootElement.description) != null ? ref : rootType.description;
		root.text = rootTagName;
		root.displayText = rootTagName;
		root.type = 'class';
		root.rightLabel = 'Root';
		root.xsdType = 'complex';
		root.xsdAttributes = rootType.xsdAttributes;
		root.xsdChildrenMode = rootType.xsdChildrenMode;
		root.xsdChildren = rootType.xsdChildren;
		this.roots[rootTagName] = root;
		return root;
	},
	postParsing: function() {
		var attr, attributes, extenAttr, extenType, group, groupType, groups, i, j, k, len, len1, len2;
		var linkType, memberType, n, name, ref, ref1, ref2, results, t, type, unionTypes;
		ref = this.types;
		results = [];
		for (name in ref)
		{
			type = ref[name];
			if (type.xsdChildrenMode === 'extension')
			{
				extenType = type.xsdChildren;
				extenAttr = ((function() {
					var i, len, ref1, results1;
					ref1 = extenType.$$ || [];
					results1 = [];
					for (i = 0, len = ref1.length; i < len; i++)
					{
						n = ref1[i];
						results1.push(this.parseAttribute(n));
					}
					return results1;
				}).call(this)).filter(Boolean);
				if (extenType.$)
				{
					linkType = this.types[extenType.$.base];
					type.xsdTypeName = linkType.xsdTypeName;
					type.xsdChildrenMode = linkType.xsdChildrenMode;
					type.xsdChildren = linkType.xsdChildren;
					type.xsdAttributes = extenAttr.concat(linkType.xsdAttributes);
					if (type.description == null)
					{
						type.description = linkType.description;
					}
					type.type = linkType.type;
					type.rightLabel = linkType.rightLabel;
				}
			} else if (type.xsdChildrenMode === 'group')
			{
				groupType = type.xsdChildren;
				linkType = this.types[groupType.$.ref];
				type.xsdChildren = linkType.xsdChildren;
				type.xsdChildrenMode = linkType.xsdChildrenMode;
			} else if (type.xsdChildrenMode === 'union')
			{
				unionTypes = type.leftLabel.split(' ');
				type.xsdChildrenMode = 'restriction';
				for (i = 0, len = unionTypes.length; i < len; i++)
				{
					t = unionTypes[i];
					memberType = this.types[t];
					if (memberType)
					{
						type.xsdChildren.push(memberType.xsdChildren[0]);
					}
				}
			}
			ref1 = type.xsdChildren;
			for (j = 0, len1 = ref1.length; j < len1; j++)
			{
				group = ref1[j];
				if (group.childType === 'group')
				{
					linkType = this.types[group.ref];
					type.xsdChildren = linkType.xsdChildren;
					break;
				}
			}
			groups = (function() {
				var k, len2, ref2, results1;
				ref2 = type.xsdAttributes;
				results1 = [];
				for (k = 0, len2 = ref2.length; k < len2; k++)
				{
					attr = ref2[k];
					if (attr && attr.ref)
					{
						results1.push(attr.ref);
					}
				}
				return results1;
			})();
			attributes = [];
			ref2 = type.xsdAttributes;
			for (k = 0, len2 = ref2.length; k < len2; k++)
			{
				attr = ref2[k];
				if (attr.ref)
				{
					attributes = attributes.concat(this.attributeGroups[attr.ref]);
				} else
				{
					attributes.push(attr);
				}
			}
			results.push(type.xsdAttributes = attributes);
		}
		return results;
	}
};
