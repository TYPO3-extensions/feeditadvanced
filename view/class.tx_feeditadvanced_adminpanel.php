<?php
/***************************************************************
*  Copyright notice
*
*  (c) 2009 David Slayback <dave@webempoweredchurch.org>
*  (c) 2009 Jeff Segars <jeff@webempoweredchurch.org>
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

require_once(t3lib_extMgm::extPath('feeditadvanced') . 'view/class.tx_feeditadvanced_menu.php');
require_once(t3lib_extMgm::extPath('feeditadvanced') . 'view/class.tx_feeditadvanced_newcontentelements.php');

/**
 * Top menu bar for advanced frontend editing.
 *
 * @author	David Slayback <dave@webempoweredchurch.org>
 * @author	Jeff Segars <jeff@webempoweredchurch.org>
 * @package TYPO3
 * @subpackage feeditadvanced
 */
class tx_feeditadvanced_adminpanel {

	/**
	 * Admin panel related configuration.
	 *
	 * @var		array
	 */
	protected $admPanelTSconfig = array();

	/**
	 * feeditadvanced TS configuration
	 *
	 * @var 	array
	 */
 	protected $modTSconfig;

	/**
	 * Indicates whether the menu is currently open.
	 *
	 * @var		boolean
	 */
	protected $menuOpen = true;

	/**
	 * Holder of the menu bar object
	 *
	 * @var		object
	 */
	protected $menuBar = 0;

	/**
	 * Initialize the adminPanel. Handle actions here.
	 *
	 * @return	void
	 */
	public function init() {
			// general configuration
		if (empty($this->admPanelTSconfig)) {
			$this->admPanelTSconfig = t3lib_BEfunc::getModTSconfig($GLOBALS['TSFE']->id, 'admPanel');
			$this->modTSconfig = t3lib_BEfunc::getModTSconfig($GLOBALS['TSFE']->id, 'tx_feeditadvanced');
			$GLOBALS['TSFE']->determineId();
		}

			// initialize / force vars for FE Editing
		$GLOBALS['BE_USER']->adminPanel->forcePreview();
		$GLOBALS['TSFE']->displayEditIcons = true;
		$GLOBALS['TSFE']->showHiddenPage = 1;
		$GLOBALS['TSFE']->showHiddenRecords = 1;
		$GLOBALS['TSFE']->fePreview = 1;

		$this->menuOpen = (!isset($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen']) || ($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen'] !== '0')) ? true : false;
		$this->actionHandler();
	}
	
	/**
	 * Static method for displaying the top menu bar. 
	 *
	 * @note edited the method to work with better than temporarily solution.
	 *
	 * @return void
	 */
	public static function showMenuBar($params,&$parent) {
		if (is_object($GLOBALS['BE_USER']) && $GLOBALS['TSFE']->beUserLogin) {
				$adminPanel = t3lib_div::makeInstance('tx_feeditadvanced_adminpanel');
				$adminPanel->init();
				$parent->content  = str_replace('</body>',$adminPanel->display().'</body>',$parent->content);
		}
	}

	/**
	 * Handles actions passed in through TSFE_ADMIN_PANEL Form
	 *
	 * @return	void
	 */
	public function actionHandler() {
		$action = t3lib_div::_POST('TSFE_ADMIN_PANEL');
			// handle toggling the menu on and off
		if ($action && isset($action['menuOpen'])) {
			$this->menuOpen = $action['menuOpen'];
			$GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen'] = $this->menuOpen;
		}

			// hook to handle actions that define in menu
		if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']['actionHandler'])) {
			$_params = array('action' => &$action, 'pObj' => &$this);
			foreach ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']['actionHandler'] as $_funcRef) {
				t3lib_div::callUserFunction($_funcRef,$_params,$this);
			}
		}
	}

	/**
	 * Displays the admin panel...which now becomes a menu
	 *
	 * @return	string
	 */
	public function display() {
		$this->init();

			// this allows csshover.htc to be put at top of page
		$out = '<div id="bodyattach"></div>';

			// have a form for adminPanel processing and saving of vars
		$out .= '<form id="TSFE_ADMIN_PANEL_Form" name="TSFE_ADMIN_PANEL_Form" action="' . htmlspecialchars(t3lib_div::getIndpEnv('REQUEST_URI')) . '" method="post" style="margin: 0 0 0 0;">';
			// add any hidden form fields to save values
		$out .= $this->getAdmPanelFields();
		$out .= '</form>';

		$out .= '<div class="typo3-adminPanel">';

			// build the menu code here
		$out .= $this->buildMenu();
		
		$out .= '</div>';

		return $out;
	}

	/**
	 * Add all the form fields that need to be saved when doing admin panel actions
	 * Called from extPrintFeAdminDialog.
	 *
	 * @return	string
	 */
	function getAdmPanelFields() {
		$out = '
		<input type="hidden" name="TSFE_ADMIN_PANEL[edit_displayFieldIcons]" value="' . ($this->admPanelTSconfig['properties']['module.']['edit.']['forceDisplayFieldIcons'] ? 1 : 0) . '" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[edit_displayIcons]" value="' . ($this->admPanelTSconfig['properties']['module.']['edit.']['forceDisplayIcons'] ? 1 : 0) . '" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[edit_editFormsOnPage]" value="' . ($this->uc['TSFE_adminConfig']['forceFormsOnPage'] ? 1 : 0) . '" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[edit_editNoPopup]" value="' . ($this->uc['TSFE_adminConfig']['edit_editNoPopup'] ? 1 : 0) . '" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[preview_showHiddenPages]" value="1" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[preview_showHiddenRecords]" value="1" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[display_preview]" value="0" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[display_top]" value="1" />
		<input type="hidden" name="TSFE_ADMIN_PANEL[menuOpen]" value="' . $this->menuOpen . '" />
		';

			// hook to add additional hidden fields
		if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']['getAdmPanelFields'])) {
			$_params = array('input' => &$input, 'pObj' => &$this);
			foreach ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']['getAdmPanelFields'] as $_funcRef) {
				$out .= t3lib_div::callUserFunction($_funcRef,$_params,$this);
			}
		}

		return $out;
	}

	/**
	 * Builds the menu. Can hook in CSS and own menu here.
	 *
	 * @return	string		HTML to display the menu
	 */
	function buildMenu() {
		$out = '';

			// Add default CSS
		if ($this->menuOpen) {
			$cssFileName = ($cssfile = $this->modTSconfig['properties']['skin.']['cssFile']) ? $cssfile : t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/css/fe_edit_advanced.css';
		}
		else {
			$cssFileName = ($cssFile = $this->modTSconfig['properties']['skin.']['cssClosedFile']) ? $cssfile : t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/css/fe_edit_closed.css';
		}
		$out .= '<link href="' . t3lib_div::getIndpEnv('TYPO3_SITE_URL') . $cssFileName . '" rel="stylesheet" type="text/css" />';

			// Allow to hook in new menu here...will overwrite existing
		if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']['buildMenu'])) {
			$_params = array('input' => &$input, 'pObj' => &$this);
			foreach ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']['buildMenu'] as $_funcRef) {
				$menuOut = t3lib_div::callUserFunction($_funcRef,$_params,$this);
			}
		}

		if (!$menuOut) {
			$this->menuBar = t3lib_div::makeInstance('tx_feeditadvanced_menu');

				// add sections for menu
			$this->menuBar->addToolbar('Actions', 'feEditAdvanced-actionToolbar', false, '', true);
			$this->menuBar->addToolbar('ContentType', 'feEditAdvanced-contentTypeToolbar', false);
			$this->menuBar->addToolbar('ContextActions','feEditAdvanced-contextToolbar');
			$this->menuBar->addToolbar('Clipboard', 'clipboardToolbar', false, 'style="display:none;"');

				// build the menus here
			// @todo need to check permissions here too
			$tsMenuBar = $this->modTSconfig['properties']['menuBar.'];
			$menuConfig = $tsMenuBar['config'] ? t3lib_div::trimExplode(',',$tsMenuBar['config']) : array('action','type','clipboard','context');
			if (in_array('action', $menuConfig)) {
				$tsActions = t3lib_div::trimExplode(',', $tsMenuBar['actionMenu']);
				if (in_array('page', $tsActions)) $this->menuBar->addItem('Actions', 'Page', 'fePageFunctions', '', 'Page functions', '');
				if (in_array('file', $tsActions)) $this->menuBar->addItem('Actions', 'File', 'feFileFunctions', '', 'File functions', '');
				if (in_array('user', $tsActions)) $this->menuBar->addItem('Actions', 'User', 'feUserFunctions', '', 'User functions');
				if (in_array('events', $tsActions)) $this->menuBar->addItem('Actions', 'Events', 'feEventFunctions', '', 'Event functions');
				if (in_array('addplugin', $tsActions)) $this->menuBar->addItem('Actions','Add Plugin','feAddPlugin', '', 'Add Plugin', '');
				if (count($tsActions)) $this->menuBar->addItem('Actions', '', '', '', '', '', 'spacer');
			}
			
			// render new content element icons
			$this->renderNewContentElementIcons($menuConfig, $tsMenuBar);
			
			if (in_array('context', $menuConfig)) {
				$tsContext = t3lib_div::trimExplode(',', $tsMenuBar['contextMenu']);
				if (in_array('preview', $tsContext)) $this->menuBar->addItem('ContextActions', 'Preview', '', '', 'Preview this page', '', 'button disabled');
				$this->menuBar->addItem('ContextActions', 'Close', '', '', 'Close FrontEnd Editing', ' onclick="' . htmlspecialchars('document.TSFE_ADMIN_PANEL_Form.elements[\'TSFE_ADMIN_PANEL[menuOpen]\'].value=0; document.TSFE_ADMIN_PANEL_Form.submit(); return false;') . '"');
			}
			if (in_array('clipboard', $menuConfig)) {
				$this->menuBar->addItem('Clipboard', '', '', '', '', '', 'spacer');
			}

			$menuOut = $this->menuBar->build();
		}

		$out .= $menuOut;

		return $out;
	}
	
	protected function renderNewContentElementIcons($menuConfig, $tsMenuBar) {
		// get new content elements from cms wizard
		$newCE = t3lib_div::makeInstance('tx_feeditadvanced_newcontentelements');
		$newCE->main();
		
		foreach ($newCE->menuItems as $group => $items) {
			foreach ($items['ce'] as $ce) {
 				#debug(t3lib_iconWorks::skinImg('', $ce['icon'], ''));
 				$this->menuBar->addItem(
 					'ContentType', 
 					$ce['tt_content_defValues']['CType'],
 					'', 
 					'../../../../../typo3/' . $ce['icon'], 
 					'Drag widgets onto the page', 
 					'',
 					'feEditAdvanced-contentTypeItem draggable', 
 					'feEditAdvanced-buttonLabel', 
 					substr($ce['params'], 1)
 					);			
			}
		}
		
		/*
		if (in_array('type', $menuConfig)) {
				$tsType = t3lib_div::trimExplode(',', $tsMenuBar['typeMenu']);
				if (in_array('text', $tsType)) $this->menuBar->addItem('ContentType', 'Text', '', 'menubar/text.png', 'Drag widgets onto the page', '','feEditAdvanced-contentTypeItem draggable', 'feEditAdvanced-buttonLabel', 'defVals[tt_content][CType]=text');
				if (in_array('header', $tsType)) $this->menuBar->addItem('ContentType', 'Header', '', 'menubar/header.png', 'Drag widgets onto the page', '', 'feEditAdvanced-contentTypeItem draggable', 'feEditAdvanced-buttonLabel', 'defVals[tt_content][CType]=header');
				if (in_array('image', $tsType)) $this->menuBar->addItem('ContentType', 'Image', '', 'menubar/picture.png', 'Drag widgets onto the page', '', 'feEditAdvanced-contentTypeItem draggable', 'feEditAdvanced-buttonLabel', 'defVals[tt_content][CType]=image');
				if (in_array('html', $tsType)) $this->menuBar->addItem('ContentType', 'HTML', '', 'menubar/html.png', 'Drag widgets onto the page', '', 'feEditAdvanced-contentTypeItem draggable', 'feEditAdvanced-buttonLabel', 'defVals[tt_content][CType]=html');
		}
		*/
	}

}

if (defined('TYPO3_MODE') && $TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']) {
	include_once($TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/feeditadvanced/view/class.tx_feeditadvanced_adminpanel.php']);
}

?>
