/*
	feEdit.js -- frontend editing javascript support
		- Toolbar
			- ToolbarWidget
		- FrontendNotificationMessage
		- AJAXJavascriptHandler
		- EditPanel
		- DropZone
		- EditPanelAction
		- ClipboardObj
		- Lightbox
 */

Ext.namespace('TYPO3.FeEdit');

// TODO: go through every part (also CSS and PHP) and use this base class for every class and ID
TYPO3.FeEdit.baseCls = 'feeditadvanced';

TYPO3.FeEdit.Base = function() {};

/*
 * Class for Toolbars and Draggable Widgets within the toolbars.
 */
TYPO3.FeEdit.Toolbar = function(toolbarElementId) {
	this.el = Ext.get(toolbarElementId);
	this.widgets = [];

	// initialize the toolbar element and finds all draggable buttons
	if (this.el) {
		// This does not work in Ext JS, thus it's a bug in the contrib library
		// @todo: send this issue to Ext JS
		// Problem: selecting items with multiple classes while having a different root node
		// than the original document results in nothing
		// var allWidgets = Ext.DomQuery.select('.draggable', this.el);
		var allWidgets = Ext.select('#' + this.el.id + ' .draggable');
		// Create all the draggable buttons in the toolbar
		allWidgets.each(function(draggableElement) {
			this.widgets.push(new TYPO3.FeEdit.ToolbarWidget(draggableElement));
		}, this);
	}

	/**
	 * adds a draggable object and registers the toolbar widget
	 **/
	this.addDraggable = function(toolbarElement) {
		// get draggable item
		// var draggableElements = Ext.DomQuery.select('.draggable', toolbarElement);
		var draggableElements = Ext.select('#' + toolbarElement.id + ' .draggable');
		draggableElements.each(function(draggableElement) {
			this.widgets.push(new TYPO3.FeEdit.ToolbarWidget(draggableElement));
		}, this);
	}
};



/** 
 * Class for the toolbar item that is on top of the page
 * needs 
 */
TYPO3.FeEdit.ToolbarWidget = function(draggableEl) {
	this.el = Ext.get(draggableEl);

		// Override clicks on any elements that are also draggable. 
		// This may eventually trigger an add in the main content area instead.
	this.el.on('click', function(evt) {
		evt.stopEvent();
	});

	this.dd = new Ext.dd.DragSource(Ext.id(this.el), {
//		dropAllowed: 'feEditAdvanced-dropzone',
		ddGroup: 'feeditadvanced-toolbar'
	});

	this.dd.startDrag = function(x, y) {
		var dragEl = Ext.get(this.getDragEl());
		var el = Ext.get(this.getEl());

		dragEl.applyStyles({'z-index':2000});
		dragEl.update(el.dom.innerHTML);
		dragEl.addClass(el.dom.className + ' feeditadvanced-dd-proxy');

			// Enable drop indicators when a drag is started.
		FrontendEditing.editPanelsEnabled = false;
		FrontendEditing.editPanels.each(function(panel) {
			panel.addDropZone();
		});
	};

	// is called over and over again, until you leave or drop the 
		// id is the ID of the drop zone
/*	this.dd.onDragOver = function(evt, id) {
		console.log('Toolbarwidget is currently over ' + id);
	};*/

	this.dd.afterInvalidDrop = this.dd.afterDragDrop = function(evt, id) {
			// Disable drop indicators when a drag is done
		FrontendEditing.editPanelsEnabled = true;
		FrontendEditing.editPanels.each(function(panel) {
			panel.enableHoverMenu();
			panel.removeDropZone();
		});
	};
	Ext.dd.Registry.register(this.dd);
};


	// Object for Javascript handling as part of an AJAX request.
TYPO3.FeEdit.AJAXJavascriptHandler = Ext.extend(TYPO3.FeEdit.Base, {
	regexpScriptTags: '<script[^>]*>([\\S\\s]*?)<\/script>',
	
	constructor: function() {
		this.loadedElements = new Ext.util.MixedCollection();
		this.unloadedElements = [];

		this.registerLoadedElements();
	},

	registerLoadedElements: function() {
		Ext.select('head script[type="text/javascript"]').each(function(script) {
			script = Ext.get(script);
			if (src = script.getAttribute('src')) {
				this.loadedElements.add(src, 1);
			}
		}, this);
		
		Ext.select('head link[type="text/css"]').each(function(css) {
			css = Ext.get(css);
			if (src = css.getAttribute('href')) {
				this.loadedElements.add(src, 1);
			}
		}, this);
	},

	evaluate: function(textContent) {
		var matchScript = new RegExp(this.regexpScriptTags, 'img');
		(textContent.match(matchScript) || []).map(function(scriptTag) {
			this.addJavascript(scriptTag);
		}.bind(this));
		
		
		linkFragment = "<link[^<>]*href=\"([\\S\\s]*?)\\S*>";
		var matchLink = new RegExp(linkFragment, 'img');
		(textContent.match(matchLink) || []).map(function(linkTag) {
			this.addCSS(linkTag);
		}.bind(this));
		
		this.processQueue();
	},

	addInlineJavascript: function(scriptContent) {
		var scriptElement = this.createScriptElement();
		scriptElement.textContent = scriptContent;

		if ("text" in scriptElement) {
			scriptElement.text = scriptContent;
		} else if ("textContent" in scriptElement) {
			scriptElement.textContent = scriptContent;
		} else if ("innerHTML" in scriptElement) {
			scriptElement.innerHTML = scriptContent;
		} else {
			scriptElement.appendChild(document.createTextNode(scriptContent));
		}
			// Add the element to the queue for processing later on
		this.addElementToQueue(scriptElement);
	},

	addExternalJavascript: function(src) {
		if (!this.loadedElements.get(src)) {
			var scriptElement = this.createScriptElement();
			scriptElement.set({'src': src});

				// Add the element to the queue for processing later on
			this.addElementToQueue(scriptElement);
			this.loadedElements.add(src, 1);
		}
	},
	
	addInlineCSS: function(cssContent) {
		var styleElement = this.createStyleElement();
		styleElement.set({'type': 'text/css'});

		if (styleElement.styleSheet) {   // IE
			styleElement.styleSheet.cssText = cssContent;
		} else {                // the world
			var tt1 = document.createTextNode(def);
			styleElement.appendChild(cssContent);
		}
		
		this.addElementToQueue(styleElement);
	},
	
	addExternalCSS: function(src) {
		var linkElement = this.createLinkElement();
		linkElement.set({'href': src});
		this.addElementToQueue(linkElement);
	},

	addJavascript: function(scriptTag) {
		var matchOne = new RegExp(this.regexpScriptTags, 'im');
		var srcFragment = 'src=(?:\"|\')([\\S\\s]*?)(?:\"|\')(?:\\S\\s)*?\>';
		var srcRegExp = new RegExp(srcFragment , 'im');
		if (result = srcRegExp.exec(scriptTag)) {
			var srcAttribute = result[1];
			this.addExternalJavascript(srcAttribute);
		} else {
			inlineJS = (scriptTag.match(matchOne) || ['', ''])[1];
			this.addInlineJavascript(inlineJS);
		}
	},
	
	addCSS: function(linkTag) {
		var hrefFragment = 'href=(?:\"|\')([\\S\\s]*?)(?:\"|\')(?:\\S\\s)*?\>';
		var hrefFragment = 'href=(?:\"|\')([\\S\\s]*?)(?:\"|\')';
		var hrefRegExp = new RegExp(hrefFragment , 'im');
		if (result = hrefRegExp.exec(linkTag)) {
			var hrefAttribute = result[1];
			this.addExternalCSS(hrefAttribute);
		}
	},

	createScriptElement: function() {
		var scriptID = new Date().getTime() + "_onDemandLoadedScript";
		var scriptElement = Ext.DomHelper.createDom({
			'tag': 'script',
			'id': styleId,
			'type': 'text/javascript'
		});

		this.addCallBacksToElementWhenLoaded(scriptElement);
		return scriptElement;
	},
	
	createStyleElement: function() {
		var styleID = new Date().getTime() + '_onDemandLoadedStyle';
		var styleElement = Ext.DomHelper.createDom({
			'tag': 'style',
			'id': styleId,
			'type': 'text/css'
		});
		this.addCallBacksToElementWhenLoaded(styleElement);
		return styleElement;
	},
	
	createLinkElement: function() {
		var styleID = new Date().getTime() + '_onDemandLoadedStyle';
		var linkElement = Ext.DomHelper.createDom({
			'tag': 'link',
			'id': styleId,
			'rel': 'stylesheet',
			'type': 'text/css'
		});
		this.addCallBacksToElementWhenLoaded(linkElement);
		return linkElement;
	},
	
	// class that is used internally to apply certain "onstatechange" and "onload" events when the element is loaded
	// so that the process queue is run
	addCallBacksToElementWhenLoaded: function(element) {
		element.on('readystatechange', function() {
			if ((element.readyState == 'complete') || (element.readyState == 'loaded')) {
				this.processQueue();
			}
		}, this);

		element.on('load', function() {
			this.processQueue();
		}, this);
		return element;
	},
	
	addElementToHead: function(element) {
		Ext.DomQuery.select('head').first().appendChild(element);
	},

	addElementToQueue: function(element) {
		this.unloadedElements.push(element);
	},

	processQueue: function() {
		if (this.unloadedElements.length) {
				// Grab the first element in the queue and add it to the DOM.
			firstElement = this.unloadedElements.shift();
			if (typeof firstElement == 'object') {
				this.addElementToHead(firstElement);

					// @todo	In Webkit, first element is null sometimes.  Not sure why but it throws an error here.
					// @todo: check if this still exists
				try {
					src = firstElement.readAttribute('src');
				} catch (e) {}

					// If there's no source attribute, immediately process the next item.
					// Otherwise, wait for it to fire an onload event.
				if (!src) {
					this.processQueue();
				} else {
					this.loadedElements.add(src, 1);
				}
			}
		}
	}
});

	// Object for an entire content element and its EditPanel.
TYPO3.FeEdit.EditPanel = Ext.extend(TYPO3.FeEdit.Base, {
		// the DOM element (actually it's a Ext.get) of the wrapper Element of the content element
	el: null,
		// the DOM element of the editPanel or the hover menu of this content element
	menuEl: null,
		// the DOM element of the form object of the editPanel of this content element
	formEl: null,
	params: null,

	pid: null,
	record: null,
	
	sortable: false,
	hoverMenuEnabled: false,
	alwaysVisible: false,

	constructor: function(wrapperElement) {
		this.el = Ext.get(wrapperElement);
		this.menuEl = Ext.get(this.el.select('div.feEditAdvanced-editPanelDiv').first());
		this.formEl = Ext.get(this.el.select('form').first());	// todo: we should use a class here
		this.hoverMenuEnabled = true;
		this.getFormParameters();
		this.setupEventListeners();
		if (this.el.hasClass('draggable')) {
			this.sortable = true;
			this._makeDraggable();
		}
		
		if (this.el.hasClass('alwaysVisible')) {
			this.alwaysVisible = true;
		}

		this.updateUpDownButtons();
	},
	
	addDropZone: function() {
		if (this.sortable) {
			this.dropZone = new TYPO3.FeEdit.DropZone(this);
		}
	},

	removeDropZone: function() {
		if (this.sortable && this.dropZone) {
			this.dropZone.remove();
			this.dropZone = null;
		}
	},

	/*
	 * writes all form parameters needed to identify the element to a
	 * a parameter string
	 */
	getFormParameters: function() {
			// Extract values from hidden form fields
		this.formEl.select('input').each(function(formElement) {
			formElement = Ext.get(formElement);
			// @todo getAttribute call is not working properly in IE.
			switch (formElement.getAttribute('name')) {
				case 'TSFE_EDIT[cmd]':
					// do nothing
					break;
				case 'TSFE_EDIT[record]':
					this.record = formElement.getValue();
					break;
				case 'TSFE_EDIT[pid]':
					this.pid = formElement.getValue();
					break;
			}
		}, this);
			// make the additional formElement values as "&name=value"
		this.params = Ext.Ajax.serializeForm(this.formEl);
	},

	_makeDraggable: function() {
		this.dd = new Ext.dd.DragSource(this.el, {
			// TODO: different group please
			ddGroup: 'feeditadvanced-toolbar',
//			dropAllowed: 'feEditAdvanced-dropzone'
		});
		
		// find the handle and give the handle an ID
		var dragHandle = Ext.get(this.el.select('.feEditAdvanced-dragHandle').first());
		var dragHandleId = Ext.id(dragHandle, 'feEditAdvanced-dragHandle-');
		dragHandle.set({'id': dragHandleId});
		this.dd.setOuterHandleElId(dragHandleId);
		//this.dd.setDragElId(this.el.id);

		this.dd.startDrag = function(x, y) {
			var dragEl = Ext.get(this.getDragEl());
			var el = Ext.get(this.getEl());

			FrontendEditing.editPanelsEnabled = false;
			FrontendEditing.editPanels.each(function(panel) {
				panel.hideMenu();
				panel.disableHoverMenu();

					// Don't add a drop zone under the element being dragged.
				if (el.id != panel.el.id) {
					panel.addDropZone();
				}
			});
		};

			// id is the ID of the drop zone
		this.dd.onDragOver = function(evt, id) {
			/*
							Position.prepare();
				var point = [Event.pointerX(event), Event.pointerY(event)];
			
				Droppables.drops.each( function(drop) {
					if(!Droppables.isAffected(point, draggableElement, drop)) {
						drop.element.setStyle({height: 'auto'});
					}
				});
			*/
		};

			// id is the ID of the drop zone
		this.dd.afterDragDrop = this.dd.afterInvalidDrop = function(evt, id) {
				// Disable drop indicators when a drag is done
			FrontendEditing.editPanelsEnabled = true;
			FrontendEditing.editPanels.each(function(panel) {
				panel.enableHoverMenu();
				panel.removeDropZone();
			});
		};
		Ext.dd.Registry.register(this.dd);
	},

	_handleButtonClick: function(evt) {
		var targetEl = evt.getTarget();
		targetEl = Ext.get(targetEl);
		if (targetEl && 
		    !targetEl.hasClass('feEditAdvanced-editButton') &&
		    !targetEl.hasClass('feEditAdvanced-actionButton') &&
		    targetEl.id != 'feEditAdvanced-closeButton') {
			targetEl = Ext.get(targetEl.up('.feEditAdvanced-actionButton | .feEditAdvanced-editButton'));
		}

		if (targetEl) {
			if (targetEl.hasClass('editAction')) {
				this.edit();
			} else if (targetEl.hasClass('upAction')) {
				this.up();
			} else if (targetEl.hasClass('downAction')) {
				this.down();
			} else if (targetEl.hasClass('newRecordAction')) {
				this.create();
			} else if (targetEl.hasClass('hideAction')) {
				this.hide();
			} else if (targetEl.hasClass('unhideAction')) {
				this.unhide();
			} else if (targetEl.hasClass('deleteAction')) {
				this.remove();
			} else if (targetEl.hasClass('saveAction')) {
				this.save();
			} else if (targetEl.hasClass('saveCloseAction')) {
				this.saveAndClose();
			} else if (targetEl.hasClass('closeAction')) {
				this.close();
			} else if (targetEl.hasClass('cutAction')) {
				this.cut();
			} else if (targetEl.hasClass('copyAction')) {
				this.copy();
			}
		}
		
		evt.stopEvent();
		return false;
	},

	showMenu: function(evt) {
		if (!this.hoverMenuAlwaysVisible && FrontendEditing.editPanelsEnabled && this.hoverMenuEnabled) {
			this.menuEl.show();
			this.el.addClass('feEditAdvanced-allWrapperHover');
		}
		if (evt != undefined) {
			evt.stopEvent();
		}
	},

	hideMenu: function(evt) {
		if (!this.hoverMenuAlwaysVisible) {
			this.menuEl.hide();
			this.el.removeClass('feEditAdvanced-allWrapperHover');
		}
		if (evt != undefined) {
			evt.stopEvent();
		}
	},

	editClick: function(evt) {
			// if in middle of dragging, exit
		if (!FrontendEditing.editPanelsEnabled || !this.hoverMenuEnabled) {
			return;
		}
			// make sure on valid element
		var targetEl = evt.getTarget('.editableOnClick', 20);
		if (targetEl) {
			this.edit();
		}

		if (evt != undefined) {
			evt.stopEvent();
		}
	},

	enableHoverMenu: function() {
		this.hoverMenuEnabled = true;
	},

	disableHoverMenu: function() {
		this.hoverMenuEnabled = false;
		if (this.isHoverMenuVisible()) {
			this.hideMenu();
		}
	},

	isHoverMenuVisible: function() {
		return this.menuEl.isVisible();
	},

	createFormObservers: function() {
		this.el.select('form').each(function(formEl) {
			formEl = Ext.get(formEl);
			// @todo Find a better way to remove the attribute completely.
			formEl.set({'onsubmit':''});
			formEl.on('submit', function(evt) { evt.stopEvent(); });
		}, this);

			// Buttons at the bottom of the edit window
		Ext.DomQuery.select('#feEditAdvanced-editControls button').each(function(button) {
			Ext.get(button).on('click', this._handleButtonClick, this);
		}, this);

			// Close button in the top right corner of the edit window
		Ext.get('feEditAdvanced-closeButton').on('click', this._handleButtonClick, this);
	},

	setupEventListeners: function() {
			// Show and hide the menu based on mouseovers
		this.el.on('mouseover', this.showMenu, this);
		this.el.on('mouseout',  this.hideMenu, this);
		
		var editPanelToolbar = this.el.first();

			// Set up event handlers for the hover menu buttons
		editPanelToolbar.select('.feEditAdvanced-editButton').each(function(button) {
			button = Ext.get(button);
			button.setVisibilityMode(Ext.Element.DISPLAY);
			button.on('click', this._handleButtonClick, this);
		}, this);

			// Setup event handler for edit on click
		if (editPanelToolbar.next('.editableOnClick')) {
			var editableOnClick = editPanelToolbar.next('.editableOnClick');
			Ext.get(editableOnClick).on('click', this.editClick, this);
		} else {
				// Not editable on click means there's no visible content
				// and so the hover menu should always be visible.
			this.hoverMenuAlwaysVisible = true;
		}
	},
	
	// @todo Is this beter suited as an action?
	pushContentUpdate: function(json) {
		if (json.content) {
			content = json.content;
			json.content = Ext.util.Format.stripScripts(content);
		}
		id = this.el.id;

		// @todo	This is where we'd normally call this._process for an action.
		
		// @todo	Get the table from the json response.
		table = 'tt_content';

		if ((table + ':' + json.uid) == id) {
			this.replaceContent(json.content);
			// @todo Pull this re-registration into a standalone method.
			this.el = Ext.get(id);
			this.menuEl = Ext.get(this.el.select('div.feEditAdvanced-editPanelDiv').first());
			this.formEl = Ext.get(this.el.select('form').first());	// todo: we should use a class here
			this.setupEventListeners();
		} else {
			// Insert the HTML and register the new edit panel
			Ext.DomHelper.insertAfter(this.el, json.content, true);
			nextEditPanel = this.el.next('div.feEditAdvanced-allWrapper');
			FrontendEditing.editPanels.add(nextEditPanel.id, new TYPO3.FeEdit.EditPanel(nextEditPanel));
		}

		/**
		 * Reenable when JSHandler is ported to ExtJS
		if (json.content) {
			FrontendEditing.JSHandler.evaluate(content);
		}
		*/
	},

	replaceContent: function(newContent) {
		elId = this.el.id;
		Ext.DomHelper.insertAfter(this.el, newContent, true);
		this.el.remove();
		this.el = Ext.get(elId);
	},
	
	removeContent: function() {
		this.el.remove();
		this.el = null;
	},
	
	getPreviousContentElement: function() {
		return this.el.prev('.feEditAdvanced-allWrapper');
	},
	
	getNextContentElement: function() {
		return this.el.next('.feEditAdvanced-allWrapper');
	},
	
	hideUpButton: function() {
		Ext.get(this.el.select('input.upAction')).hide();
	},

	showUpButton: function() {
		Ext.get(this.el.select('input.upAction')).show();
	},

	hideDownButton: function() {
		Ext.get(this.el.select('input.downAction')).hide();
	},

	showDownButton: function() {
		Ext.get(this.el.select('input.downAction')).show();
	},
	
	updateUpDownButtons: function() {
		if (!this.getPreviousContentElement()) {
			this.hideUpButton();
		} else {
			this.showUpButton();
		}
		if (!this.getNextContentElement()) {
			this.hideDownButton();
		} else {
			this.showDownButton();
		}
	}
});


TYPO3.FeEdit.DropZone = Ext.extend(TYPO3.FeEdit.Base, {
	// the ad-hoc created element
	el: null,
	dz: null,

	constructor: function(editPanel) {
			//  Use an ID that relate the dropzone element back to the edit panel.
			// Insert the drop zone after the edit panel.
		var editPanelEl = editPanel.el;
		this.el = Ext.DomHelper.insertAfter(editPanelEl, {
			'tag': 'div',
			'id': 'feEditAdvanced-dropzone-' + editPanelEl.id,
			'cls': 'feEditAdvanced-dropzone',
			'html': '<span class="feEditAdvanced-dropzoneLeft"></span><span class="feEditAdvanced-dropzoneCenter"> </span><span class="feEditAdvanced-dropzoneRight"></span>'
		}, true);

		// create the drop zone
		this.dz = new Ext.dd.DropZone(this.el, {
			ddGroup: 'feeditadvanced-toolbar',
			overClass: 'feEditAdvanced-dropzoneActive'
		});
		this.dz.notifyEnter = this.onHover;
		this.dz.notifyOut   = this.onHoverOut;
		this.dz.notifyDrop  = this.onDrop;
		Ext.dd.Registry.register(this.dz);
	},

	onDrop: function(dragSource, evt, data) {
		var linkedDragEl = Ext.get(dragSource.getEl());
		var dropZoneEl = Ext.get(this.getEl());

		if (linkedDragEl.hasClass('feEditAdvanced-contentTypeItem')) {
			// create a new record
			ep = FrontendEditing.editPanels.get(dropZoneEl.prev('.feEditAdvanced-allWrapper').id);
			ep.create(linkedDragEl.getAttribute('href'));

		} else if (linkedDragEl.hasClass('feEditAdvanced-allWrapper')) {
				// Move the dropped element outside the drop zone before it gets hidden.
			//linkedDragEl.setAttribute('style', '');
			dropZoneEl.insertBefore(linkedDragEl);
			//TODO: Ext? linkedDragEl.highlight({ duration: 3 });

			source = FrontendEditing.editPanels.get(linkedDragEl.id);
			destination = FrontendEditing.editPanels.get(linkedDragEl.prev().id);

			var recordFields = destination.record.split(':');
			source.moveAfter(recordFields[1]);

		} else if (linkedDragEl.hasClass('clipObj')) {
			srcElement = linkedDragEl.select('form input.feEditAdvanced-tsfeedit-input-record').first().getValue();
			cmd = linkedDragEl.select('form input.feEditAdvanced-tsfeedit-input-cmd').first().getValue();

				// do a clear of element on clipboard
			FrontendEditing.clipboard.clearClipboard(linkedDragEl);

				// if source is on this page, then move it
			if (srcElement) {
					// set source and destination
				source = FrontendEditing.editPanels.get(srcElement.id);
				destination = FrontendEditing.editPanels.get(dropZoneEl.prev().id);

				srcElement.setAttribute('style', '');
					// do the actual cut/copy
				if (cmd == 'cut') {
						// move the element to where it is dropped
					source.paste(destination.getDestinationPointer());
					srcElement.removeClass('doCut');
					dropZoneEl.insertAfter(srcElement);
					//TODO: Ext? linkedDragEl.highlight({duration: 5});

					// now trigger the cut action
				} else if (cmd == 'copy') {
						// display the element where it is dropped
					srcElement.removeClass('doCopy');

					clonedElement = srcElement.cloneNode(true);
					dropZoneEl.insertAfter(clonedElement);
					newSource = FrontendEditing.editPanels.get(clonedElement.id);
					newSource.paste(destination.getDestinationPointer());
				}
			}
			// if source is NOT on this page, then need to:
			// 		do everything except use "blank" source
			//
		} else {
			alert("hmm, doesn't look like we can handle this drag.");
		}
	},
	
	onHover: function(dragSource, evt, data) {
		console.log('hovering over a dropzone');
		var dragEl = Ext.get(dragSource.getDragEl());
		this.el.addClass('feEditAdvanced-dropzoneActive');

			// used for moving editpanels around
			// If we're hovering over a dropzone,
			// make the dropzone large enough to accomodate the element
		if (dragEl.hasClass('feEditAdvanced-allWrapper')) {
			this.el.setStyle('height', dragEl.getHeight() + 'px');
		}
	},
	
	onHoverOut: function(source, evt, data) {
		console.log('leaving a dropzone');
		this.el.removeClass('feEditAdvanced-dropzoneActive');
	},
	
	remove: function() {
		this.dz.unreg();
		if (this.el) {
			this.el.remove();
		}
		this.el = null;
	}
});


// ==== Define classes for each edit action ====

/**
 * default action that every action inherits from
 */
TYPO3.FeEdit.EditPanelAction = Ext.extend(TYPO3.FeEdit.Base, {
	ajaxRequestUrl: 'index.php',
		// there are "ajax" actions and "iframe" actions
		// iframe actions only need the URL and don't trigger the AJAX call when triggering the action
	requestType: 'ajax',
	_isModalAction: true,

	// init function, sets the "parent" which is the edit panel (I believe so at least)
	// and the command from the subclass
	constructor: function(parent) {
		this.parent = parent;
		this.cmd = this._getCmd();
	},

	// is called when an icon is pressed, something is dropped or edited
	trigger: function(additionalParams) {
			// handle timeouts
		//this.setupTimer();
		FrontendEditing.actionRunning = true;

		// instantiate a edit window if this doesn't exist yet
		if (!FrontendEditing.editWindow) {
			FrontendEditing.editWindow = new TYPO3.FeEdit.EditWindow(this.parent);
		}
		
		// if the "isModelAction" flag is set, then there is a notification message
		if (this._isModalAction) {
			FrontendEditing.editWindow.displayLoadingMessage(this._getNotificationMessage());
		}

		// make a request to the server
		if (this.requestType == 'ajax') {
				// now do the AJAX request
			Ext.Ajax.request({
				url:    this.ajaxRequestUrl,
				params: this._getAjaxRequestParameters(additionalParams),
				method: 'POST',
				headers: { Accept: 'application/json' },
				success: this._handleSuccessResponse,
				failure: this._handleFailureResponse,
				scope: this
			});
		}
	},
	
	// function to return a full URL (good for the iframe variant)
	getRequestUrl: function(additionalParams) {
		return this.ajaxRequestUrl + (this.ajaxRequestUrl.indexOf('?') == -1 ? '?' : '&') + this._getAjaxRequestParameters(additionalParams);
	},

	// function to return additional parameters that will be sent to the server through the AJAX call or iframe GeT parameters
	_getAjaxRequestParameters: function(additionalParams) {
		var requestParams = 'eID=feeditadvanced';
		this.parent.getFormParameters();
		if (this.parent.params) {
			requestParams += '&' + this.parent.params;
		}

		if (additionalParams != undefined) {
			requestParams += '&' + additionalParams;
		}
		// remove the doubled TSFE_EDIT[cmd] (because it's empty) before we add the real cmd value
		requestParams  = requestParams.replace(/&TSFE_EDIT%5Bcmd%5D=&/, '&');
		requestParams += '&TSFE_EDIT[cmd]=' + this.cmd + '&pid=' + this.parent.pid;
		return requestParams;
	},

	// callback function to handle if the AJAX response was faulty
	_handleFailureResponse: function(response, options) {
		FrontendEditing.actionRunning = false;
		alert('AJAX error: ' + response.responseText);
	},

	// callback function to extract the JSON response from the server 
	_handleSuccessResponse: function(response, options) {
		FrontendEditing.actionRunning = false;
		if (response.getResponseHeader('X-JSON')) {
			var json = Ext.decode(response.responseText);
			if (json.error) {
				FrontendEditing.editWindow.displayStaticMessage(json.error);
			} else if (json.url) {
				window.location = json.url;
			} else {
				if (json.content) {
					content = json.content;
					json.content = content.stripScripts();
				}

				if (json.newContent) {
					newContent = json.newContent;
					json.newContent = newContent.stripScripts();
				}
				
				id = this.parent.el.id;
				this._process(json);
				this.parent.el = Ext.get(id);

				if (json.content) {
					FrontendEditing.JSHandler.evaluate(content);
				}
				
				if (json.newContent) {
					FrontendEditing.JSHandler.evaluate(newContent);
				}
			}
		} else {
			FrontendEditing.editWindow.displayStaticMessage('It looks like we encountered some problems. Please reload the page and try again or contact your administrator.');
		}
		
	},

	_process: function() {
		// Implemented by concrete classes
	},

	_getCmd: function() {
		// Implemented by concrete classes
	},

	_getNotificationMessage: function() {
		return "We shouldn't ever see this message.";
	},

	_getAlreadyProcessingMsg: function() {
		return 'Already processing an action, please wait.';
	},

	// TODO: do we need this? there is a timer in Ext.Ajax
	setupTimer: function() {
			// Register global responders that will occur on all AJAX requests
		new Ajax.Responders.register({
			onCreate: function(request) {
			request['timeoutId'] = window.setTimeout(
				function() {
						// If we have hit the timeout and the AJAX request is active, abort it and let the user know
					if (this.callInProgress(request.transport)) 	{
						request.transport.abort();
						this.showFailureMessage();
							// Run the onFailure method if we set one up when creating the AJAX object
						if (request.options['onFailure']) {
							request.options['onFailure'](request.transport, request.json);
						}
					}
				},
				5000 // Five seconds
			);
			},
			onComplete: function(request) {
					// Clear the timeout, the request completed ok
				window.clearTimeout(request['timeoutId']);
			}
		});
	},
	callInProgress: function(xmlhttp) {
		var inProgress;

		switch (xmlhttp.readyState) {
			case 1:
			case 2:
			case 3:
				inProgress = true;
				break;
			// Case 4 and 0
			default:
				inProgress = false;
				break;
		}

		return inProgress;
	},

	showFailureMessage: function() {
		alert('Network problems -- please try again shortly.');
	}
	
});



TYPO3.FeEdit.NewRecordAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	requestType: 'iframe',

	trigger: function() {
		TYPO3.FeEdit.EditAction.superclass.trigger.apply(this, arguments);
		var url = this.getRequestUrl();
		FrontendEditing.editWindow.displayIframe('New Content Block', url);
	},

	_process: function () {},

	_getCmd: function() {
		return 'new';
	},

	_getNotificationMessage: function() {
		return 'Loading editing form.';
	}
});

TYPO3.FeEdit.EditAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	requestType: 'iframe',

	trigger: function() {
		TYPO3.FeEdit.EditAction.superclass.trigger.apply(this, arguments);
		var url = this.getRequestUrl();
		FrontendEditing.editWindow.displayIframe('Edit Content Block', url);
	},

	_process: function() {},

	_getCmd: function() {
		return 'edit';
	},

	_getNotificationMessage: function() {
		return 'Loading editing form.';
	}
});

TYPO3.FeEdit.DeleteAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.close();
		this.parent.removeContent();
	},

	trigger: function() {
		if (confirm("Are you sure you want to delete this content?")) {
			TYPO3.FeEdit.DeleteAction.superclass.trigger.apply(this);
		}
	},

	_getCmd: function() {
		return 'delete';
	},

	_getNotificationMessage: function() {
		return "Deleting content.";
	},
	
	_isModalAction: false
});

TYPO3.FeEdit.HideAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.close();
		this.parent.el.addClass('feEditAdvanced-hiddenElement');
		Ext.get(this.parent.el.select('input.unhideAction').first()).setDisplayed('block');
		Ext.get(this.parent.el.select('input.hideAction').first()).setDisplayed('none');
	},

	_getCmd: function() {
		return 'hide';
	},

	_getNotificationMessage: function() {
		return "Hiding content.";

	},
	
	_isModalAction: false
});

TYPO3.FeEdit.UnhideAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.close();
		this.parent.el.removeClass('feEditAdvanced-hiddenElement');
		Ext.get(this.parent.el.select('input.unhideAction').first()).setDisplayed('none');
		Ext.get(this.parent.el.select('input.hideAction').first()).setDisplayed('block');
	},

	_getCmd: function() {
		return 'unhide';
	},

	_getNotificationMessage: function() {
		return "Unhiding content.";
	},

	_isModalAction: false
});

TYPO3.FeEdit.UpAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	trigger: function() {
		previousEditPanel = this.parent.el.prev();
		if (previousEditPanel) {
			this.parent.el.insertBefore(previousEditPanel);
			this.parent.updateUpDownButtons();
			FrontendEditing.editPanels.get(previousEditPanel.id).updateUpDownButtons();
			this.parent.hideMenu();
			TYPO3.FeEdit.UpAction.superclass.trigger.apply(this, arguments);
		}
	},
	
	_process: function(json) {
		FrontendEditing.editPanelsEnabled = true;
	},

	_getNotificationMessage: function() {
		return "Moving content.";
	},

	_getCmd: function() {
		return 'up';
	},

	_isModalAction: false
});

TYPO3.FeEdit.DownAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	trigger: function() {
		nextEditPanel = this.parent.el.next();
		if (nextEditPanel) {
			this.parent.el.insertAfter(nextEditPanel);
			this.parent.updateUpDownButtons();
			FrontendEditing.editPanels.get(nextEditPanel.id).updateUpDownButtons();
			this.parent.hideMenu();
			TYPO3.FeEdit.DownAction.superclass.trigger.apply(this, arguments);
		}
	},
	
	_process: function(json) {
		FrontendEditing.editPanelsEnabled = true;
	},

	_getNotificationMessage: function() {
		return "Moving content.";
	},

	_getCmd: function() {
		return 'down';
	},

	_isModalAction: false
});

TYPO3.FeEdit.MoveAfterAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	_process: function(json) {
			// allow to edit again
		FrontendEditing.editPanelsEnabled = true;
	},

	_getNotificationMessage: function() {
		return "Moving content.";
	},

	_getCmd: function() {
		return 'moveAfter';
	},

	_isModalAction: false
});

TYPO3.FeEdit.SaveAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	trigger: function() {
			// Set the doSave element.
		this.parent.el.select('input.feEditAdvanced-tsfeedit-input-doSave').each(function(el) {
			Ext.get(el).set({'value': 1});
		});

		if (TBE_EDITOR.checkSubmit(1)) {
			formParams = Ext.Ajax.serializeForm(Ext.get('feEditAdvanced-editWindow').select('form').first());
			TYPO3.FeEdit.SaveAction.superclass.trigger.apply(this, formParams);
		}
	},

	_process: function(json) {
		// @todo	Alert if the save was not successful.
		if (FrontendEditing.editWindow) {
			FrontendEditing.editWindow.displayEditingForm("Edit Content Block", json.content);
		}
	},

	_getNotificationMessage: function() {
		return 'Saving content.';
	},

	_getCmd: function() {
			// @todo	Temporary hack to return edit form again on save().
		return 'edit';
	}
});


TYPO3.FeEdit.CloseAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	trigger: function() {
			// If this EditPanel is nested inside another, find the ID of the parent EditPanel
		if (this.parent.el.up('.feEditAdvanced-allWrapper')) {
			parentID = this.parent.el.up('.feEditAdvanced-allWrapper').id;
			formParams = '&TSFE_EDIT[parentEditPanel]=' + parentID;
		} else {
			formParams = '';
		}
		TYPO3.FeEdit.CloseAction.superclass.trigger.apply(this, formParams);
	},

	_process: function(json) {
		FrontendEditing.editWindow.close();
		// @todo	Get the table from the json response.
		table = 'tt_content'; 
		
		if (json.uid) {
			ep = FrontendEditing.editPanels.get([table + ':' + json.uid]);
			ep.replaceContent(json.content);
			FrontendEditing.scanForEditPanels();
		} else {
			this.parent.replaceContent(json.content);
			this.parent.setupEventListeners();
		}
		
		if (json.newUID) {
				// Insert the HTML and register the new edit panel.
			this.parent.el.insertAfter(json.newContent);
			nextEditPanel = this.parent.getNextContentElement();
			FrontendEditing.editPanels.add(nextEditPanel.id, new TYPO3.FeEdit.EditPanel(nextEditPanel));
		}
	},

	_getNotificationMessage: function() {
		return "Closing editing form";
	},

	_getCmd: function() {
		return 'close';
	}
});

TYPO3.FeEdit.SaveAndCloseAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	trigger: function() {
			// Set the doSave element.
		var content = $(this.parent.el.dom);
		content.select('input[name=TSFE_EDIT[doSave]]').each(function(el) {
			Ext.get(el).setAttribute("value", 1);
		});

		if (TBE_EDITOR.checkSubmit(1)) {
			formObj = $$('#feEditAdvanced-editWindow form')[0];
			formParams = $$('#feEditAdvanced-editWindow form')[0].serialize();

				// If this EditPanel is nested inside another, find the ID of the parent EditPanel
			if (this.parent.el.up('.feEditAdvanced-allWrapper')) {
				parentID = this.parent.el.up('.feEditAdvanced-allWrapper').id;
				formParams += '&TSFE_EDIT[parentEditPanel]=' + parentID;
			}

			TYPO3.FeEdit.SaveAndCloseAction.superclass.trigger.apply(this, formParams);
		}
	},

	_process: function(json) {
		FrontendEditing.editWindow.close();
		// @todo	Get the table from the json response.
		table = 'tt_content';

		if (json.uid) {
			ep = FrontendEditing.editPanels.get(table + ':' + json.uid);
			ep.replaceContent(json.content);
			FrontendEditing.scanForEditPanels();
		} else {
			this.parent.replaceContent(json.content);
			this.parent.setupEventListeners();
		}

		if (json.newUID) {
				// Insert the HTML and register the new edit panel.
			this.parent.el.insertAfter(json.newContent);
			nextEditPanel = this.parent.el.next('div.feEditAdvanced-allWrapper');
			FrontendEditing.editPanels.add(nextEditPanel.id, new TYPO3.FeEdit.EditPanel(nextEditPanel));
		}
	},

	_getNotificationMessage: function() {
		return 'Saving content.';
	},

	_getCmd: function() {
		return 'saveAndClose';
	}
});

TYPO3.FeEdit.CopyAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	_process: function(json) {
			// put "copy" selector around
		this.parent.el.addClass('doCopy');

			// create new "copy" object in menubar clipboard
		clipboardObj = Ext.fly('clipboardToolbar');
		if (clipboardObj) {
			FrontendEditing.clipboard.addToClipboard(this);
		}
	},

	_getNotificationMessage: function() {
		return 'Copying content';
	},

	_getCmd: function() {
		return 'copy';
	}
});

TYPO3.FeEdit.CutAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	_process: function(json) {
			// put "cut" selector around
		this.parent.el.addClass('doCut');

			// create new "cut" object in menubar clipboard
		clipboardObj = Ext.fly('clipboardToolbar');
		if (clipboardObj) {
			FrontendEditing.clipboard.addToClipboard(this);
		}
	},

	_getNotificationMessage: function() {
		return 'Cutting content.';
	},

	_getCmd: function() {
		return 'cut';
	}
});

TYPO3.FeEdit.PasteAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {
	trigger: function() {

		formParams = Ext.Ajax.serializeForm(this.parent.el.select('form').first());
			// add setCopyMode
			// add sourcePointer
		TYPO3.FeEdit.PasteAction.superclass.trigger.apply(this, formParams);
	},

	_process: function(json) {
	},

	_getNotificationMessage: function() {
		return 'Pasting content.';
	},

	_getCmd: function() {
		return 'paste';
	}
});

	// Add all the actions directly to the EditPanel objects.
Ext.override(TYPO3.FeEdit.EditPanel, {
	create: function(additionalParams) {
		action = new TYPO3.FeEdit.NewRecordAction(this);
		action.trigger(additionalParams);
	},

	edit: function() {
		action = new TYPO3.FeEdit.EditAction(this);
		action.trigger();
	},

	hide: function() {
		action = new TYPO3.FeEdit.HideAction(this);
		action.trigger();
	},
	unhide: function() {
		action = new TYPO3.FeEdit.UnhideAction(this);
		action.trigger();
	},
	remove: function() {
		action = new TYPO3.FeEdit.DeleteAction(this);
		action.trigger();
	},

	moveAfter: function(afterUID) {
		extraParam = 'TSFE_EDIT[moveAfter]='+afterUID;
		action = new TYPO3.FeEdit.MoveAfterAction(this);
		action.trigger(extraParam);
	},

	save: function() {
		action = new TYPO3.FeEdit.SaveAction(this);
		action.trigger();
	},

	close: function() {
		action = new TYPO3.FeEdit.CloseAction(this);
		action.trigger();
	},

	saveAndClose: function() {
		action = new TYPO3.FeEdit.SaveAndCloseAction(this);
		action.trigger();
	},

	cut: function() {
		action = new TYPO3.FeEdit.CutAction(this);
		action.trigger();
	},

	copy: function() {
		action = new TYPO3.FeEdit.CopyAction(this);
		action.trigger();
	},

	paste: function(additionalParams) {
		action = new TYPO3.FeEdit.PasteAction(this);
		action.trigger();
	},

	up: function(additionalParams) {
		// @todo Need possibly a MoveUpDownAction...
		action = new TYPO3.FeEdit.UpAction(this);
		action.trigger();
	},

	down: function(additionalParams) {
		action = new TYPO3.FeEdit.DownAction(this);
		action.trigger();
	}	
});


TYPO3.FeEdit.ClipboardObj = Ext.extend(TYPO3.FeEdit.Base, {
	showClipboard: function(onOff) {
		if (onOff) {
			Ext.get('clipboardToolbar').show();
		} else {
			Ext.get('clibpoardToolbar').hide();
		}
	},

	addToClipboard: function(editPanelAction) {
		this.showClipboard(true);
			// create & cleanup "display" string
		strVal = editPanelAction.parent.el.select('.feEditAdvanced-contentWrapper').first().innerHTML;
			 // strip tags
		strVal = strVal.replace(/(<([^>]+)>)/ig,"");
			 // trim spaces
		strVal = strVal.replace(/^\s+|\s+$/g, '');
			// first 12 chars
		strVal = strVal.substr(0,12);

			// determine which clip object to add to
		if (!clipboardObj.select('#clip1').first()) {
			clipID = 'clip1';
		} else if (!clipboardObj.select('#clip2').first()) {
			clipID = 'clip2';
		} else if (!clipboardObj.select('#clip3').first()) {
			clipID = 'clip3';
		} else {
				 // if all are used, overwrite first one
			clipID = 'clip1';
		}
			// grab the UID (so can easily search based on this)
		if (rec = editPanelAction.parent.record) {
			splt = rec.indexOf(':');
			thisUID = rec.substr(splt+1);
		}
			// build a clipboard object that has values from content element
		pasteValues = '<input type="hidden" name="TSFE_EDIT[cmd]" value="' + editPanelAction._getCmd() + '"><input type="hidden" name="TSFE_EDIT[record]" value="' + rec + '"><input type="hidden" name="TSFE_EDIT[pid]" value="' + editPanelAction.parent.pid + '"><input type="hidden" name="TSFE_EDIT[flexformPtr]" value="' + editPanelAction.parent.flexformPtr + '"><input type="hidden" name="TSFE_EDIT[uid]" value="' + thisUID + '">';
		clearBtn = '<div class="clearBtn" id="clearBtn' + thisUID + '"> </div>';
		pasteEl = '<div class="clipContainer" id="' + clipID + '"><div class="draggable clipObj"><form name="TSFE_EDIT_FORM_' + thisUID + '">' +
					strVal + pasteValues +
					'</form></div>' + clearBtn + '</div>';
		newEl = clipboardObj.append(pasteEl);

			// allow to click on clear button
		thisBtn = Ext.get('clearBtn' + thisUID);
		thisBtn.on('click', this.clickClearClipboard, this);

			// make the element draggable
		toolbar.addDraggable(Ext.get(clipObj));

	},

		// find the element that clicked on
	clickClearClipboard: function(evt) {
		var element = evt.getTarget('div');
		this.clearClipboard(element);
	},

	clearClipboard: function(element) {
			// hide (or delete) the clipboard object
		clipObj = element.up();
		clipObj = Ext.get(clipObj);
		clipObj.hide();

			// clear out the marked content element
		var editPanelId = clipObj.select('form input[name="TSFE_EDIT[record]"]').first().getValue();
		if (editPanelId) {
			Ext.get(editPanelId).removeClass('doCopy');
			Ext.get(editPanelId).removeClass('doCut');
		}

		//@TODO check to see if anything on clipboard...if empty, then hide
		//this.showClipboard(false);

	}

});


TYPO3.FeEdit.EditWindow = Ext.extend(TYPO3.FeEdit.Base, {
	editPanel: null,
	
	constructor: function(editPanel) {
		this.editPanel = editPanel;
		if (!Ext.ux.Lightbox.hasListener('close')) {
			Ext.ux.Lightbox.addListener('close', this.close, this);
		}
	},
	
	displayLoadingMessage: function(message) {
		Ext.ux.Lightbox.openMessage('<h3>' + message + '</h3>', 200, 100, true)
	},
	
	displayStaticMessage: function(message) {
		Ext.ux.Lightbox.openMessage('<h3>' + message + '</h3>', 200, 100, false)
	},

	displayIframe: function(headerText, url) {
		Ext.ux.Lightbox.openUrl({'href': url, 'title': headerText}, 600, 400)
	},

	close: function() {
		name = 'ux-lightbox-shim';
		if (window.frames[name].response) {
			json = window.frames[name].response;

			if (json.error) {
				this.displayStaticMessage(json.error);
			} else if (json.url) {
				window.location = json.url;
			} else {
				this.editPanel.pushContentUpdate(json);
			}
		}
		FrontendEditing.editPanelsEnabled = true;

			// Reset elements to be validated by TBE_EDITOR.
		if (typeof(TBE_EDITOR) != 'undefined') {
			TBE_EDITOR.elements = {};
			TBE_EDITOR.nested = {'field':{}, 'level':{}};
		}
	}
});

/*
 * Main class for storing all current values
 * relevant for frontend editing
 */
var FrontendEditing = {
	clipboard: new TYPO3.FeEdit.ClipboardObj(),
	editPanels: new Ext.util.MixedCollection(),
	editPanelsEnabled: true,
	JSHandler: new TYPO3.FeEdit.AJAXJavascriptHandler(),
	toolbar: null,
	actionRunning: false,
	editWindow: null,

	init: function() {
		Ext.getBody().addClass('feEditAdvanced');
		this.scanForEditPanels();
		this.initializeMenuBar();
	},

		// @todo	We eventually want to encapsulate this in a class or something, but it
		//		gives us a quick way to re-register all EditPanels when new content is added.
	scanForEditPanels: function() {
		// Create all the EditPanels and stick them in an array
		Ext.each(Ext.query('div.feEditAdvanced-allWrapper'), function (el) {
			this.editPanels.add(el.id, new TYPO3.FeEdit.EditPanel(el));
		}, this);
	},
	
	initializeMenuBar: function() {
		this.toolbar = new TYPO3.FeEdit.Toolbar('feEditAdvanced-menuBar');
	}
};

// Set the edit panels and menu bar on window load
Ext.onReady(function() {
	FrontendEditing.init();
});
