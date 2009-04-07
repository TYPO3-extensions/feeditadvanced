/***************************************************************
*  Copyright notice
*
*  (c) 2008-2009 Stanislas Rolland <typo3(arobas)sjbr.ca>
*  All rights reserved
*
*  This script is part of the TYPO3 project. The TYPO3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*  A copy is found in the textfile GPL.txt and important notices to the license
*  from the author is found in LICENSE.txt distributed with these scripts.
*
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/
/**
 * Default Clean Plugin for TYPO3 htmlArea RTE
 *
 * TYPO3 SVN ID: $Id: default-clean.js 5291 2009-04-06 14:26:35Z stan $
 */
DefaultClean = HTMLArea.Plugin.extend({
	
	constructor : function(editor, pluginName) {
		this.base(editor, pluginName);
	},
	
	/*
	 * This function gets called by the class constructor
	 */
	configurePlugin : function(editor) {
		
		this.pageTSConfiguration = this.editorConfiguration.buttons.cleanword;
		
		/*
		 * Registering plugin "About" information
		 */
		var pluginInformation = {
			version		: "1.2",
			developer	: "Stanislas Rolland",
			developerUrl	: "http://www.sjbr.ca/",
			copyrightOwner	: "Stanislas Rolland",
			sponsor		: "SJBR",
			sponsorUrl	: "http://www.sjbr.ca/",
			license		: "GPL"
		};
		this.registerPluginInformation(pluginInformation);
		
		/*
		 * Registering the (hidden) button
		 */
		var buttonId = "CleanWord";
		var buttonConfiguration = {
			id		: buttonId,
			tooltip		: this.localize(buttonId + "-Tooltip"),
			action		: "onButtonPress",
			hide		: true
		};
		this.registerButton(buttonConfiguration);
	},
	
	/*
	 * This function gets called when the button was pressed.
	 *
	 * @param	object		editor: the editor instance
	 * @param	string		id: the button id or the key
	 *
	 * @return	boolean		false if action is completed
	 */
	onButtonPress : function (editor, id, target) {
			// Could be a button or its hotkey
		var buttonId = this.translateHotKey(id);
		buttonId = buttonId ? buttonId : id;
		
		this.clean();
		return false;
	},
	
	onGenerate : function () {
		var doc = this.editor._doc;
			// Function reference used on paste with older versions of Mozilla/Firefox in which onPaste is not fired
		this.cleanLaterFunctRef = this.makeFunctionReference("clean");
		HTMLArea._addEvents((HTMLArea.is_ie ? doc.body : doc), ["paste","dragdrop","drop"], DefaultClean.wordCleanHandler, true);
	},
	
	clean : function () {
		function clearClass(node) {
			var newc = node.className.replace(/(^|\s)mso.*?(\s|$)/ig,' ');
			if(newc != node.className) {
				node.className = newc;
				if(!/\S/.test(node.className)) {
					if (!HTMLArea.is_opera) {
						node.removeAttribute("class");
						if (HTMLArea.is_ie) {
							node.removeAttribute("className");
						}
					} else {
						node.className = '';
					}
				}
			}
		}
		function clearStyle(node) {
			if (HTMLArea.is_ie) var style = node.style.cssText;
				else var style = node.getAttribute("style");
			if (style) {
				var declarations = style.split(/\s*;\s*/);
				for (var i = declarations.length; --i >= 0;) {
					if(/^mso|^tab-stops/i.test(declarations[i]) || /^margin\s*:\s*0..\s+0..\s+0../i.test(declarations[i])) declarations.splice(i,1);
				}
				node.setAttribute("style", declarations.join("; "));
			}
		}
		function stripTag(el) {
			if(HTMLArea.is_ie) {
				el.outerHTML = HTMLArea.htmlEncode(el.innerText);
			} else {
				var txt = document.createTextNode(HTMLArea.getInnerText(el));
				el.parentNode.insertBefore(txt,el);
				el.parentNode.removeChild(el);
			}
		}
		function checkEmpty(el) {
			if(/^(span|b|strong|i|em|font)$/i.test(el.nodeName) && !el.firstChild) el.parentNode.removeChild(el);
		}
		function parseTree(root) {
			var tag = root.nodeName.toLowerCase(), next;
			switch (root.nodeType) {
				case 1:
					if (/^(meta|style|title|link)$/.test(tag)) {
						root.parentNode.removeChild(root);
						return false;
						break;
					}
				case 3:
				case 9:
				case 11:
					if ((HTMLArea.is_ie && root.scopeName != 'HTML') || (!HTMLArea.is_ie && /:/.test(tag)) || /o:p/.test(tag)) {
						stripTag(root);
						return false;
					} else {
						clearClass(root);
						clearStyle(root);
						for (var i=root.firstChild;i;i=next) {
							next = i.nextSibling;
							if (i.nodeType != 3 && parseTree(i)) { checkEmpty(i); }
						}
					}
					return true;
					break;
				default:
					root.parentNode.removeChild(root);
					return false;
					break;
			}
		}
		parseTree(this.editor._doc.body);
	}
});

/*
 * Closure avoidance for IE
 */
DefaultClean.cleanLater = function (editorNumber) {
	var editor = RTEarea[editorNumber].editor;
	editor.getPluginInstance("Default").clean();
};

/*
 * Handler for paste, dragdrop and drop events
 */
DefaultClean.wordCleanHandler = function (ev) {
	if (!ev) var ev = window.event;
	var target = ev.target ? ev.target : ev.srcElement;
	var owner = target.ownerDocument ? target.ownerDocument : target;
	if (HTMLArea.is_ie) { // IE5.5 does not report any ownerDocument
		while (owner.parentElement) { owner = owner.parentElement; }
	}
	var editor = RTEarea[owner._editorNo].editor;

		// If we dropped an image dragged from the TYPO3 Image plugin, let's close the dialog window
	if (typeof(HTMLArea.Dialog) != "undefined" && HTMLArea.Dialog.TYPO3Image) {
		HTMLArea.Dialog.TYPO3Image.close();
	} else {
		window.setTimeout("DefaultClean.cleanLater(\'" + editor._editorNumber + "\');", 250);
	}
};

