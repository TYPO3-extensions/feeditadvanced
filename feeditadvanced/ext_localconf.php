<?php
if (!defined ('TYPO3_MODE')) 	die ('Access denied.');

	// Hooks to view display for advanced frontend editing
$TYPO3_CONF_VARS['SC_OPTIONS']['typo3/classes/class.frontendedit.php']['edit']  = 'EXT:feeditadvanced/view/class.tx_feeditadvanced_editpanel.php:tx_feeditadvanced_editpanel';

	// @note Changed to hook to place Code before </body> directly before output
$TYPO3_CONF_VARS['SC_OPTIONS']['tslib/class.tslib_fe.php']['contentPostProc-output'][] = 'EXT:feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php:tx_feeditadvanced_adminpanel->showMenuBar';

	// Add AJAX support
$TYPO3_CONF_VARS['FE']['eID_include']['feeditadvanced'] = 'EXT:feeditadvanced/service/ajax.php';

	// Set Language Files
	// @todo Dave: Is there a better way to do this? .php and .xml???
$TYPO3_CONF_VARS['BE']['XLLfile']['EXT:lang/locallang_tsfe.php'] = t3lib_extMgm::extPath($_EXTKEY) . "locallang.xml";
$TYPO3_CONF_VARS['BE']['XLLfile']['EXT:lang/locallang_tsfe.xml'] = t3lib_extMgm::extPath($_EXTKEY) . "locallang.xml";

	// Adds disable palettes functionality for Frontend forms
$TYPO3_CONF_VARS['SC_OPTIONS']['t3lib/class.t3lib_tceforms.php']['getMainFieldsClass'][] = 'EXT:feeditadvanced/view/class.tx_feeditadvanced_getMainFields_preProcess.php:tx_feeditadvanced_getMainFields_preProcess';

	// Configure settings, etc for showing the icons, menubar, and frontend forms on the page
t3lib_extMgm::addPageTSConfig('
	FeEdit {
		#possible disable complete with set FeEdit.disable=1
		disable = 0
		
		useAjax = 1
		showIcons = edit, new, copy, cut, hide, delete, draggable
		skin {
			#cssFile = typo3/sysext/feeditadvanced/res/feedit.css
			#templateFile = EXT:feeditadvanced/res/template/feedit.tmpl
			
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
			override.edit.displayIcons = 0
			override.preview.showHiddenRecords = 1
			override.preview.showHiddenPages = 1
	}
');

	// Temporary home for TemplaVoila changes to make testing easier. Should eventually be rolled into TemplaVoila itself.
if (t3lib_extMgm::isLoaded('templavoila')) {
		// XCLASS for necessary code changes in tx_templavoila_pi1->renderElement.
	$TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/templavoila/pi1/class.tx_templavoila_pi1.php'] = t3lib_extMgm::extPath('feeditadvanced').'templavoila/class.ux_tx_templavoila_pi1.php';

		// TemplaVoila frontend editing controller is the default when TemplaVoila is installed.
	t3lib_extMgm::addPageTSConfig('TSFE.frontendEditingController = templavoila');

		// Register the TemplaVoila frontend editing controller.
	$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['t3lib/class.t3lib_tsfebeuserauth.php']['frontendEditingController']['templavoila'] = 'EXT:feeditadvanced/templavoila/class.tx_templavoila_frontendedit.php:tx_templavoila_frontendedit';

		// Needs to be included to avoid errors when editing page properties.
	include_once(t3lib_extMgm::extPath('templavoila').'class.tx_templavoila_handlestaticdatastructures.php');
}

?>