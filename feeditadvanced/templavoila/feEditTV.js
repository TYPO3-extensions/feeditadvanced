DropZone.addMethods({
	onDrop: function(draggableElement, droppableElement, event) {
		if (draggableElement.hasClassName('feEditAdvanced-contentTypeItem')) {
				// Small hack to insert temporary element on drop
			clonedElement = draggableElement.cloneNode(true);
			this.element.insert({bottom: clonedElement});
			ep = FrontendEditing.editPanels.get(clonedElement.up().previous().identify());
			ep.create(draggableElement.getAttribute("href"));
		} else if (draggableElement.hasClassName('feEditAdvanced-allWrapper')) {
				// Move the dropped element outside the drop zone before it gets hidden.
			draggableElement.removeAttribute('style');
			droppableElement.insert({before: draggableElement});
			draggableElement.highlight({duration: 5});

			source = FrontendEditing.editPanels.get(draggableElement.identify());
			destination = FrontendEditing.editPanels.get(draggableElement.previous().identify());
			source.moveAfter(destination.getDestinationPointer());
		} else if (draggableElement.hasClassName('clipObj')) {
			srcElement = $(draggableElement.select('form input[name="TSFE_EDIT[record]"]')[0].getValue());
			cmd = draggableElement.select('form input[name="TSFE_EDIT[cmd]"]')[0].getValue();

				// do a clear of element on clipboard
			feClipboard.clearClipboard(draggableElement);

				// if source is on this page, then move it
			if (srcElement) {
					// set source and destination
				source = FrontendEditing.editPanels.get(srcElement.identify());
				destination = FrontendEditing.editPanels.get(droppableElement.previous().identify());

				srcElement.removeAttribute('style');
					// do the actual cut/copy				
				if (cmd == 'cut') {
						// move the element to where it is dropped
					source.paste(destination.getDestinationPointer());
					srcElement.removeClassName('doCut');
					droppableElement.insert({after: srcElement});
					draggableElement.highlight({duration: 5});

						// now trigger the cut action

				}
				else if (cmd == 'copy') {
						// display the element where it is dropped
					srcElement.removeClassName('doCopy');

					clonedElement = srcElement.cloneNode(true);
					droppableElement.insert({after: clonedElement});
					newSource = FrontendEditing.editPanels.get(clonedElement.identify());
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
		return this.content.select('form input[name="TSFE_EDIT[flexformPointer]"]').first().getValue();
	},

	getDestinationPointer: function() {
		return this.content.select('form input[name="TSFE_EDIT[destinationPointer]"]').first().getValue();
	},

	setDestinationPointer: function(destinationPointer) {
		this.content.select('form input[name="TSFE_EDIT[destinationPointer]"]').first().setAttribute('value', destinationPointer);
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
	$$('input.flexformPointers').each( function(pointerElement) {
		containerName = pointerElement.identify();
		pointerArray = 	$(pointerElement).getValue().split(',');

		pointerElementArray = pointerElement.adjacent('.feEditAdvanced-allWrapper').toArray();

		if ((pointerArray.length > 0) && pointerElementArray.length > 0) {
			counter = 0;
			pointerArray.each ( function(pointerValue) {
				counter++;
				firstElement = pointerElementArray.first();
				if (firstElement) {
					recordElement = firstElement.select('form input[name="TSFE_EDIT[record]"]').first();
					if (recordElement.getValue() == 'tt_content:' + pointerValue) {
							// flexformPointer element
						recordElement.insert({'after': new Element('input', {'type': 'hidden', 'name': 'TSFE_EDIT[flexformPointer]', 'value': containerName + ':' + counter + '/tt_content:' + pointerValue})});
							// sourcePointer element
						recordElement.insert({'after': new Element('input', {'type': 'hidden', 'name': 'TSFE_EDIT[sourcePointer]', 'value': containerName + ':' + counter})});
							// destinationPointer element
						recordElement.insert({'after': new Element('input', {'type': 'hidden', 'name': 'TSFE_EDIT[destinationPointer]', 'value': containerName + ':' + counter})});

						pointerElementArray.shift();
					}
				}
			});
		}
	});
};

Event.observe(window, 'load', function() {
	FrontendEditing.addFlexformPointers();
});