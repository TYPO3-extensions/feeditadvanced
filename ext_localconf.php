<?php
if (!defined ('TYPO3_MODE')) 	die ('Access denied.');

	// Hooks to view display for advanced frontend editing
$TYPO3_CONF_VARS['SC_OPTIONS']['typo3/classes/class.frontendedit.php']['admin'] = 'EXT:fe_edit_advanced/view/class.tx_feeditadvanced_adminpanel.php:tx_feeditadvanced_adminpanel';
$TYPO3_CONF_VARS['SC_OPTIONS']['typo3/classes/class.frontendedit.php']['edit']  = 'EXT:fe_edit_advanced/view/class.tx_feeditadvanced_editpanel.php:tx_feeditadvanced_editpanel';

	// Add AJAX support
$TYPO3_CONF_VARS['FE']['eID_include']['fe_edit_advanced'] = 'EXT:fe_edit_advanced/service/ajax.php';

	// Set Language Files
	// @todo Dave: Is there a better way to do this? .php and .xml???
$TYPO3_CONF_VARS['BE']['XLLfile']['EXT:lang/locallang_tsfe.php'] = t3lib_extMgm::extPath($_EXTKEY) . "locallang.xml";
$TYPO3_CONF_VARS['BE']['XLLfile']['EXT:lang/locallang_tsfe.xml'] = t3lib_extMgm::extPath($_EXTKEY) . "locallang.xml";

	// Adds disable palettes functionality for Frontend forms
$TYPO3_CONF_VARS['SC_OPTIONS']['t3lib/class.t3lib_tceforms.php']['getMainFieldsClass'][] = 'EXT:fe_edit_advanced/view/class.tx_feeditadvanced_getMainFields_preProcess.php:tx_feeditadvanced_getMainFields_preProcess';

	// Configure settings, etc for showing the icons, menubar, and frontend forms on the page
t3lib_extMgm::addPageTSConfig('
	tx_fe_edit_advanced {
		useAjax = 1
		showIcons = edit, new, copy, cut, hide, delete, draggable
		skin {
			imageType = GIF
		}
		menuBar {
			config = action, type, clipboard, context
			typeMenu = text, header, image, html
			contextMenu = close
		}
	}
');

	// Settings needed to be forced for showing hidden records to work
t3lib_extMgm::addUserTSConfig('
	admPanel {
			display_preview = 0
			override.preview = 0
			override.edit.displayIcons = 1
			override.preview.showHiddenRecords = 1
			override.preview.showHiddenPages = 1
	}
');

?>