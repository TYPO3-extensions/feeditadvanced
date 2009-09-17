Ext.override(TYPO3.FeEdit.DropZone, {
	onDrop: function(dragSource, evt, data) {
		var linkedDragEl = Ext.get(dragSource.getEl());
		var dropZoneEl   = Ext.get(this.getEl());

		if (linkedDragEl.hasClass('feEditAdvanced-contentTypeItem')) {
			ep = FrontendEditing.editPanels.get(dropZoneEl.prev('.feEditAdvanced-allWrapper').id);
			ep.create(linkedDragEl.getAttribute('href'));
		} else if (linkedDragEl.hasClass('feEditAdvanced-allWrapper')) {
				// Move the dropped element outside the drop zone before it gets hidden.
			//linkedDragEl.setAttribute('style', '');
			linkedDragEl.insertBefore(dropZoneEl);
			// TODO: linkedDragEl.highlight({duration: 5});

			source = FrontendEditing.editPanels.get(linkedDragEl.id);
			destination = FrontendEditing.editPanels.get(linkedDragEl.prev().id);
			source.moveAfter(destination.getDestinationPointer());
		} else if (linkedDragEl.hasClass('clipObj')) {
			srcElement = linkedDragEl.select('form input.feEditAdvanced-tsfeedit-input-record').first().getValue();
			cmd = linkedDragEl.select('form input.feEditAdvanced-tsfeedit-input-cmd').first().getValue();

				// do a clear of element on clipboard
			feClipboard.clearClipboard(linkedDragEl);

				// if source is on this page, then move it
			if (srcElement) {
					// set source and destination
				source = FrontendEditing.editPanels.get(srcElement.id);
				destination = FrontendEditing.editPanels.get(dropZoneEl.prev().id);

				srcElement.removeAttribute('style');
					// do the actual cut/copy				
				if (cmd == 'cut') {
						// move the element to where it is dropped
					source.paste(destination.getDestinationPointer());
					srcElement.removeClass('doCut');
					dropZoneEl.insertAfter(srcElement);
					// TODO: draggableElement.highlight({duration: 5});

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
			alert("hmm, doesn't look like we can handle this drag. - TV");
		}
	}
});

Ext.override(TYPO3.FeEdit.EditPanel, {
	getFlexformPointer: function() {
		return this.el.select('form input.feEditAdvanced-tsfeedit-input-flexformPointer').first().getValue();
	},

	getDestinationPointer: function() {
		return this.el.select('form input.feEditAdvanced-tsfeedit-input-destinationPointer').first().getValue();
	},

	setDestinationPointer: function(destinationPointer) {
		this.el.select('form input.feEditAdvanced-tsfeedit-input-destinationPointer').first().set({'value': destinationPointer});
	},

	moveAfter: function(destinationPointerString) {
		this.setDestinationPointer(destinationPointerString);
		console.log('triggering move after action');
		action = new TYPO3.FeEdit.MoveAfterAction(this);
		action.trigger();
	}

});

TYPO3.FeEdit.MoveAfterAction = Ext.extend(TYPO3.FeEdit.EditPanelAction, {

	_process: function(json) {
		// for now, do nothing
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

FrontendEditing.addFlexformPointers = function() {
	Ext.select('input.flexformPointers').each(function(pointerElement) {
		pointerElement = Ext.get(pointerElement);
		// will be something like pages:25:sDEF:lDEF:field_content:vDEF
		var containerName = pointerElement.getAttribute('id');

		// pointerArray will be something like [1318,7,4,1313,1315,1317,1316]
		var pointerArray = pointerElement.getValue().split(',');

		// all elements in that container
		var pointerElementArray = Ext.get(pointerElement.parent()).select('.feEditAdvanced-allWrapper');
		if (pointerArray.length > 0 && pointerElementArray.getCount() > 0) {
			Ext.each(pointerArray, function(pointerValue, counter) {
				counter++;
				firstElement = Ext.get(pointerElementArray.first());
				if (firstElement) {
					recordElement = Ext.get(firstElement.select('form input.feEditAdvanced-tsfeedit-input-record').first());
					if (recordElement.getValue() == 'tt_content:' + pointerValue) {
							// flexformPointer element
						Ext.DomHelper.insertAfter(recordElement, {
							'tag':  'input',
							'type': 'hidden',
							'name': 'TSFE_EDIT[flexformPointer]',
							'cls':  'feEditAdvanced-tsfeedit-input-flexformPointer',
							'value': containerName + ':' + counter + '/tt_content:' + pointerValue
						});
							// sourcePointer element
						Ext.DomHelper.insertAfter(recordElement, {
							'tag':  'input',
							'type': 'hidden',
							'name': 'TSFE_EDIT[sourcePointer]',
							'cls':  'feEditAdvanced-tsfeedit-input-sourcePointer',
							'value': containerName + ':' + counter
						});
							// destinationPointer element
						Ext.DomHelper.insertAfter(recordElement, {
							'tag':  'input',
							'type': 'hidden',
							'name': 'TSFE_EDIT[destinationPointer]',
							'cls':  'feEditAdvanced-tsfeedit-input-destinationPointer',
							'value': containerName + ':' + counter
						});
						
							// and remove the element which is now not needed anymore
						pointerElementArray.removeElement(firstElement);
					}
				}
			});
		}
	});
};
Ext.onReady(function() {
	FrontendEditing.addFlexformPointers();
});
