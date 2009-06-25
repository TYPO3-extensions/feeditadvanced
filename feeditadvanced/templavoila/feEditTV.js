TYPO3.FeEdit.DropZone.addMethods({
	onDrop: function(dragSource, evt, data) {
		var linkedDragEl = Ext.get(dragSource.getEl());
		var dropZoneEl = Ext.get(this.getEl());

		if (linkedDragEl.hasClass('feEditAdvanced-contentTypeItem')) {
			ep = FrontendEditing.editPanels.get(dropZoneEl.prev('.feEditAdvanced-allWrapper').id);
			ep.create(linkedDragEl.getAttribute('href'));
		} else if (linkedDragEl.hasClass('feEditAdvanced-allWrapper')) {
				// Move the dropped element outside the drop zone before it gets hidden.
			linkedDragEl.setAttribute('style', '');
			dropZoneEl.insertBefore(linkedDragEl);
			// TODO: linkedDragEl.highlight({duration: 5});

			source = FrontendEditing.editPanels.get(linkedDragEl.id);
			destination = FrontendEditing.editPanels.get(linkedDragEl.prev().id);
			source.moveAfter(destination.getDestinationPointer());
		} else if (linkedDragEl.hasClass('clipObj')) {
			srcElement = linkedDragEl.select('form input[name="TSFE_EDIT[record]"]')[0].getValue();
			cmd = linkedDragEl.select('form input[name="TSFE_EDIT[cmd]"]')[0].getValue();

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
			alert("hmm, doesn't look like we can handle this drag.");
		}
	}
});

EditPanel.addMethods({
	getFlexformPointer: function() {
		return this.el.select('form input[name="TSFE_EDIT[flexformPointer]"]').first().getValue();
	},

	getDestinationPointer: function() {
		return this.el.select('form input[name="TSFE_EDIT[destinationPointer]"]').first().getValue();
	},

	setDestinationPointer: function(destinationPointer) {
		this.el.select('form input[name="TSFE_EDIT[destinationPointer]"]').first().setAttribute('value', destinationPointer);
	},

	moveAfter: function(destinationPointerString) {
		this.setDestinationPointer(destinationPointerString);
		action = new MoveAfterAction(this);
		action.trigger();
	}

});

var MoveAfterAction = Class.create(EditPanelAction, {

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
	Ext.DomQuery.select('input.flexformPointers').each(function(pointerElement) {
		var pointerElement = Ext.get(pointerElement);
		var containerName = pointerElement.id;
		var pointerArray = pointerElement.getValue().split(',');

		var pointerElementArray = pointerElement.parent().select('.feEditAdvanced-allWrapper');

		if ((pointerArray.length > 0) && pointerElementArray.length > 0) {
			var counter = 0;
			pointerArray.each(function(pointerValue) {
				counter++;
				firstElement = pointerElementArray.first();
				if (firstElement) {
					recordElement = firstElement.select('form input[name="TSFE_EDIT[record]"]').first();
					if (recordElement.getValue() == 'tt_content:' + pointerValue) {
							// flexformPointer element
						recordElement.insertAfter({
							'tag': 'input',
							'type': 'hidden',
							'name': 'TSFE_EDIT[flexformPointer]',
							'value': containerName + ':' + counter + '/tt_content:' + pointerValue
						});
							// sourcePointer element
						recordElement.insertAfter({
							'tag': 'input',
							'type': 'hidden',
							'name': 'TSFE_EDIT[sourcePointer]',
							'value': containerName + ':' + counter
						});
							// destinationPointer element
						recordElement.insertAfter({
							'tag': 'input',
							'type': 'hidden',
							'name': 'TSFE_EDIT[destinationPointer]',
							'value': containerName + ':' + counter
						});
						pointerElementArray.shift();
					}
				}
			});
		}
	});
};
Ext.onReady(FrontendEditing.addFlexformPointers, FrontendEditing);
