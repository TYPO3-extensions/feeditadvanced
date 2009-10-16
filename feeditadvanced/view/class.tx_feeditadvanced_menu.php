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
 * @subpackage feeditadvanced
 */
class tx_feeditadvanced_menu {
	/**
    * local copy of cObject to perform various template operations
    * @var         array
    */
	protected $cObj = 0;
	
	/**
	 * template for edit panel
	 * @var		string
	 */
	protected $templateCode = '';


	// @todo	Add docs for the member variables.
	protected $menuOpen;

	/**
	 * Initializes the menu.
	 *
	 * @return	void
	 * @todo	Any reason this isn't a constructor?
	 */
	public function init() {
		$this->pid = $GLOBALS['TSFE']->id;
		$this->getUserListing();
		$this->modTSconfig = t3lib_BEfunc::getModTSconfig($GLOBALS['TSFE']->id,'FeEdit');
		
		$this->menuOpen = (!isset($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen']) || ($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen'] !== '0')) ? true : false;
		$this->username = $GLOBALS['TSFE']->fe_user->user['username'] ? $GLOBALS['TSFE']->fe_user->user['username'] : $GLOBALS['BE_USER']->user['username'];
		
		$imgPath = $this->modTSconfig['properties']['skin.']['imagePath'];
		$this->imagePath = $imgPath  ? $imgPath : t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/icons/';
		
		  	// loading template
		$this->cObj = t3lib_div::makeInstance('tslib_cObj');
		$this->template = ($templateFile = $this->modTSconfig['properties']['skin.']['templateFile']) ? $templateFile : t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/template/feedit.tmpl';
		$this->template = $this->cObj->fileResource($this->template);
		
      $this->templateCode = $this->cObj->getSubPart($this->template , '###MENU_'. ( $this->menuOpen ? 'OPENED' : 'CLOSED' ) .'###' );
            
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
		        $markerArray['ON_CLICK'] = htmlspecialchars('document.TSFE_ADMIN_PANEL_Form.elements[\'TSFE_ADMIN_PANEL[menuOpen]\'].value=1; document.TSFE_ADMIN_PANEL_Form.submit(); return false;');
		        $markerArray['OPEN_EDIT_MODE'] = $this->extGetLL('openEditMode');
		        $menuOut = $this->cObj->substituteMarkerArray($this->templateCode ,$markerArray,'###|###');
 		} else {
				// else if open...

				// @todo Temporary code to draw and "Edit Page" button.
				// @todo does not work by now
			$data = $GLOBALS['TSFE']->page;
			$this->cObj->start($data, 'pages');
			$markerArray['PAGE_EDIT_PANEL'] = $this->cObj->editPanel('',array('allow'=>'edit,new,delete,hide'));
				
				// show all sections and accompanying items that are in the first row
			$sectionParts = $this->cObj->getSubpart($this->templateCode ,'###SECTIONS_FIRST_ROW###');
			$sectionTemp = $this->cObj->getSubpart($sectionParts,'###SECTION###');
			$itemTemp = $this->cObj->getSubpart($sectionParts,'###SINGLE_ITEM###');
			$itemSeparator = $this->cObj->getSubpart($sectionParts,'###SEPARATOR###');
			
			$subPartArray['SECTIONS_FIRST_ROW'] = '';
			for ($i = 0; $i < count($this->sections); $i++) {
				$sec = $this->sections[$i];
				if (($total = count($this->itemList[$sec['name']])) && ($sec['firstRow'] == true)) {
					$sectionArray['SECTION_CSSID'] = $sec['cssID'];
					$sectionArray['SECTION_EXTRACSS'] = ($sec['extraCSS'] ? $sec['extraCSS'] : '');
					$sectionArray['SECTION_ITEMS']='';
					for ($j = 0; $j < $total; $j++) {
						$itemArray= array();
						if ($sec['useSeparator']) {
					 		$itemArray['ITEM_SEPARATOR'] .= $itemSeparator;
						} else {
							$itemArray['ITEM_SEPARATOR'] = '';
						}
						$itemArray['ITEM_NAME'] .= $this->itemList[$sec['name']][$j];
						$sectionArray['SECTION_ITEMS'] .= $this->cObj->substituteMarkerArray($itemTemp,$itemArray,'###|###');
					}
					$subPartArray['SECTIONS_FIRST_ROW'] .= $this->cObj->substituteMarkerArray($sectionTemp,$sectionArray,'###|###');
				}
			}

				// show all sections and accompanying items that are in the second row.
			$subPartArray['SECTIONS_SECOND_ROW'] = '';
			for ($i = 0; $i < count($this->sections); $i++) {
				$sec = $this->sections[$i];
				if (($total = count($this->itemList[$sec['name']])) && ($sec['firstRow'] == false)) {
						$sectionArray['SECTION_CSSID'] = $sec['cssID'];
					$sectionArray['SECTION_EXTRACSS'] = ($sec['extraCSS'] ? $sec['extraCSS'] : '');
					$sectionArray['SECTION_ITEMS']='';
					for ($j = 0; $j < $total; $j++) {
						$itemArray= array();
						if ($sec['useSeparator']) {
					 		$itemArray['ITEM_SEPARATOR'] .= $itemSeparator;
						} else {
							$itemArray['ITEM_SEPARATOR'] = '';
						}
						$itemArray['ITEM_NAME'] .= $this->itemList[$sec['name']][$j];
						$sectionArray['SECTION_ITEMS'] .= $this->cObj->substituteMarkerArray($itemTemp,$itemArray,'###|###');
					}
					$subPartArray['SECTIONS_SECOND_ROW'] .= $this->cObj->substituteMarkerArray($sectionTemp,$sectionArray,'###|###');
				}
			}

				// add section = showing users online
			if ($this->userList) {
				$subPartArray['USERLISTING'] = $this->cObj->getSubpart($this->templateCode ,'###USERLISTING###');
				$subPartArray['USERLISTING'] = $this->cObj->substituteMarkerArray($subPartArray['USERLISTING'], array('USER_LIST' => $this->userList,'USER_LABEL'=> $this->extGetLL('usersOnPage')),'###|###'); ;
			} else {
				$subPartArray['USERLISTING'] = '';
			}
			$markerArray['EXT_PATH'] = t3lib_extMgm::siteRelPath('feeditadvanced');
			foreach ($subPartArray AS $key => $content) {
				$this->templateCode = $this->cObj->substituteSubpart($this->templateCode ,'###' . $key . '###',$content);
			}
			$menuOut = $this->cObj->substituteMarkerArray($this->templateCode ,$markerArray,'###|###');
		
				// hook to add additional menu features, including a sidebar
			if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_menu.php']['build'])) {
				$_params = array('menuOut' => &$menuOut, 'pObj' => &$this);
				foreach ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_menu.php']['build'] as $_funcRef) {
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
		$imageCode = strlen($image) ? '<img src="' . (($this->imagePath ? $this->imagePath : t3lib_extMgm::siteRelPath('feeditadvanced')."res/icons/") . $image) .'" />' : '';
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
	
	protected function getUserListing() {
		$records = $GLOBALS['TYPO3_DB']->exec_SELECTgetRows(
			'locks.*, user.realName',
			'sys_lockedrecords AS locks LEFT JOIN be_users AS user ON locks.userid=user.uid',
			'locks.userid!='.intval($GLOBALS['BE_USER']->user['uid']).'
			AND locks.tstamp > '.($GLOBALS['EXEC_TIME']-2*3600) .' 
			AND ( (locks.record_pid='.intval($this->pid) .' AND  locks.record_table!=\'pages\') OR
			(locks.record_uid='.intval($this->pid) .' AND  locks.record_table=\'pages\') )'
			);
		$oldUser = 0;
		$user = 0;
		$userList = array();
		$openedRecords = array();
		if (is_array($records)) {
			foreach($records AS $lockedRecord) {
				$user = $lockedRecord['userid'];
				
				if($user != $oldUser) {
					$userList[$user] = ($lockedRecord['realName'] != '' ? $lockedRecord['realName'] : $lockedRecord['username']);
					$openedRecords[$user] = array('page' => 99999999999, 'content' => 99999999999, 'data' =>99999999999);		
				}
				switch ($lockedRecord['record_table']) {
					case 'pages':
						if( $lockedRecord['tstamp'] < $openedRecords[$user]['page'] ) {
							$openedRecords[$user]['page'] = $lockedRecord['tstamp'];
						}
						break;
					case 'tt_content':
						if( $lockedRecord['tstamp'] < $openedRecords[$user]['content'] ) {
							$openedRecords[$user]['content'] = $lockedRecord['tstamp'];
						}
					default:
						if( $lockedRecord['tstamp'] < $openedRecords[$user]['data'] ) {
							$openedRecords[$user]['data'] = $lockedRecord['tstamp'];
						}
						break;
				}
				$oldUser = $user;	
			}
		}
		$renderedListing = array();
		foreach($userList AS $userID => $userName) {
			if ($openedRecords[$userID]['page'] < 99999999999) {
				$time = $openedRecords[$userID]['page'];
				$openedRecords[$userID]['page'] = 'Page-Information (since ';
				$openedRecords[$userID]['page'] .= t3lib_BEfunc::calcAge($GLOBALS['EXEC_TIME']-$time, $GLOBALS['LANG']->sL('LLL:EXT:lang/locallang_core.php:labels.minutesHoursDaysYears'));
				$openedRecords[$userID]['page'] .= ')';
			} else {
				unset($openedRecords[$userID]['page']);
			}
			if ($openedRecords[$userID]['content'] < 99999999999) {
				$time = $openedRecords[$userID]['content'];
				$openedRecords[$userID]['content'] = 'Contents (since ';
				$openedRecords[$userID]['content'] .= t3lib_BEfunc::calcAge($GLOBALS['EXEC_TIME']-$time, $GLOBALS['LANG']->sL('LLL:EXT:lang/locallang_core.php:labels.minutesHoursDaysYears'));
				$openedRecords[$userID]['content'] .= ')';
			} else {
				unset($openedRecords[$userID]['content']);
			}
			if ($openedRecords[$userID]['data'] < 99999999999) {
				$time = $openedRecords[$userID]['data'];
				$openedRecords[$userID]['data'] = 'Data (since ';
				$openedRecords[$userID]['data'] .= t3lib_BEfunc::calcAge($GLOBALS['EXEC_TIME']-$time, $GLOBALS['LANG']->sL('LLL:EXT:lang/locallang_core.php:labels.minutesHoursDaysYears'));
				$openedRecords[$userID]['data'] .= ')';
			} else {
				unset($openedRecords[$userID]['data']);
			}
			$message = $userName. ' currently editing: '. implode(', ',$openedRecords[$userID]);
		
			$renderedListing[$userID] = '<span title="'. $message . '">';
			$renderedListing[$userID] .= $userName;
			$renderedListing[$userID] .= '</span>';
		}
		
		$this->userList = implode(', ',$renderedListing);
	}
			
}

if (defined('TYPO3_MODE') && $TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/feeditadvanced/view/class.tx_feeditadvanced_menu.php']) {
	include_once($TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/feeditadvanced/view/class.tx_feeditadvanced_menu.php']);
}

?>
