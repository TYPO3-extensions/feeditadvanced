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

	// Class for Toolbars and Draggable Widgets within the toolbars.
var Toolbar = Class.create({
	initialize: function(toolbarElement) {
		toolbarElement = $(toolbarElement);
		this.widgets = new Array();

			// Create all the draggable buttons in the toolbar
		toolbarElement.select('.draggable').each((function(draggableElement) {
			this.widgets.push(new ToolbarWidget(draggableElement));
		}).bind(this));
	},

	addDraggable: function(toolbarElement) {
		toolbarElement.select('.draggable').each((function(draggableElement) {
			this.widgets.push(new ToolbarWidget(draggableElement));
		}).bind(this));
	}

});
var ToolbarWidget = Class.create({
	initialize: function(draggableElement) {

			// Override clicks on any elements that are also draggable. This may eventually trigger an add in the main content area instead.
		draggableElement.observe('click', function(event) { Event.stop(event);});

			// Create a Draggable for the toolbar widget.
		new Draggable(draggableElement, {
			ghosting: true,
			revert: true,
			scroll: window,
				// @todo	The z-index is set to 0 so that an inline style isn't added when an invalid drop occurs.
			zindex: 0,	

			reverteffect: function (element, top_offset, left_offset) {
				new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: 0,
					queue: {scope:'_draggable', position:'end'}
				});
			},

				// Enable drop indicators when a drag is started.
			onStart: function(element, event) {
				editPanelsEnabled = false;
				editPanels.each(function(hashItem) {
					(hashItem.value).addDropZone();
				});
			},

				// Disable drop indicators when a drag is done
			onEnd: function(element, event) {
				editPanelsEnabled = true;
				editPanels.each(function(hashItem) {
					panel = hashItem.value;
					panel.enableHoverMenu();
					panel.removeDropZone();
				});
			}
		});
	}
});

	// Object for notification popups. Creating a new instances triggers the popup.
var FrontendEditNotification = Class.create({
	initialize: function(content) {
			// Changing addClassName call to work around IE8 problems.
		this.notificationElement = new Element(
			'div',
			{'style': 'display: none;'}
		).addClassName('notificationMsg').update(content);

		body = $(document.getElementsByTagName('body')[0]);
		body.insert(this.notificationElement);
		this.notificationElement.appear({ duration: 0.75 });
	},

	hide: function() {
		this.notificationElement.fade({ duration: 0.35});
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
			if (TBE_EDITOR != undefined) {
				var ajaxSubmitForm = function() {
					if (TBE_EDITOR.doSaveFieldName) {
						document[TBE_EDITOR.formname][TBE_EDITOR.doSaveFieldName].value=1;
					}
					editPanels.get($(TBE_EDITOR.formname).up().up().identify()).save();
				};
				TBE_EDITOR.submitForm = ajaxSubmitForm;
			}
		}
	}

});

	// Object for an entire content element and its EditPanel.
var EditPanel = Class.create({

	initialize: function(wrapperElement) {
		this.content = $(wrapperElement);
		this.hoverMenuEnabled = true;
		this.getFormParameters();
		this.setupEventListeners();
		
		if (this.content.hasClassName('draggable')) {
			this.sortable = true;
			this._makeDraggable();
		}
		
		if (this.content.hasClassName('alwaysVisible')) {
			this.alwaysVisible = true;
		}
		
		if (!this.next()) {
			this.hideDownButton();
		}
		
		if (!this.previous()) {
			this.hideUpButton();
		}
	},
	
	addDropZone: function() {
		if(this.sortable) {
			this.dropZone = new DropZone(this);
		}
	},

	removeDropZone: function() {
		if(this.sortable && this.dropZone) {
			this.dropZone.remove();
		}
	},

	getFormParameters: function() {
			// Extract values from hidden form fields
		this._extraElements = new Array();
		this.content.select('form')[0].select('input').each(( function(formElement) {
			switch(formElement.readAttribute('name')) {
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
		}).bind(this));
		this.params = Form.serializeElements(this._extraElements);
	},
	
	_makeDraggable: function() {
			// Make the edit panel draggable
		new Draggable(this.content, {
			revert: 'failure',
			scroll: window,
				// @todo	The z-index is set to 0 so that an inline style isn't added when an invalid drop occurs.
			zindex: 0,
			delay: 100,

			reverteffect: function (element, top_offset, left_offset) {
				new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: 0,
					queue: {scope:'_draggable', position:'end' },
					afterFinish: function() {
						editPanelsEnabled = true;
					}
				});
			},
				// Hide hover menus on drag.
			onStart: function(draggableElement, event) {
				editPanelsEnabled = false;
				editPanels.each(function(hashItem) {
					panel = hashItem.value;
					panel.hideMenu();
					panel.disableHoverMenu();

						// Don't add a drop zone under the element being dragged.
					if (draggableElement.element.identify() != panel.content.identify()) {
						panel.addDropZone();
					}
				});
			},

				// Disable drop indicators when a drag is done
			onEnd: function(draggableElement, event) {
				//editPanelsEnabled = true;
				editPanels.each(function(hashItem) {
					panel = hashItem.value;
					panel.enableHoverMenu();
					panel.removeDropZone();
				});
			},

			onDrag: function(draggableElement, event) {
				if(event) {
					Position.prepare();
					var point = [Event.pointerX(event), Event.pointerY(event)];
				
					Droppables.drops.each( function(drop) {
						if(!Droppables.isAffected(point, draggableElement, drop)) {
							drop.element.setStyle({height: 'auto'});
						}
					});
				}
			}
		});
	},

	_handleButtonClick: function(event) {
		eventElement = $(Event.element(event));
		if (eventElement.hasClassName('editBtn') ||
		    eventElement.hasClassName('actionBtn') ||
			(eventElement.identify() == 'closeButton')) {
			element = eventElement;
		} else {
			element = eventElement.up('.actionBtn, .editBtn');
		}

		if(element) {
			if (element.hasClassName('editAction')) {
				this.edit();
			} else if (element.hasClassName('upAction')) {
				this.up();
			} else if (element.hasClassName('downAction')) {
				this.down();
			} else if (element.hasClassName('newRecordAction')) {
				this.create();
			} else if (element.hasClassName('hideAction')) {
				this.hide();
			} else if (element.hasClassName('unhideAction')) {
				this.unhide();
			} else if (element.hasClassName('deleteAction')) {
				this.remove();
			} else if (element.hasClassName('saveAction')) {
				this.save();
			} else if (element.hasClassName('saveCloseAction')) {
				this.saveAndClose();
			} else if (element.hasClassName('closeAction')) {
				this.close();
			} else if (element.hasClassName('cutAction')) {
				this.cut();
			} else if (element.hasClassName('copyAction')) {
				this.copy();
			}
		}
		
		Event.stop(event);
		return false;
	},

	showMenu: function(event) {
		if (!this.hoverMenuAlwaysVisible && editPanelsEnabled && this.hoverMenuEnabled) {
			this.content.select('div.editPanelDiv')[0].show();
			this.content.addClassName('allWrapperHover');
		}

		if (event != undefined) {
			Event.stop(event);
		}
	},

	hideMenu: function(event) {
		if (!this.hoverMenuAlwaysVisible) {
			this.content.select('div.editPanelDiv')[0].hide();
			this.content.removeClassName('allWrapperHover');
		}
		
		if (event != undefined) {
			Event.stop(event);
		}
	},

	editClick: function(event) {
			// if in middle of dragging, exit
		if (!editPanelsEnabled || !this.hoverMenuEnabled) {
			return;
		}
			// make sure on valid element
		element = Event.element(event);
		if (element.hasClassName('editableOnClick') || element.up('div.editableOnClick')) {
			this.edit();
		}

		if (event != undefined) {
			Event.stop(event);
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
		return this.content.select('div.editPanelDiv')[0].visible();
	},

	createFormObservers: function() {
		this.content.select('form').each((function(element) {
			element.removeAttribute('onsubmit');
			element.observe('submit', function(event) { Event.stop(event); });
		}).bind(this));

			// Buttons at the bottom of the edit window
		this.content.select('#editControls button').each((function(button) {
			button.observe('click', this._handleButtonClick.bindAsEventListener(this));
		}).bind(this));

			// Close button in the top right corner of the edit window
		$('closeButton').observe('click', this._handleButtonClick.bindAsEventListener(this));
	},

	setupEventListeners: function() {
			// Show and hide the menu based on mouseovers
		this.content.observe('mouseover', this.showMenu.bindAsEventListener(this));
		this.content.observe('mouseout', this.hideMenu.bindAsEventListener(this));
		
		editPanelToolbar = this.content.firstDescendant();

			// Set up event handlers for the hover menu buttons
		editPanelToolbar.select('.editBtn').each((function(button) {
			button.observe('click', this._handleButtonClick.bindAsEventListener(this));
		}).bind(this));

			// Setup event handler for edit on click
		if (editPanelToolbar.next('.editableOnClick')) {
			editPanelToolbar.next('.editableOnClick').observe('click', this.editClick.bindAsEventListener(this));
		} else {
				// Not editable on click means there's no visible content and so the hover menu should always be visible.
			this.hoverMenuAlwaysVisible = true;
		}
	},
	
	replaceContent: function(newContent) {
		id = this.content.identify();
		this.content.replace(newContent);
		this.content = $(id);
	},
	
	removeContent: function() {
		this.content.remove();
		this.content = null;
	},
	
	previous: function() {
		return this.content.previous();
	},
	
	next: function() {
		return this.content.next();
	},
	
	hideUpButton: function() {
		this.content.select('input.upAction').invoke('hide');
	},
	
	hideDownButton: function() {
		this.content.select('input.downAction').invoke('hide');
	}

});

var DropZone = Class.create({
	initialize: function(editPanel) {
			//  Use an ID that relate the dropzone element back to the edit panel.
		dropZoneElement = new Element('div', {
			'id': 'dropzone-' + editPanel.content.identify()
		}).addClassName('dropzone').update('<span class="dropzone-left"></span><span class="dropzone-center"> </span><span class="dropzone-right"></span>');

			// Insert the drop zone after the edit panel.
		editPanel.content.insert({'after': dropZoneElement});

		this.element = dropZoneElement;
		this._makeDroppable();
	},
	
	remove: function() {
		if(this.element && this.element.parentNode) {
			this.element.remove();
		}
	},

	_makeDroppable: function() {
		Droppables.add(this.element, {
			hoverclass: 'dropzone-active',
			overlap: 'vertical',
			onDrop: this.onDrop.bind(this),
			onHover: this.onHover.bind(this)
		});
	},

	onDrop: function(draggableElement, droppableElement, event) {
		if (draggableElement.hasClassName('contentTypeItem')) {
				// Small hack to insert temporary element on drop
			clonedElement = draggableElement.cloneNode(true);
			this.element.insert({'bottom': clonedElement});
			ep = editPanels.get(clonedElement.up().previous().identify());
			ep.create(draggableElement.getAttribute("href"));
		} else if (draggableElement.hasClassName('allWrapper')) {
				// Move the dropped element outside the drop zone before it gets hidden.
			draggableElement.removeAttribute('style');
			droppableElement.insert({'before': draggableElement});
			draggableElement.highlight({duration: 3});

			source = editPanels.get(draggableElement.identify());
			destination = editPanels.get(draggableElement.previous().identify());

			recordFields = destination.record;
			recordFields = recordFields.split(':');
			moveAfterUID = recordFields[1];
			source.moveAfter(moveAfterUID);
		} else if (draggableElement.hasClassName('clipObj')) {
			srcElement = $(draggableElement.select('form input[name="TSFE_EDIT[record]"]')[0].getValue());
			cmd = draggableElement.select('form input[name="TSFE_EDIT[cmd]"]')[0].getValue();

				// do a clear of element on clipboard
			feClipboard.clearClipboard(draggableElement);

				// if source is on this page, then move it
			if (srcElement) {
					// set source and destination
				source = editPanels.get(srcElement.identify());
				destination = editPanels.get(droppableElement.previous().identify());

				srcElement.removeAttribute('style');
					// do the actual cut/copy
				if (cmd == 'cut') {
						// move the element to where it is dropped
					source.paste(destination.getDestinationPointer());
					srcElement.removeClassName('doCut');
					droppableElement.insert({'after': srcElement});
					draggableElement.highlight({duration: 5});

						// now trigger the cut action

				}
				else if (cmd == 'copy') {
						// display the element where it is dropped
					srcElement.removeClassName('doCopy');

					clonedElement = srcElement.cloneNode(true);
					droppableElement.insert({'after': clonedElement});
					newSource = editPanels.get(clonedElement.identify());
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

		// New elements are inserted on hover.
	onHover: function(draggableElement, droppableElement, overlap) {
			// If we're hovering over ourself, stop
		if (draggableElement.parentNode.identify() == droppableElement.identify()) {
			return;
		}

			// If we're hovering over a dropzone, make the dropzone large enough to accomodate the element
		if (draggableElement.hasClassName('allWrapper')) {
			draggableHeight = draggableElement.getHeight() + 'px';
			droppableElement.setStyle({height: draggableHeight});
		}
	},

	show: function() {
		this.element.appear();
	},

	hide: function() {
		this.element.fade();
	}
});

	// Define classes for each edit action
var EditPanelAction = Class.create({
	initialize: function(parent) {
		this.parent = parent;
		this.cmd = this._getCmd();
	},

	trigger: function(additionalParams) {
			// handle timeouts
		//this.setupTimer();
		if (actionRunning) {
			var waitNotification = new FrontendEditNotification(this._getAlreadyProcessingMsg());
			return;
		}
		actionRunning = true;

		this.parent.getFormParameters();
		var notification = new FrontendEditNotification(this._getNotificationMessage());
		paramRequest = 'eID=fe_edit_advanced' + '&TSFE_EDIT[cmd]=' + this.cmd + '&TSFE_EDIT[record]=' + this.parent.record + '&pid=' + this.parent.pid;
		if (this.parent.params != undefined && this.parent.params != 0) {
			paramRequest += '&' + this.parent.params;
		}

		if (additionalParams != undefined) {
			paramRequest += '&' + additionalParams;
		}

			// now do the AJAX request
		new Ajax.Request(
			'index.php', {
				method: 'post',
				parameters: paramRequest,
				requestHeaders: { Accept: 'application/json' },
				onComplete: function(xhr) {
					actionRunning = false;
					notification.hide();
					if (waitNotification) {
						waitNotification.hide();
					}
					this._handleResponse(xhr);
				}.bind(this),
				onError: function(xhr) {
					actionRunning = false;
					notification.hide();
					alert('AJAX error: ' + xhr.responseText);
				}.bind(this)
		});
	},
	
	_handleResponse: function(xhr) {
		if (xhr.responseText.isJSON()) {
			var json = xhr.responseText.evalJSON(true);
				// @todo	Figure out how to handle errors.
			if (json.error) {
				alert(json.error);
			} else {
				if (json.content) {
					content = json.content;
					json.content = content.stripScripts();
				}
				
				if (json.newContent) {
					newContent = json.newContent;
					json.newContent = newContent.stripScripts();
				}
				
				id = this.parent.content.identify();
				this._process(json);
				this.parent.content = $(id);
				
				if (json.content) {
					JSHandler.evaluate(content);
				}
				
				if (json.newContent) {
					JSHandler.evaluate(newContent);
				}
			}
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
var NewRecordAction = Class.create(EditPanelAction, {
	_process: function (json) {
		editWindow = new Lightbox(this.parent, 'New Content Block', json.content);
		editWindow.show();
	},

	_getCmd: function() {
		return 'new';
	},

	_getNotificationMessage: function() {
		return "Loading editing form.";
	}
});

var EditAction = Class.create(EditPanelAction, {
	_process: function(json) {
		editWindow = new Lightbox(this.parent, 'Edit Content Block', json.content);
		editWindow.show();
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
	}
});
var HideAction = Class.create(EditPanelAction, {
	_process: function(json) {
		this.parent.content.addClassName('hiddenElement');
		this.parent.content.select('input.hideAction')[0].hide();
		this.parent.content.select('input.unhideAction')[0].show();
	},

	_getCmd: function() {
		return 'hide';
	},

	_getNotificationMessage: function() {
		return "Hiding content.";

	}
});
var UnhideAction = Class.create(EditPanelAction, {
	_process: function(json) {
		this.parent.content.removeClassName('hiddenElement');
		this.parent.content.select('input.unhideAction')[0].hide();
		this.parent.content.select('input.hideAction')[0].show();
	},

	_getCmd: function() {
		return 'unhide';
	},

	_getNotificationMessage: function() {
		return "Unhiding content.";
	}
});

var UpAction = Class.create(EditPanelAction, {
	trigger: function($super) {
		previousEditPanel = this.parent.previous();
		if (previousEditPanel) {
			previousEditPanel.insert({'before': this.parent.content});
			$super();
		}
	},
	
	_process: function(json) {
		editPanelsEnabled = true;
	},

	_getNotificationMessage: function() {
		return "Moving content.";
	},

	_getCmd: function() {
		return 'up';
	}
});

var DownAction = Class.create(EditPanelAction, {
	trigger: function($super) {
		nextEditPanel = this.parent.next();
		if (nextEditPanel) {
			nextEditPanel.insert({'after': this.parent.content});
			$super();
		}
	},
	
	_process: function(json) {
		editPanelsEnabled = true;
	},

	_getNotificationMessage: function() {
		return "Moving content.";
	},

	_getCmd: function() {
		return 'down';
	}
});

var MoveAfterAction = Class.create(EditPanelAction, {
	_process: function(json) {
			// allow to edit again
		editPanelsEnabled = true;
	},

	_getNotificationMessage: function() {
		return "Moving content.";
	},

	_getCmd: function() {
		return 'moveAfter';
	}
});
var SaveAction = Class.create(EditPanelAction, {
	trigger: function($super) {
			// Set the doSave element.
		this.parent.content.select('input[name="TSFE_EDIT[doSave]"]').each(function(element) {
			element.writeAttribute("value", 1);
		});

		if (TBE_EDITOR.checkSubmit(1)) {
			formParams = $('editWindow').select('form')[0].serialize();
			$super(formParams);
		}
	},

	_process: function(json) {
		// @todo	Alert if the save was not successful.

		if(editWindow) {
			editWindow.updateContent(json.content);
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
		editWindow.close();

			// If this EditPanel is nested inside another, find the ID of the parent EditPanel
		if (this.parent.content.up('.allWrapper')) {
			parentID = this.parent.content.up('.allWrapper').identify();
			formParams = '&TSFE_EDIT[parentEditPanel]=' + parentID;
		} else {
			formParams = '';
		}

		$super(formParams);
	},

	_process: function(json) {
		if (json.id) {
			ep = editPanels.get(json.id);
			ep.replaceContent(json.content);
			scanForEditPanels();
		} else {
			this.parent.replaceContent(json.content);
			this.parent.setupEventListeners();
		}
		
		if (json.newUID) {
				// Insert the HTML and register the new edit panel.
			this.parent.content.insert({'after': json.newContent});
			nextEditPanel = this.parent.content.next('div.allWrapper');
			editPanels.set(nextEditPanel.identify(), new EditPanel(nextEditPanel));
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
		this.parent.content.select('input[name="TSFE_EDIT[doSave]"]').each(function(element) {
			element.writeAttribute("value", 1);
		});

		if (TBE_EDITOR.checkSubmit(1)) {
			formParams = $('editWindow').select('form')[0].serialize();
			editWindow.close();

				// If this EditPanel is nested inside another, find the ID of the parent EditPanel
			if (this.parent.content.up('.allWrapper')) {
				parentID = this.parent.content.up('.allWrapper').identify();
				formParams += '&TSFE_EDIT[parentEditPanel]=' + parentID;
			}

			$super(formParams);
		}
	},

	_process: function(json) {

		if (json.id) {
			ep = editPanels.get(json.id);
			ep.replaceContent(json.content);
			scanForEditPanels();
		} else {
			this.parent.replaceContent(json.content);
			this.parent.setupEventListeners();
		}

		if (json.newUID) {
				// Insert the HTML and register the new edit panel.
			this.parent.content.insert({'after': json.newContent});
			nextEditPanel = this.parent.content.next('div.allWrapper');
			editPanels.set(nextEditPanel.identify(), new EditPanel(nextEditPanel));
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
		this.parent.content.addClassName('doCopy');

			// create new "copy" object in menubar clipboard
		clipboardObj = $('clipboardToolbar');
		if (clipboardObj) {
			feClipboard.addToClipboard(this);
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
		this.parent.content.addClassName('doCut');

			// create new "cut" object in menubar clipboard
		clipboardObj = $('clipboardToolbar');
		if (clipboardObj) {
			feClipboard.addToClipboard(this);
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
		formParams = this.parent.content.select('form')[1].serialize();
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
		strVal = obj.parent.content.select('.cWrapper')[0].innerHTML;
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


var Lightbox = Class.create({
	initialize: function(editPanel, headerText, content) {
		this.editPanel = editPanel;
		
			// Add the overlay before the editWindow for IE.
		this.hideAll();
		overlay = new Element('div', {'id': 'overlay', 'style': 'display:none'});
		$(document.body).insert({'bottom': overlay});
		
		headerElement  = new Element('div', {'id': 'editWindowHeader'}).update(headerText);
		closeElement   = new Element('button', {'id': 'closeButton', 'value':' ', 'type':'submit'}).addClassName('closeAction');
		contentElement = new Element('div', {'id': 'editWindowContent'});
		controlElement = new Element('div', {'id': 'editWindowControls', 'style': 'width:100%; height:50px'});

		this.windowElement  = new Element('div', {'id': 'editWindow', 'style': 'display: none'});
		this.windowElement.insert({'top': closeElement});
		this.windowElement.insert({'bottom': headerElement});
		this.windowElement.insert({'bottom': contentElement});

		$(document.body).insert({'bottom': this.windowElement});

		this.updateContent(content);
	},
	
	updateContent: function(content) {
			// Get rid of any edit controls that already exist.
		editButtons = $('editControls');
		if (editButtons) {
			editButtons.remove();
		}

		$('editWindowContent').update(content.stripScripts());

			// Move new edit controls to bottom
			// @todo	Can we change HTML output to support this out of the box?
		editButtons = $('editControls');
		if (editButtons) {
			editButtons.remove();
			this.windowElement.insert({'bottom': editButtons});
		}
		
		this.editPanel.createFormObservers();
	},

	show: function() {
		editPanelsEnabled = false;
			
			// fade in overlay
		$('overlay').appear({ duration: 0.25, from:0.0, to: 0.5});
		//$('overlay').show();
			// grow in lightbox window
		//this.windowElement.grow({direction: 'center', duration: 0.5});
		this.windowElement.show();
		this.setMaxContentSize();
	},
	
	setMaxContentSize: function() {
		windowHeight = document.viewport.getHeight();
		lightboxHeight = this.windowElement.getHeight();
		contentHeight = $('editWindowContent').getHeight();
		maxLightboxHeight = windowHeight - 100;
		maxContentHeight = maxLightboxHeight - (lightboxHeight - contentHeight);
		
			// @todo	Max width is currently half the browser window.  Need to tweak this.
		windowWidth = document.viewport.getWidth();
		lightboxWidth = this.windowElement.getWidth();
		contentWidth = $('editWindowContent').getWidth();
		maxLightboxWidth = windowWidth / 2;
		maxContentWidth = maxLightboxWidth - (lightboxWidth - contentWidth);

		$('editWindowContent').setStyle({
			maxHeight: maxContentHeight + 'px',
			maxWidth: maxContentWidth + 'px'
		});
	},

		// @todo	Not currently working (and not called anywhere) due to timing issues.
	resize: function() {
			// determine lightbox size and location
		currentWindowHeight = document.viewport.getHeight();
		currentWindowWidth  = document.viewport.getWidth();
		currentLightboxHeight = this.windowElement.getHeight();
		currentLightboxWidth  = this.windowElement.getWidth();
		currentContentHeight = $('editWindowContent').getHeight();
		currentContentWidth  = $('editWindowContent').getWidth();
		maxLightboxHeight = currentWindowHeight - 100;
		maxLightboxWidth = currentWindowWidth - 100;

			// If the lightbox is too tall for the browser window, scale it down
		if (currentLightboxHeight > maxLightboxHeight) {
			newHeight = maxLightboxHeight - (currentLightboxHeight - currentContentHeight);
				// If we're making the content area smaller, we need to account for scrollbars too.
			newWidth = currentLightboxWidth + 20;

			$('editWindowContent').setStyle({
				height: newHeight + 'px',
				width: newWidth + 'px'
			});
		}

			// If the lightbox is too wide for the browser window, scale it down.
		if (currentLightboxWidth > maxLightboxWidth) {
			newWidth = maxLightboxWidth - (currentLightboxWidth - currentContentWidth);
			newHeight = currentLightboxHeight + 20;
			$('editWindowContent').setStyle({
				width: newWidth + 'px'
			});
		}

			// Center the lightbox on the page.
		this.windowElement.setStyle({
			position: 'fixed',
			top: ((currentWindowHeight / 2) - (currentLightboxHeight / 2)) + 'px',
			left: ((currentWindowWidth / 2) - (currentLightboxWidth / 2)) + 'px'
		});
	},

	close: function() {
		this.windowElement.shrink();
		$('overlay').fade({duration: 0.75, from: 0.5, to: 0.0});
		$('editWindow').remove();
		
		editPanelsEnabled = true;
		
			// Reset elements to be validated by TBE_EDITOR.
		if (TBE_EDITOR != undefined) {
			TBE_EDITOR.elements = {};
			TBE_EDITOR.nested = {'field':{}, 'level':{}};
		}
	},

	hideAll: function() {
		if ($('overlay')) {
			$('overlay').remove();
		}
	}
});

/*-----------------------------------------------------------------------------------------------*/

var feClipboard = new ClipboardObj();
var editPanels = new Hash();
var editPanelsEnabled = true;
var JSHandler = new AJAXJavascriptHandler();
var toolbar;
var editWindow;
var actionRunning = false;

	// @todo	We eventually want to encapsulate this in a class or something, but it
	//			gives us a quick way to re-register all EditPanels when new content is added.
function scanForEditPanels() {
	// Create all the EditPanels and stick them in an array
	$$('div.allWrapper').each(function (element) {
		editPanels.set(element.identify(), new EditPanel(element));
	});
}
	// Set the edit panels and menu bar on window load
	//	Note: dom:loaded was not used because did not work for IE6/IE7 as of Prototype v1.6.0.2
Event.observe(window, 'load', function() {
	scanForEditPanels();
	toolbar = new Toolbar('menubar');
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