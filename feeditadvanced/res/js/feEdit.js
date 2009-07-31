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

// TODO: make all classes created via Ext JS (not a Class.create)
// TODO: make all classes namespaced ("TYPO3.FeEdit")
Ext.namespace('TYPO3.FeEdit');

// TODO: go through every part (also CSS and PHP) and use this base class for every class and ID
TYPO3.FeEdit.baseCls = 'feeditadvanced';

/*
 * Class for Toolbars and Draggable Widgets within the toolbars.
 */
var Toolbar = Class.create({
	el: false,
	widgets: [],

	/*
	 * initializes the toolbar element and finds all dragable buttons
	 **/
	initialize: function(toolbarElementId) {
		this.el = Ext.get(toolbarElementId);
		if (this.el) {
			// This does not work in Ext JS, thus it's a bug in the contrib library
			// @todo: send this issue to Ext JS
			// Problem: selecting items with multiple classes while having a different root node
			// than the original document results in nothing
			// var allWidgets = Ext.DomQuery.select('.draggable', this.el);
			var allWidgets = Ext.DomQuery.select('#' + this.el.id + ' .draggable');
			// Create all the draggable buttons in the toolbar
			allWidgets.each(function(draggableElement) {
				this.widgets.push(new ToolbarWidget(draggableElement));
			}, this);
		}
	},

	/**
	 * adds a draggable object and registers the toolbar widget
	 **/
	addDraggable: function(toolbarElement) {
		// get draggable item
		// var draggableElements = Ext.DomQuery.select('.draggable', toolbarElement);
		var draggableElements = Ext.DomQuery.select('#' + toolbarElement.id + ' .draggable');
		draggableElements.each(function(draggableElement) {
			this.widgets.push(new ToolbarWidget(draggableElement));
		}, this);
	}
});



/** 
 * Class for the toolbar item that is on top of the page
 * needs 
 */
var ToolbarWidget = Class.create({
	el: null,
	dd: null,

	initialize: function(draggableEl) {
		this.el = Ext.get(draggableEl);

			// Override clicks on any elements that are also draggable. 
			// This may eventually trigger an add in the main content area instead.
		this.el.addListener('click', function(evt) { evt.stopEvent(); });

		this.dd = new Ext.dd.DragSource(this.el.id, {
			ddGroup: 'feeditadvanced-toolbar',
//			dropAllowed: 'feEditAdvanced-dropzone'
		});

		this.dd.startDrag = function(x, y) {
			var dragEl = Ext.get(this.getDragEl());
			var el = Ext.get(this.getEl());

			dragEl.applyStyles({'opacity':'0.6','z-index':2000});
			dragEl.update(el.dom.innerHTML);
			dragEl.addClass(el.dom.className + ' feeditadvanced-dd-proxy');

				// Enable drop indicators when a drag is started.
			FrontendEditing.editPanelsEnabled = false;
			FrontendEditing.editPanels.each(function(panel) {
				panel.addDropZone();
			});
		};

		this.dd.onDragOver = function(evt, id) {
			// id is the ID of the drop zone
		};

		this.dd.afterDragDrop = function(evt, id) {
				// Disable drop indicators when a drag is done
			FrontendEditing.editPanelsEnabled = true;
			FrontendEditing.editPanels.each(function(panel) {
				panel.enableHoverMenu();
				panel.removeDropZone();
			});
		};
		Ext.dd.Registry.register(this.dd);
	}
});

/*
 * Object for notification popups. Creating a new instances triggers the popup.
 */
var FrontendEditNotification = Class.create({
	el: false,

	initialize: function(content) {
		this.el = Ext.getBody().append({
			'tag': 'div',
			'style': 'display: none',
			'html': content,
			'cls': 'feEditAdvanced-notificationMsg'
		});
		this.show();
	},

	show: function() {
		this.el.fadeIn({ duration: 0.75 });
	},

	hide: function() {
		this.el.fadeOut({ duration: 0.35 });
	}
});

	// Object for Javascript handling as part of an AJAX request.
var AJAXJavascriptHandler = Class.create({
	initialize: function() {
		this.loadedElements = new Hash();
		this.unloadedElements = new Array();

		this.registerLoadedElements();
	},

	registerLoadedElements: function() {
		$$('head script[type="text/javascript"]').each(function(script) {
			if (src = script.readAttribute('src')) {
				this.loadedElements.set(src, 1);
			}
		}.bind(this));
		
		$$('head link[type="text/css"]').each(function(css) {
			if (src = css.readAttribute('href')) {
				this.loadedElements.set(src, 1);
			}
		}.bind(this));
	},

	evaluate: function(textContent) {
		var matchScript = new RegExp(Prototype.ScriptFragment, 'img');
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
			scriptElement.writeAttribute('src', src);

				// Add the element to the queue for processing later on
			this.addElementToQueue(scriptElement);
			this.loadedElements.set(src, 1);
		}
	},
	
	addInlineCSS: function(cssContent) {
		var styleElement = this.createStyleElement();
		styleElement.writeAttribute("type", "text/css");
		
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
		linkElement.writeAttribute('href', src);
		this.addElementToQueue(linkElement);
	},

	addJavascript: function(scriptTag) {
		var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
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
		var scriptElement = new Element('script', {'id': scriptID, 'type': 'text/javascript'});

		scriptElement.onreadystatechange = function() {
			if ((scriptElement.readyState == 'complete') || (scriptElement.readyState == 'loaded')) {
				this.processQueue();
			}
		}.bind(this);

		scriptElement.onload = function() {
			this.processQueue();
		}.bind(this);

		return scriptElement;
	},
	
	createStyleElement: function() {
		var styleID = new Date().getTime() + "_onDemandLoadedStyle";
		var styleElement = new Element('style', {'id': styleID, 'type': 'text/css'});
		
		styleElement.onreadystatechange = function() {
			if ((styleElement.readyState == 'complete') || (styleElement.readyState == 'loaded')) {
				this.processQueue();
			}
		}.bind(this);

		styleElement.onload = function() {
			this.processQueue();
		}.bind(this);

		return styleElement;
	},
	
	createLinkElement: function() {
		var styleID = new Date().getTime() + "_onDemandLoadedStyle";
		var linkElement = new Element('link', {'id': styleID, 'rel': 'stylesheet', 'type': 'text/css'});
		
		linkElement.onreadystatechange = function() {
			if ((linkElement.readyState == 'complete') || (linkElement.readyState == 'loaded')) {
				this.processQueue();
			}
		}.bind(this);

		linkElement.onload = function() {
			this.processQueue();
		}.bind(this);
		
		return linkElement;
	},
	
	addElementToHead: function(element) {
		$(document.getElementsByTagName("head")[0]).appendChild(element);
	},

	addElementToQueue: function(element) {
		this.unloadedElements.push(element);
	},

	processQueue: function() {
		if(this.unloadedElements.length) {
				// Grab the first element in the queue and add it to the DOM.
			firstElement = this.unloadedElements.shift();
			if (typeof firstElement == 'object') {
				this.addElementToHead(firstElement);

					// @todo	In Webkit, first element is null sometimes.  Not sure why but it throws an error here.
				try {
					src = firstElement.readAttribute('src');
				} catch (e) {}

					// If there's no source attribute, immediately process the next item.
					// Otherwise, wait for it to fire an onload event.
				if (!src) {
					this.processQueue();
				} else {
					this.loadedElements.set(src, 1);
				}
			}
		} else {
				// If we're done loading JS, add some custom TBE_EDITOR code.
			if (typeof(TBE_EDITOR) != "undefined") {
				var ajaxSubmitForm = function() {
					if (TBE_EDITOR.doSaveFieldName) {
						document[TBE_EDITOR.formname][TBE_EDITOR.doSaveFieldName].value = 1;
					}
					FrontendEditing.editPanels.get((Ext.get(TBE_EDITOR.formname).parent().parent().id)).save();
				};
				TBE_EDITOR.submitForm = ajaxSubmitForm;
			}
		}
	}

});

	// Object for an entire content element and its EditPanel.
var EditPanel = Class.create({
		// the DOM element (actually it's a Ext.get) of the wrapper Element of the content element
	el: null,
		// the DOM element of the editPanel or the hover menu of this content element
	menuEl: null,
		// the DOM element of the form object of the editPanel of this content element
	formEl: null,
	_extraElements: [],
	params: null,

	pid: null,
	record: null,
	
	sortable: false,
	hoverMenuEnabled: false,
	alwaysVisible: false,

	initialize: function(wrapperElement) {
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
		
		if (!this.getNextContentElement()) {
			this.hideDownButton();
		}
		
		if (!this.getPreviousContentElement()) {
			this.hideUpButton();
		}
	},
	
	addDropZone: function() {
		if (this.sortable) {
			this.dropZone = new TYPO3.FeEdit.DropZone(this);
		}
	},

	removeDropZone: function() {
		if (this.sortable && this.dropZone) {
			this.dropZone.remove();
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
				default:
					this._extraElements.push(formElement);
					break;
			}
		}, this);
			// make the additional formElement values as "&name=value"
		this.params = Ext.Ajax.serializeForm(this.formEl);
	},

	_makeDraggable: function() {
		this.dd = new Ext.dd.DragSource(this.el.parent(), {
			// TODO: different group please
			ddGroup: 'feeditadvanced-toolbar',
//			dropAllowed: 'feEditAdvanced-dropzone'
		});
		
		// find the handle and give the handle an ID
		var dragHandle = Ext.get(this.el.select('.feEditAdvanced-dragHandle').first());
		var dragHandleId = Ext.id(dragHandle, 'feEditAdvanced-dragHandle-');
		dragHandle.set({'id': dragHandleId});
		this.dd.setHandleElId(dragHandleId);

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

		this.dd.onDragOver = function(evt, id) {
			// id is the ID of the drop zone
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

		this.dd.afterDragDrop = function(evt, id) {
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
		if (!targetEl.hasClass('feEditAdvanced-editButton') &&
		    !targetEl.hasClass('feEditAdvanced-actionButton') &&
			targetEl.id != 'feEditAdvanced-closeButton') {
			targetEl = Ext.get(targetEl).up('.feEditAdvanced-actionButton, .feEditAdvanced-editButton');
			targetEl = Ext.get(targetEl);
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
		var targetEl = evt.getTarget();
		if (targetEl.hasClassName('editableOnClick') || targetEl.up('div.editableOnClick')) {
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
			formEl.addListener('submit', function(evt) { evt.stopEvent(); });
		}, this);

			// Buttons at the bottom of the edit window
		Ext.DomQuery.select('#feEditAdvanced-editControls button').each(function(button) {
			Ext.get(button).addListener('click', this._handleButtonClick, this);
		}, this);

			// Close button in the top right corner of the edit window
		Ext.get('feEditAdvanced-closeButton').addListener('click', this._handleButtonClick, this);
	},

	setupEventListeners: function() {
			// Show and hide the menu based on mouseovers
		this.el.addListener('mouseover', this.showMenu, this);
		this.el.addListener('mouseout',  this.hideMenu, this);
		
		var editPanelToolbar = this.el.first();

			// Set up event handlers for the hover menu buttons
		editPanelToolbar.query('.feEditAdvanced-editButton').each(function(button) {
			Ext.get(button).addListener('click', this._handleButtonClick, this);
		}, this);

			// Setup event handler for edit on click
		if (editPanelToolbar.next('.editableOnClick')) {
			var editableOnClick = editPanelToolbar.next('.editableOnClick');
			Ext.get(editableOnClick).addListener('click', this.editClick, this);
		} else {
				// Not editable on click means there's no visible content
				// and so the hover menu should always be visible.
			this.hoverMenuAlwaysVisible = true;
		}
	},

	replaceContent: function(newContent) {
		var elId = this.el.id;
		this.el = this.el.replaceWith(newContent);
		this.el.id = elId;
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
		Ext.get(this.el.query('input.upAction')).hide();
	},

	hideDownButton: function() {
		Ext.get(this.el.query('input.downAction')).hide();
	}

});


TYPO3.FeEdit.DropZone = Class.create({
	// the ad-hoc created element
	el: null,
	dz: null,

	initialize: function(editPanel) {
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
		this.dz = new Ext.dd.DropZone('feEditAdvanced-dropzone-' + editPanelEl.id, {
			ddGroup: 'feeditadvanced-toolbar',
			overClass: 'feEditAdvanced-dropzoneActive',
		});
		this.dz.notifyEnter = this.onHover;
		this.dz.notifyDrop = this.onDrop;
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
			linkedDragEl.setAttribute('style', '');
			dropZoneEl.insertBefore(linkedDragEl);
			//TODO: Ext? linkedDragEl.highlight({ duration: 3 });

			source = FrontendEditing.editPanels.get(linkedDragEl.id);
			destination = FrontendEditing.editPanels.get(linkedDragEl.prev().id);

			var recordFields = destination.record.split(':');
			source.moveAfter(recordFields[1]);

		} else if (linkedDragEl.hasClass('clipObj')) {
			srcElement = linkedDragEl.select('form input.feEditAdvanced-tsfeedit-input-record').first().getValue();
			cmd = linkedDragEl.select('form input.feEditAdvanced-tsfeedit-input-cmd"]').first().getValue();

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
		var dragEl = Ext.get(dragSource.getDragEl());
			// used for moving editpanels around
			// If we're hovering over a dropzone,
			// make the dropzone large enough to accomodate the element
		if (dragEl.hasClass('feEditAdvanced-allWrapper')) {
			this.el.setStyle('height', dragEl.getHeight() + 'px');
		}
	},
	
	remove: function() {
		Ext.dd.Registry.unregister(this.dz);
		if (this.el && this.el.parent()) {
			this.el.remove();
		}
	},

	show: function() {
		this.el.fadeIn();
	},

	hide: function() {
		this.el.fadeOut();
	}
});


// ==== Define classes for each edit action ====

/**
 * default action that every action inherits from
 */
var EditPanelAction = Class.create({
	initialize: function(parent) {
		this.parent = parent;
		this.cmd = this._getCmd();
	},

	trigger: function(additionalParams) {
			// handle timeouts
		//this.setupTimer();
		FrontendEditing.actionRunning = true;

		this.parent.getFormParameters();
		
		if (!FrontendEditing.editWindow) {
			FrontendEditing.editWindow = new EditWindow(this.parent);
		}
			
		if (this._isModalAction) {
			FrontendEditing.editWindow.displayLoadingMessage(this._getNotificationMessage());
		}
		
		paramRequest = 'eID=feeditadvanced';
		if (this.parent.params) {
			paramRequest += '&' + this.parent.params;
		}

		if (additionalParams != undefined) {
			paramRequest += '&' + additionalParams;
		}
		// remove the doubled TSFE_EDIT[cmd] (because it's empty) before we add the real cmd value
		paramRequest = paramRequest.replace(/&TSFE_EDIT%5Bcmd%5D=&/, '&');
		paramRequest += '&TSFE_EDIT[cmd]=' + this.cmd + '&pid=' + this.parent.pid;

			// now do the AJAX request
		Ext.Ajax.request({
			url: 'index.php',
			params: paramRequest,
			method: 'POST',
			headers: { Accept: 'application/json' },
			success: function(response, options) {
				FrontendEditing.actionRunning = false;
				this._handleResponse(response);
			},
			failure: function(response, options) {
				FrontendEditing.actionRunning = false;
				alert('AJAX error: ' + response.responseText);
			},
			scope: this
		});
	},
	
	_handleResponse: function(xhr) {
		if (xhr.getResponseHeader('X-JSON')) {
			var json = Ext.decode(xhr.responseText);
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
	},
	
	_isModalAction: true
});



var NewRecordAction = Class.create(EditPanelAction, {
	_process: function (json) {
		FrontendEditing.editWindow.displayEditingForm('New Content Block', json.content);
	},

	_getCmd: function() {
		return 'new';
	},

	_getNotificationMessage: function() {
		return 'Loading editing form.';
	}
});

var EditAction = Class.create(EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.displayEditingForm('Edit Content Block', json.content);
	},

	_getCmd: function() {
		return 'edit';
	},

	_getNotificationMessage: function() {
		return 'Loading editing form.';
	}
});
var DeleteAction = Class.create(EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.close();
		this.parent.removeContent();
	},

	trigger: function($super) {
		if (confirm("Are you sure you want to delete this content?")) {
			$super();
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
var HideAction = Class.create(EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.close();
		this.parent.el.addClass('feEditAdvanced-hiddenElement');
		this.parent.el.select('input.hideAction').hide();
		this.parent.el.select('input.unhideAction').show();
	},

	_getCmd: function() {
		return 'hide';
	},

	_getNotificationMessage: function() {
		return "Hiding content.";

	},
	
	_isModalAction: false
});
var UnhideAction = Class.create(EditPanelAction, {
	_process: function(json) {
		FrontendEditing.editWindow.close();
		this.parent.el.removeClass('feEditAdvanced-hiddenElement');
		Ext.get(this.parent.el.select('input.unhideAction').first()).hide();
		Ext.get(this.parent.el.select('input.hideAction').first()).show();
	},

	_getCmd: function() {
		return 'unhide';
	},

	_getNotificationMessage: function() {
		return "Unhiding content.";
	},

	_isModalAction: false
});

var UpAction = Class.create(EditPanelAction, {
	trigger: function($super) {
		previousEditPanel = this.parent.el.prev();
		if (previousEditPanel) {
			previousEditPanel.insertBefore(this.parent.el);
			$super();
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

var DownAction = Class.create(EditPanelAction, {
	trigger: function($super) {
		nextEditPanel = this.parent.el.next();
		if (nextEditPanel) {
			nextEditPanel.insertAfter(this.parent.el);
			$super();
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

var MoveAfterAction = Class.create(EditPanelAction, {
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

var SaveAction = Class.create(EditPanelAction, {
	trigger: function($super) {
			// Set the doSave element.
		var content = $(this.parent.el.dom);
		content.select('input[name="TSFE_EDIT[doSave]"]').each(function(el) {
			el.writeAttribute("value", 1);
		});

		if (TBE_EDITOR.checkSubmit(1)) {
			formParams = $('feEditAdvanced-editWindow').select('form')[0].serialize();
			$super(formParams);
		}
	},

	_process: function(json) {
		// @todo	Alert if the save was not successful.

		if(FrontendEditing.editWindow) {
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
var CloseAction = Class.create(EditPanelAction, {
	trigger: function($super) {
			// If this EditPanel is nested inside another, find the ID of the parent EditPanel
		if (this.parent.el.up('.feEditAdvanced-allWrapper')) {
			parentID = this.parent.el.up('.feEditAdvanced-allWrapper').id;
			formParams = '&TSFE_EDIT[parentEditPanel]=' + parentID;
		} else {
			formParams = '';
		}

		$super(formParams);
	},

	_process: function(json) {
		FrontendEditing.editWindow.close();
		
		if (json.id) {
			ep = FrontendEditing.editPanels.get(json.id);
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
			FrontendEditing.editPanels.add(nextEditPanel.id, new EditPanel(nextEditPanel));
		}
	},

	_getNotificationMessage: function() {
		return "Closing editing form";
	},

	_getCmd: function() {
		return 'close';
	}
});
var SaveAndCloseAction = Class.create(EditPanelAction, {
	trigger: function($super) {
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

			$super(formParams);
		}
	},

	_process: function(json) {
		FrontendEditing.editWindow.close();

		if (json.id) {
			ep = FrontendEditing.editPanels.get(json.id);
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
			FrontendEditing.editPanels.add(nextEditPanel.id, new EditPanel(nextEditPanel));
		}
	},

	_getNotificationMessage: function() {
		return 'Saving content.';
	},

	_getCmd: function() {
		return 'saveAndClose';
	}
});
var CopyAction = Class.create(EditPanelAction, {
	_process: function(json) {
			// put "copy" selector around
		this.parent.el.addClass('doCopy');

			// create new "copy" object in menubar clipboard
		clipboardObj = $('clipboardToolbar');
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

var CutAction = Class.create(EditPanelAction, {
	_process: function(json) {
			// put "cut" selector around
		this.parent.el.addClass('doCut');

			// create new "cut" object in menubar clipboard
		clipboardObj = $('clipboardToolbar');
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

var PasteAction = Class.create(EditPanelAction, {
	trigger: function($super) {
		formParams = this.parent.el.select('form')[1].serialize();
			// add setCopyMode
			// add sourcePointer
		$super(formParams);
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
EditPanel.addMethods({
	create: function(additionalParams) {
		action = new NewRecordAction(this);
		action.trigger(additionalParams);
	},

	edit: function() {
		action = new EditAction(this);
		action.trigger();
	},

	hide: function() {
		action = new HideAction(this);
		action.trigger();
	},
	unhide: function() {
		action = new UnhideAction(this);
		action.trigger();
	},
	remove: function() {
		action = new DeleteAction(this);
		action.trigger();
	},

	moveAfter: function(afterUID) {
		extraParam = 'TSFE_EDIT[moveAfter]='+afterUID;
		action = new MoveAfterAction(this);
		action.trigger(extraParam);
	},

	save: function() {
		action = new SaveAction(this);
		action.trigger();
	},

	close: function() {
		action = new CloseAction(this);
		action.trigger();
	},

	saveAndClose: function() {
		action = new SaveAndCloseAction(this);
		action.trigger();
	},

	cut: function() {
		action = new CutAction(this);
		action.trigger();
	},

	copy: function() {
		action = new CopyAction(this);
		action.trigger();
	},

	paste: function(additionalParams) {
		action = new PasteAction(this);
		action.trigger();
	},

	up: function(additionalParams) {
		// @todo Need possibly a MoveUpDownAction...
		action = new UpAction(this);
		action.trigger();
	},

	down: function(additionalParams) {
		action = new DownAction(this);
		action.trigger();
	}	
});


var ClipboardObj = Class.create({
	showClipboard: function(onOff) {
		if (onOff) {
			$('clipboardToolbar').show();
		} else {
			$('clibpoardToolbar').hide();
		}
	},

	addToClipboard: function(obj) {
		this.showClipboard(true);
			// create & cleanup "display" string
		strVal = obj.parent.el.select('.feEditAdvanced-contentWrapper')[0].innerHTML;
			 // strip tags
		strVal = strVal.replace(/(<([^>]+)>)/ig,"");
			 // trim spaces
		strVal = strVal.replace(/^\s+|\s+$/g, '');
			// first 12 chars
		strVal = strVal.substr(0,12);

			// determine which clip object to add to
		if (!clipboardObj.select('#clip1')[0]) {
			clipID = 'clip1';
		} else if (!clipboardObj.select('#clip2')[0]) {
			clipID = 'clip2';
		} else if (!clipboardObj.select('#clip3')[0]) {
			clipID = 'clip3';
		} else {
				 // if all are used, overwrite first one
			clipID = 'clip1';
		}
			// grab the UID (so can easily search based on this)
		if (rec = obj.parent.record) {
			splt = rec.indexOf(':');
			thisUID = rec.substr(splt+1);
		}
			// build a clipboard object that has values from content element
		pasteValues = '<input type="hidden" name="TSFE_EDIT[cmd]" value="' + obj._getCmd() + '"><input type="hidden" name="TSFE_EDIT[record]" value="' + rec + '"><input type="hidden" name="TSFE_EDIT[pid]" value="' + obj.parent.pid + '"><input type="hidden" name="TSFE_EDIT[flexformPtr]" value="' + obj.parent.flexformPtr + '"><input type="hidden" name="TSFE_EDIT[uid]" value="' + thisUID + '">';
		clearBtn = '<div class="clearBtn" id="clearBtn' + thisUID + '"> </div>';
		pasteEl = '<div class="clipContainer" id="' + clipID + '"><div class="draggable clipObj"><form name="TSFE_EDIT_FORM_' + thisUID + '">' +
					strVal + pasteValues +
					'</form></div>' + clearBtn + '</div>';
		newEl = clipboardObj.insert({'bottom': pasteEl});

			// allow to click on clear button
		thisBtn = $('clearBtn' + thisUID);
		thisBtn.observe('click', this.clickClearClipboard.bindAsEventListener(this));

			// make the element draggable
		clipObj = $(clipID);
		toolbar.addDraggable(clipObj);

	},

	clickClearClipboard: function(event) {
			// find the element that clicked on
		element = Event.findElement(event, 'div');
		this.clearClipboard(element);
	},

	clearClipboard: function(element) {

			// hide (or delete) the clipboard object
		clipObj = element.up();
		clipObj.hide();

			// clear out the marked content element
		editPanelID = $(clipObj.select('form input[name="TSFE_EDIT[record]"]')[0].getValue());
		if (editPanelID) {
			editPanelID.removeClassName('doCopy');
			editPanelID.removeClassName('doCut');
		}

		//@TODO check to see if anything on clipboard...if empty, then hide
		//this.showClipboard(false);

	}

});


var EditWindow = Class.create({
	initialize: function(editPanel) {
		this.editPanel = editPanel;

		if ($('overlay')) {
			$('overlay').remove();
		}

			// Add the overlay before the editWindow for IE.
		this.overlay = new Element('div', {'id': 'feEditAdvanced-overlay', 'style': 'display:none'});
		$(document.body).insert({'bottom': this.overlay});

		this.windowElement  = new Element('div', {'id': 'feEditAdvanced-editWindow', 'style': 'display: none'});
		$(document.body).insert({'bottom': this.windowElement});
	},

	displayLoadingMessage: function(message) {
		this._reset();

		this.windowElement.insert(new Element('div', {'id': 'feEditAdvanced-loading'}).hide());
		$('feEditAdvanced-loading').insert(new Element('h3').update(message));
		$('feEditAdvanced-loading').insert(new Element('div').insert(new Element('img', {'src': 'typo3/sysext/feeditadvanced/res/icons/spinner.gif'})));
		this._sizeAndPosition('feEditAdvanced-loading');
		$('feEditAdvanced-loading').appear();
		
		if (!this.windowElement.visible()) {
			this.show();
		}
	},
	
	displayStaticMessage: function(message) {
		this._reset();

		this.windowElement.insert(new Element('div', {'id': 'feEditAdvanced-loading'}).hide());
		closeElement   = new Element('button', {'id': 'feEditAdvanced-closeButton', 'value':' ', 'type':'submit'}).addClassName('closeAction');
		this.windowElement.insert({'top': closeElement});
		
		$('feEditAdvanced-loading').insert(new Element('h3').update(message));
		this._sizeAndPosition('feEditAdvanced-loading');
		$('feEditAdvanced-loading').appear();
		
		closeElement.observe('click', this.close.bindAsEventListener(this));
		
		if (!this.windowElement.visible()) {
			this.show();
		}
	},
	
	displayEditingForm: function(headerText, content) {
		this._reset();

		headerElement  = new Element('div', {'id': 'feEditAdvanced-editWindowHeader'}).update(headerText).hide();
		closeElement   = new Element('button', {'id': 'feEditAdvanced-closeButton', 'value':' ', 'type':'submit'}).addClassName('closeAction').hide();
		contentElement = new Element('div', {'id': 'feEditAdvanced-editWindowContent'}).hide();
		controlElement = new Element('div', {'id': 'feEditAdvanced-editWindowControls', 'style': 'width:100%; height:50px;'}).hide();

		this.windowElement.insert({'top': closeElement});
		this.windowElement.insert({'bottom': headerElement});
		this.windowElement.insert({'bottom': contentElement});

		$('feEditAdvanced-editWindowContent').update(content.stripScripts());

		this.windowElement.insert({'bottom': $('feEditAdvanced-editControls').hide()});

		this.setMaxContentSize();
		this._sizeAndPosition('feEditAdvanced-editWindowContent');

		new Effect.Parallel([
			new Effect.Appear(headerElement, {sync: true}),
			new Effect.Appear(closeElement, {sync: true}),
			new Effect.Appear(contentElement, {sync: true}),
			new Effect.Appear(controlElement, {sync: true}),
			new Effect.Appear($('feEditAdvanced-editControls'), {sync: true})
			], {
				queue: 'end'
			}
		);

		this.editPanel.createFormObservers();
		
		if (!this.windowElement.visible()) {
			this.show();
		}
	},
	
	_reset: function() {
		if ($('feEditAdvanced-editWindowContent')) {
			$('feEditAdvanced-editWindowContent').remove();
		}

		if ($('feEditAdvanced-editWindowHeader')) {
			$('feEditAdvanced-editWindowHeader').remove();
		}

		if ($('feEditAdvanced-loading')) {
			$('feEditAdvanced-loading').remove();
		}

		if ($('feEditAdvanced-editControls')) {
			$('feEditAdvanced-editControls').remove();
		}

		if ($('feEditAdvanced-closeButton')) {
			$('feEditAdvanced-closeButton').remove();
		}
	},
	
	_sizeAndPosition: function(newElement) {
		if (this.windowElement.visible()) {
			newElement = $(newElement);

			oldWidth = this.windowElement.getWidth();
			oldHeight = this.windowElement.getHeight();
			oldLeft = this.windowElement.offsetLeft;

				// @todo	Magic numbers for min width need to be removed.
			if (newElement.identify() == 'feEditAdvanced-loading') {
				newWidth = 220;
			} else {
				newWidth = 555;
			}

				// Morph from loading box dimensions to editing form dimentions, keeping center the same.
			this.windowElement.morph({
				minWidth: newWidth + 'px',
				left: (oldLeft - ((newWidth - oldWidth) / 2)) + 'px'
			});
		} else {
				// Position the editWindow in the middle of the page.
			this.windowElement.setStyle({
				'left': ((document.viewport.getWidth() - this.windowElement.getWidth()) / 2) + 'px'
			});
		}
	},
	
	_getBorder: function() {
		editWindowHeight = this.windowElement.getHeight();
		editWindowWidth = this.windowElement.getWidth();

		if ($('feEditAdvanced-editWindowContent')) {
			contentHeight = $('feEditAdvanced-editWindowContent').getHeight();
			contentWidth = $('feEditAdvanced-editWindowContent').getWidth();
		} else {
			contentHeight = $('feEditAdvanced-loading').getHeight();
			contentWidth = $('feEditAdvanced-loading').getWidth();
		}

		return {height: editWindowHeight - contentHeight, width: editWindowWidth - contentWidth};
	},

	show: function() {
		if (!this.windowElement.visible()) {
			FrontendEditing.editPanelsEnabled = false;

				// fade in overlay
			this.overlay.appear({ duration: 0.25, from:0.0, to: 0.5});
			this.windowElement.appear({ duration: 0.25, queue: 'end'});
		}
	},
	
	setMaxContentSize: function() {
		topOffset = $('feEditAdvanced-menuBar').getHeight();
		editWindowBorder = this._getBorder();

		windowHeight = document.viewport.getHeight();
		maxEditWindowHeight = windowHeight - topOffset;
		maxContentHeight = maxEditWindowHeight - editWindowBorder.height;

			// @todo	Max width is currently half the browser window.  Need to tweak this.
		windowWidth = document.viewport.getWidth();
		maxEditWindowWidth = windowWidth / 2;
		maxContentWidth = maxEditWindowWidth - editWindowBorder.width;

		$('feEditAdvanced-editWindowContent').setStyle({
			maxHeight: maxContentHeight + 'px',
			maxWidth: maxContentWidth + 'px'
		});
	},

		// @todo	Not currently working (and not called anywhere) due to timing issues.
	resize: function() {
			// determine editWindow size and location
		currentWindowHeight = document.viewport.getHeight();
		currentWindowWidth  = document.viewport.getWidth();
		currentEditWindowHeight = this.windowElement.getHeight();
		currentEditWindowWidth  = this.windowElement.getWidth();
		currentContentHeight = $('feEditAdvanced-editWindowContent').getHeight();
		currentContentWidth  = $('feEditAdvanced-editWindowContent').getWidth();
		maxEditWindowHeight = currentWindowHeight - 100;
		maxEditWindowWidth = currentWindowWidth - 100;

			// If the editWindow is too tall for the browser window, scale it down
		if (currentEditWindowHeight > maxEditWindowHeight) {
			newHeight = maxEditWindowHeight - (currentEditWindowHeight - currentContentHeight);
				// If we're making the content area smaller, we need to account for scrollbars too.
			newWidth = currentEditWindowWidth + 20;

			$('feEditAdvanced-editWindowContent').setStyle({
				height: newHeight + 'px',
				width: newWidth + 'px'
			});
		}

			// If the editWindow is too wide for the browser window, scale it down.
		if (currentEditWindowWidth > maxEditWindowWidth) {
			newWidth = maxEditWindowWidth - (currentEditWindowWidth - currentContentWidth);
			newHeight = currentEditWindowHeight + 20;
			$('feEditAdvanced-editWindowContent').setStyle({
				width: newWidth + 'px'
			});
		}

			// Center the editWindow on the page.
		this.windowElement.setStyle({
			position: 'fixed',
			top: ((currentWindowHeight / 2) - (currentEditWindowHeight / 2)) + 'px',
			left: ((currentWindowWidth / 2) - (currentEditWindowWidth / 2)) + 'px'
		});
	},

	close: function() {
		this.windowElement.shrink();
		this.overlay.fade({duration: 0.75, from: 0.5, to: 0.0, afterFinish: function() {  FrontendEditing.editWindow = null; }});
		this.windowElement.remove();

		FrontendEditing.editPanelsEnabled = true;

			// Reset elements to be validated by TBE_EDITOR.
		if (typeof(TBE_EDITOR) != "undefined") {
			TBE_EDITOR.elements = {};
			TBE_EDITOR.nested = {'field':{}, 'level':{}};
		}
	},

	hideAll: function() {
		if (this.overlay) {
			this.overlay.remove();
			this.overlay = undefined;
		}
	}
});

/*
 * Main class for storing all current values
 * relevant for frontend editing
 */
var FrontendEditing = {
	clipboard: new ClipboardObj(),
	editPanels: new Ext.util.MixedCollection(),
	editPanelsEnabled: true,
	JSHandler: new AJAXJavascriptHandler(),
	toolbar: null,
	editWindow: null,
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
		Ext.DomQuery.select('div.feEditAdvanced-allWrapper').each(function (el) {
			this.editPanels.add(el.id, new EditPanel(el));
		}, this);
	},
	
	initializeMenuBar: function() {
		this.toolbar = new Toolbar('feEditAdvanced-menuBar');
	}
};

// Set the edit panels and menu bar on window load
Ext.onReady(function() {
	FrontendEditing.init();
});


/*
 * @todo	Temporary fix for Webkit problems with tt_content:uid style IDs in CSS3 selects.
 */
Selector.addMethods({
	findElements: function(root) {
		root = root || document;
		var e = this.expression, results;

		switch (this.mode) {
			case 'selectorsAPI':
				// querySelectorAll queries document-wide, then filters to descendants
				// of the context element. That's not what we want.
				// Add an explicit context to the selector if necessary.
				if (root !== document) {
					var oldId = root.id, id = $(root).identify();
					// Use id= syntax rather than #
					e = '[id="' + id + '"] ' + e;
				}
				results = $A(root.querySelectorAll(e)).map(Element.extend);
				root.id = oldId;
				return results;
			case 'xpath':
				return document._getElementsByXPath(this.xpath, root);
			default:
				return this.matcher(root);
		}
	}
});