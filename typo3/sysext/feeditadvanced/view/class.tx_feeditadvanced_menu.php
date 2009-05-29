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

/**
 * Menu for advanced frontend editing.
 *
 * @author	David Slayback <dave@webempoweredchurch.org>
 * @author	Jeff Segars <jeff@webempoweredchurch.org>
 * @package TYPO3
 * @subpackage fe_edit_advanced
 */
class tx_feeditadvanced_menu {

	// @todo	Add docs for the member variables.
	protected $menuOpen;

	/**
	 * Initializes the menu.
	 *
	 * @return	void
	 * @todo	Any reason this isn't a constructor?
	 */
	public function init() {
		$this->menuOpen = (!isset($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen']) || ($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen'] !== '0')) ? true : false;
		$this->username = $GLOBALS['TSFE']->fe_user->user['username'] ? $GLOBALS['TSFE']->fe_user->user['username'] : $GLOBALS['BE_USER']->user['username'];
		$imgPath = $this->modTSconfig['properties']['skin.']['imagePath'];
		$this->imagePath = $imgPath  ? $imgPath : t3lib_extMgm::siteRelPath('fe_edit_advanced') . 'res/icons/';
	}

	/**
	 * @todo	What does this do?
	 *
	 * @return	string
	 */
	public function build() {
		$this->init();

			// if not open, then just show "open edit"  box
		if (!$this->menuOpen) {
			$menuOut = '
				<div id="feEditAdvanced-menuBar" class="closedMenu">
					<a class="feEditAdvanced-smallButton" href="#" onclick="' .
					   htmlspecialchars('document.TSFE_ADMIN_PANEL_Form.elements[\'TSFE_ADMIN_PANEL[menuOpen]\'].value=1; document.TSFE_ADMIN_PANEL_Form.submit(); return false;').
					'" title="Close FrontEnd Editing">' . $this->extGetLL('openEditMode') . '
					</a>
				</div>';
 		} else {
				// else if open...

			$menuOut = '<div id="feEditAdvanced-menuBar">';

			$menuOut .= '<div class="feEditAdvanced-firstRow">';
			
			
			$menuOut .= '<div class="feEditAdvanced-menuToolbar">';

				// @todo Temporary code to draw and "Edit Page" button.
			require_once(PATH_tslib . 'class.tslib_content.php');
			$cObj = t3lib_div::makeInstance('tslib_cObj');
			$data = $GLOBALS['TSFE']->page;
			$cObj->start($data, 'pages');
			$menuOut .= $cObj->editPanel('', array(
				'allow' => 'edit',
				'template' => t3lib_extMgm::siteRelPath('fe_edit_advanced') . 'res/template/feedit_page.tmpl'
			));

			$menuOut .= '</div>';
			
				// show all sections and accompanying items that are in the first row
			for ($i = 0; $i < count($this->sections); $i++) {
				$sec = $this->sections[$i];
				if (($total = count($this->itemList[$sec['name']])) && ($sec['firstRow'] == true)) {
					$menuOut .= '<div id="'.$sec['cssID'] . '" class="feEditAdvanced-menuToolbar" ' . ($sec['extraCSS'] ? $sec['extraCSS'] : '') . '>';
					for ($j = 0; $j < $total; $j++) {
						if ($sec['useSeparator']) {
					 		$menuOut .= '<span class="separatorBar"> </span>';
						}
						$menuOut .= $this->itemList[$sec['name']][$j];
					}
					$menuOut .= '</div>';
				}
			}
			$menuOut .= '</div>';

			$menuOut .= '<div class="feEditAdvanced-secondRow">';
				// show all sections and accompanying items that are in the second row.
			for ($i = 0; $i < count($this->sections); $i++) {
				$sec = $this->sections[$i];
				if (($total = count($this->itemList[$sec['name']])) && ($sec['firstRow'] == false)) {
					$menuOut .= '<div id="'.$sec['cssID'] . '" class="feEditAdvanced-menuToolbar" ' . ($sec['extraCSS'] ? $sec['extraCSS'] : '') . '>';
					for ($j = 0; $j < $total; $j++) {
						if ($sec['useSeparator']) {
					 		$menuOut .= '<span class="separatorBar"> </span>';
						}
						$menuOut .= $this->itemList[$sec['name']][$j];
					}
					$menuOut .= '</div>';
				}
			}

				// add section = showing users online
			if ($this->userList) {
				$menuOut .= '<span class="feEditAdvanced-menuUserlist">Users on page: <span id="menu_userlisting">' . $this->userList . '</span></span>';
			}

			$menuOut .= '<span class="feEditAdvanced-logo"><a href="http://www.typo3.com/"><img src="' . t3lib_extMgm::siteRelPath('fe_edit_advanced') . '/res/icons/typo3logo_mini_transparent.gif" /></a></span>';
			$menuOut .= '</div>';
			$menuOut .= '</div>'; // end div menubar

				// hook to add additional menu features, including a sidebar
			if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/fe_edit_advanced/view/class.tx_feeditadvanced_menu.php']['build'])) {
				$_params = array('menuOut' => &$menuOut, 'pObj' => &$this);
				foreach ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/fe_edit_advanced/view/class.tx_feeditadvanced_menu.php']['build'] as $_funcRef) {
					$menuOut = t3lib_div::callUserFunction($_funcRef,$_params,$this);
				}
			}
		}

		return $menuOut;
	}

	/**
	 * @todo	Add documentation
	 */
	public function addToolbar($name, $cssID=0, $useSeparator=0, $extraCSS='', $firstRow = false) {
		$this->sections[] = array('name' => $name, 'cssID' => $cssID, 'useSeparator' => $useSeparator, 'extraCSS' => $extraCSS, 'firstRow' => $firstRow);
	}

	/**
	 * @todo	Add documentation
	 */
	function addItem($sec, $name, $action, $image, $title='', $onclick='', $btnClass='feEditAdvanced-button', $labelClass='feEditAdvanced-feEditAdvanced-buttonText', $additionalParams='') {
		$actionCode = strlen($action) ? ' id="' . $action . '"' : '';
		$btnClassCode = strlen($btnClass) ? ' class="' . $btnClass . '"' : '';
		$titleCode = strlen($title) ? ' title="' . $title . '"' : '' ;
		$imageCode = strlen($image) ? '<img src="' . (($this->imagePath ? $this->imagePath : t3lib_extMgm::siteRelPath('fe_edit_advanced')."res/icons/") . $image) .'" />' : '';
		$labelCode = strlen($labelClass) ? ' class="' . $labelClass . '"' : '';
		$this->itemList[$sec][] =
			'<a href="' . $additionalParams . '"' . $actionCode . $btnClassCode . $titleCode . '' . $onclick . '>' .
				 $imageCode .
				'<span' . $labelCode . '>' . $name . '</span>
			</a>';
	}

	/**
	 * @todo	Add documentation
	 */
	function addItemCode($sec, $code) {
		$this->itemList[$sec][] = $code;
	}

	/**
	 * Returns the label for key, $key. If a translation for the language set in $GLOBALS['BE_USER']->uc['lang'] is found that is returned, otherwise the default value.
	 * IF the global variable $GLOBALS['LOCAL_LANG'] is NOT an array (yet) then this function loads the global $GLOBALS['LOCAL_LANG'] array with the content of "sysext/lang/locallang_tsfe.php" so that the values therein can be used for labels in the Admin Panel
	 *
	 * @param	string		Key for a label in the $GLOBALS['LOCAL_LANG'] array of "sysext/lang/locallang_tsfe.php"
	 * @return	string		Label text
	 */
	protected function extGetLL($key)	{
		if (!is_array($GLOBALS['LOCAL_LANG'])) {
			$GLOBALS['LANG']->includeLLFile('EXT:lang/locallang_tsfe.php');
			if (!is_array($GLOBALS['LOCAL_LANG'])) {
				$GLOBALS['LOCAL_LANG'] = array();
			}
		}
			// Label string in the default backend output charset.
		$labelStr = htmlspecialchars($GLOBALS['LANG']->getLL($key));
		if ($labelStr) {
				// Convert to utf-8, then to entities:
			if ($GLOBALS['LANG']->charSet != 'utf-8') {
				$labelStr = $GLOBALS['LANG']->csConvObj->utf8_encode($labelStr,$GLOBALS['LANG']->charSet);
			}
			$labelStr = $GLOBALS['LANG']->csConvObj->utf8_to_entities($labelStr);
		}

			// Return the result
		return $labelStr;
	}

}

if (defined('TYPO3_MODE') && $TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/fe_edit_advanced/view/class.tx_feeditadvanced_menu.php']) {
	include_once($TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/fe_edit_advanced/view/class.tx_feeditadvanced_menu.php']);
}

?>