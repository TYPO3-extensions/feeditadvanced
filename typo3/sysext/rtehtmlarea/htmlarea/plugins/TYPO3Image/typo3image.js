/***************************************************************
*  Copyright notice
*
*  (c) 2005-2009 Stanislas Rolland <stanislas.rolland(arobas)fructifor.ca>
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
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/
/*
 * TYPO3Image plugin for htmlArea RTE
 *
 * TYPO3 SVN ID: $Id: typo3image.js 5166 2009-03-09 23:46:55Z ohader $
 */
TYPO3Image = HTMLArea.Plugin.extend({

	constructor : function(editor, pluginName) {
		this.base(editor, pluginName);
	},

	/*
	 * This function gets called by the class constructor
	 */
	configurePlugin : function(editor) {

		this.pageTSConfiguration = this.editorConfiguration.buttons.image;
		this.imageModulePath = this.pageTSConfiguration.pathImageModule;

		/*
		 * Registering plugin "About" information
		 */
		var pluginInformation = {
			version		: "1.0",
			developer	: "Stanislas Rolland",
			developerUrl	: "http://www.fructifor.ca/",
			copyrightOwner	: "Stanislas Rolland",
			sponsor		: "Fructifor Inc.",
			sponsorUrl	: "http://www.fructifor.ca/",
			license		: "GPL"
		};
		this.registerPluginInformation(pluginInformation);

		/*
		 * Registering the button
		 */
		var buttonId = "InsertImage";
		var buttonConfiguration = {
			id		: buttonId,
			tooltip		: this.localize(buttonId + "-Tooltip"),
			action		: "onButtonPress",
			hotKey		: (this.pageTSConfiguration ? this.pageTSConfiguration.hotKey : null),
			dialog		: true
		};
		this.registerButton(buttonConfiguration);

		return true;
	 },

	/*
	 * This function gets called when the button was pressed
	 *
	 * @param	object		editor: the editor instance
	 * @param	string		id: the button id or the key
	 * @param	object		target: the target element of the contextmenu event, when invoked from the context menu
	 *
	 * @return	boolean		false if action is completed
	 */
	onButtonPress : function(editor, id, target) {
			// Could be a button or its hotkey
		var buttonId = this.translateHotKey(id);
		buttonId = buttonId ? buttonId : id;

		var additionalParameter;
		if (typeof(target) !== "undefined") {
			this.image = target;
		} else {
			this.image = this.editor.getParentElement();
		}
		if (this.image && !/^img$/i.test(this.image.nodeName)) {
			this.image = null;
		}
		if (this.image) {
			additionalParameter = "&act=image";
		}

		this.dialog = this.openDialog("InsertImage", this.makeUrlFromModulePath(this.imageModulePath, additionalParameter), null, null, {width:550, height:350}, "yes");
		return false;
	},

	/*
	 * Insert the image
	 * This function is called from the typo3-image-popup
	 */
 	insertImage : function(image) {
		this.editor.focusEditor();
		this.editor.insertHTML(image);
		this.dialog.close();
	}
});

