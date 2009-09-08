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

require_once(t3lib_extMgm::extPath('feeditadvanced') . 'view/class.tx_feeditadvanced_tceforms.php');

/**
 * Edit panel for advanced frontend editing.
 *
 * @author	David Slayback <dave@webempoweredchurch.org>
 * @author	Jeff Segars <jeff@webempoweredchurch.org>
 * @package TYPO3
 * @subpackage feeditadvanced
 */
class tx_feeditadvanced_editpanel {

	/**
	 * local copy of cObject to perform various template operations
	 * @var		array
	 */
	protected $cObj = 0;

	/**
	 * Edit panel items.
	 * @var		array
	 */
	protected $panelItems = array();

	/**
	 * Default Image path (for skinning)
	 * @var 	string
	 */
	protected $imagePath = '';

	/**
	 * feeditadvanced TS configuration from admPanel
	 * @var		array
	 */
	protected $modTSconfig = 0;

	/**
	 * template for edit panel
	 * @var		string
	 */
	protected $templateCode = '';

	/**
	 * Indicates if mod was disabled
	 *
	 * @var		boolean
	 */
	protected $disabled = false;
	
	/**
	 * Initializes the edit panel.
	 *
	 * @param		array 	configuration array
	 * @return		void
	 */
	public function init($conf) {
			// If init has already been called, then return...
		if (!empty($this->modTSconfig)) {
			return;
		}

		$this->modTSconfig = t3lib_BEfunc::getModTSconfig($GLOBALS['TSFE']->id,'FeEdit');
		if ($this->modTSconfig['properties']['disable']) {
			$this->disabled = true;
			return;
		}
			// set defaults for showIcons otherwise is set by $conf['allow']
		if (!$this->modTSconfig['properties']['showIcons']) {
			$this->modTSconfig['properties']['showIcons'] = 'edit,move,new,copy,cut,hide,delete,drag,draggable';
		}

			// image path for frontend editing related images - edit panel and edit icon icons
		$imgPath = $this->modTSconfig['properties']['skin.']['imagePath'];
		$this->imagePath = $imgPath  ? $imgPath  : t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/icons/';

			// load in the template
		$this->cObj = t3lib_div::makeInstance('tslib_cObj');
		$templateFile = ($conf['template']) ? $conf['template'] : $this->modTSconfig['properties']['skin.']['templateFile'];
		if (!$templateFile) {
			$templateFile = t3lib_extMgm::siteRelPath('feeditadvanced') . "res/template/feedit.tmpl";
		}
		
		$this->template = $this->cObj->fileResource($templateFile);
		$this->templateAction = ( $code = $this->cObj->getSubpart($this->template, '###EDITPANEL_ACTION_'.strtoupper($this->table). '###') != '' ? $code : $this->cObj->getSubpart($this->template, '###EDITPANEL_ACTION###') );

			// need to set this, otherwise do not see edit icons or process them right
		$GLOBALS['TSFE']->displayEditIcons = true;
			// otherwise forms not on page
		$GLOBALS['BE_USER']->uc['TSFE_adminConfig']['edit_editFormsOnPage'] = true;
			// otherwise do not see hidden records
		$GLOBALS['TSFE']->showHiddenRecords = true;

		$this->addIncludes();
	}

	/**
	 * Generates the "edit panels" which can be shown for a page or records on a page when the Admin Panel is enabled for a backend users surfing the frontend.
	 * With the "edit panel" the user will see buttons with links to editing, moving, hiding, deleting the element
	 * This function is used for the cObject EDITPANEL and the stdWrap property ".editPanel"
	 *
	 * @param	string		A content string containing the content related to the edit panel. For cObject "EDITPANEL" this is empty but not so for the stdWrap property. The edit panel is appended to this string and returned.
	 * @param	array		TypoScript configuration properties for the editPanel
	 * @param	string		The "table:uid" of the record being shown. If empty string then $this->currentRecord is used. For new records (set by $conf['newRecordFromTable']) it's auto-generated to "[tablename]:NEW"
	 * @param	array		Alternative data array to use. Default is $this->data
	 * @return	string		The input content string with the editPanel appended. This function returns only an edit panel appended to the content string if a backend user is logged in (and has the correct permissions). Otherwise the content string is directly returned.
	 * @link http://typo3.org/doc.0.html?&tx_extrepmgm_pi1[extUid]=270&tx_extrepmgm_pi1[tocEl]=375&cHash=7d8915d508
	 */
	public function editPanel($content, array $conf, $currentRecord='', array $dataArr=array(), $table='', $allow='', $newUID=0, array $hiddenFields=array()) {
		// if fe editing is inactive, then just show content
		if (isset($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen']) && ($GLOBALS['BE_USER']->uc['TSFE_adminConfig']['menuOpen'] == 0))  {
			return $content;
		}
		// extract $table and $uid from current record
		if (!$currentRecord) {
			$currentRecord=$this->currentRecord;
		}
		list($table,$uid) = explode(':', $currentRecord);
		$this->table = $table;
		
		$this->init($conf);
		if ($this->disabled) {
			return;
		}

			// Special content is about to be shown, so the cache must be disabled.
		$GLOBALS['TSFE']->set_no_cache();

			// Build all the necessary variables
		$markerArray = array();
		$subpartMarker = array();

		$formName = 'TSFE_EDIT_FORM_' . substr($GLOBALS['TSFE']->uniqueHash(), 0, 4);
		$actionURL = (t3lib_div::_GP('eID') == 'feeditadvanced') ? '/' : htmlspecialchars(t3lib_div::getIndpEnv('REQUEST_URI'));
		$markerArray['###FORM_NAME###'] = $formName;
		$markerArray['###FORM_URL###'] = $actionURL;
		$markerArray['###FORM_ENCTYPE###'] = $GLOBALS['TYPO3_CONF_VARS']['SYS']['form_enctype'];
		$markerArray['###FORM_ONSUBMIT###'] = 'return TBE_EDITOR.checkSubmit(1);';
		//$markerArray['###FORM_START###'] = '<form name="' . $markerArray['###FORM_NAME###'] . '" id="' . $markerArray['###FORM_NAME###'] . '" action="' . $markerArray['###FORM_URL###'] . '" method="post" enctype="' . $markerArray['###FORM_ENCTYPE###'] . '" class="feEditAdvanced-editPanelForm"  onsubmit="' . $markerArray['###FORM_ONSUBMIT###'] . '">';
		//$markerArray['###FORM_END###'] = '</form>';
		$markerArray['###FORM_CONTENT###'] = ' ';

			// put this in var for easy access
		$TSFE_EDIT = $GLOBALS['BE_USER']->frontendEdit->TSFE_EDIT;

			// set command
		if (is_array($TSFE_EDIT) && ($TSFE_EDIT['record'] == $currentRecord) && !$TSFE_EDIT['update_close']) {
			$theCmd =$TSFE_EDIT['cmd'];
		} else {
			$theCmd = '';
		}

		
			// @todo button order? $allowOrder?
		$btnOrder = $this->modTSconfig['properties']['showIcons'] ? $this->modTSconfig['properties']['showIcons'] : $conf['allow'];
		$allowOrder = t3lib_div::trimExplode(',', $btnOrder, 1);

			// generate the panel items, unless this is a new or edit command
		if (($theCmd != 'edit') && ($theCmd != 'new')) {
			$panel = '';
			if (isset($allow['edit'])) {
				if ($content) {
					$markerArray['###CWRAPPER_CLASS###'] .= ' feEditAdvanced-editButton editAction';
					$this->panelItems['editClick'] = 'value="' . $GLOBALS['BE_USER']->extGetLL('editIcon') . '" title="' . $GLOBALS['BE_USER']->extGetLL('editTitle') . '" ';
				}
				
				$this->panelItems['edit'] = $this->editIconLinkWrap('edit', 'editIcon', 'editTitle');
			}
			$sortField = $GLOBALS['TCA'][$table]['ctrl']['sortby'];
			if (isset($allow['move']) && $sortField && $GLOBALS['BE_USER']->workspace===0)	{	// Hiding in workspaces because implementation is incomplete
				$this->panelItems['up'] 	= $this->editIconLinkWrap('up', 'upIcon', 'upTitle', '');
				$this->panelItems['down'] 	= $this->editIconLinkWrap('down', 'downIcon', 'downTitle', '');
				$this->panelItems['drag'] 	= '<span class="feEditAdvanced-dragHandle" title="' . $GLOBALS['BE_USER']->extGetLL('dragTitle') . '"></span>';
				$this->panelItems['draggable'] = ' draggable';
			}
				// Hiding in workspaces because implementation is incomplete, Hiding for localizations because it is unknown what should be the function in that case
			$hideField = $GLOBALS['TCA'][$table]['ctrl']['enablecolumns']['disabled'];
			if (isset($allow['hide']) && $hideField && $GLOBALS['BE_USER']->workspace === 0 && !$dataArr['_LOCALIZED_UID']) {
				$this->panelItems['hide'] 	= $this->editIconLinkWrap('hide',   'hideIcon',   'hideTitle',    $dataArr[$hideField] ? 'style="display:none"' : '');
				$this->panelItems['unhide'] = $this->editIconLinkWrap('unhide', 'unhideIcon', 'unhideTitle', !$dataArr[$hideField] ? 'style="display:none"' : '');
			}
			if (isset($allow['new'])) {
				if ($table=='pages') {
					$this->panelItems['new'] = $this->editIconLinkWrap('newPage', 'newPageIcon', 'newPageTitle');
				} else {
					$this->panelItems['new'] = $this->editIconLinkWrap('newRecord',  'newRecordIcon', 'newRecordTitle');
				}
			}
				// Hiding in workspaces because implementation is incomplete, Hiding for localizations because it is unknown what should be the function in that case
			if (isset($allow['delete']) && ($GLOBALS['BE_USER']->workspace === 0) && !$dataArr['_LOCALIZED_UID']) {
				$this->panelItems['delete'] = $this->editIconLinkWrap('delete','deleteIcon','deleteTitle');
			}

				// Allow cut, copy, and paste
			if (isset($allow['paste'])) {
				$this->panelItems['copy'] 	= $this->editIconLinkWrap('copy','copyIcon', 'copyTitle');
				$this->panelItems['cut'] 	= $this->editIconLinkWrap('cut', 'cutIcon', 'cutTitle');
			}

				// hook to add any hidden fields
			$hiddenFieldString = '';
			if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_editpanel.php']['addHiddenFields'])) {
				foreach  ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_editpanel.php']['addHiddenFields'] as $classRef) {
					$hookObj= &t3lib_div::getUserObj($classRef);
					if (method_exists($hookObj, 'addHiddenFields'))
						$hiddenFieldString .= $hookObj->addHiddenFields($dataArr);
				}
			}

				// build hidden fields output based on what is passed in
			foreach ($hiddenFields as $name => $value) {
				$hiddenFieldString .= '<input type="hidden" name="TSFE_EDIT[' . $name . ']" value="' . $value . '"/>' . chr(10);
			}

				// Add hidden fields with necessary data
			$hiddenFieldString .= '	<input type="hidden" name="TSFE_EDIT[cmd]" class="feEditAdvanced-tsfeedit-input-cmd" value="" />
			<input type="hidden" name="TSFE_EDIT[record]" class="feEditAdvanced-tsfeedit-input-record" value="' . $currentRecord . '" />
			<input type="hidden" name="TSFE_EDIT[pid]" class="feEditAdvanced-tsfeedit-input-pid" value="' . $GLOBALS['TSFE']->id . '" />';
			$markerArray['###FORM_HIDDENFIELDS###'] = $hiddenFieldString;
		}

			// add the content. For 'new', we just want the form, not the header since it is embedded in the content
		if ($theCmd != 'new') {
			$markerArray['###CONTENT_ELEMENT###'] = trim($content);
		}

			// wrap the editPanel around the content
		$markerArray = $this->wrapContent($markerArray, $table, $uid, $dataArr, $conf, $allowOrder, $theCmd, $newUID, $fieldList);
			// clear out any unused marker sections
		if (!strlen($markerArray['###FORM_CONTENT###'])) {
			$subpartMarker['###HOVERFORM###'] = '';
		}
		if (!strlen($markerArray['###EDITFORM_CONTENT###'])) {
			$subpartMarker['###EDITFORM###'] = '';
		}

			// load in template for edit panel
			// if special template for table is present, use it, else use default
		$templateEditPanel = ( $code = $this->cObj->getSubpart($this->template, '###EDITPANEL_'.strtoupper($table).'###')) ? $code : $this->cObj->getSubpart($this->template, '###EDITPANEL###');

			// then substitute all the markers in the template into appropriate places
		$output = $this->cObj->substituteMarkerArrayCached($templateEditPanel, $markerArray, $subpartMarker, array());

			// clear out any empty template fields
		$output = preg_replace('/###[A-Za-z_1234567890]+###/', '', $output);
			// and any start & end comments @todo -- how to make more efficient
		$output = preg_replace('/<!--([\s]*?)start([\s]*?)-->/', '', $output);
		$output = preg_replace('/<!--([\s]*?)end([\s]*?)-->/', '', $output);

		return $output;
	}

	/**
	 * Helper function for editPanel() which wraps icons in the panel in a link with the action of the panel.
	 *
	 * @param	string		The command of the link. There is a predefined list available: edit, new, up, down etc.
	 * @param	string		Text string to show in button
	 * @param	string		The title/help string for the button
	 * @param	string		Parameters to add to the <input>.
	 * @return	string
	 * @see	editPanel(), editIcons(), t3lib_tsfeBeUserAuth::extEditAction()
	 */
	protected function editIconLinkWrap($cmd, $name='', $title='', $params='') {
		$name  = strlen($name)  ? $GLOBALS['BE_USER']->extGetLL($name)  : $cmd;
		$title = strlen($title) ? $GLOBALS['BE_USER']->extGetLL($title) : $name;
		$markerArray['###ACTION_CLASS###'] = $cmd . 'Action';
		$markerArray['###ACTION_VALUE###'] = $name;
		$markerArray['###ACTION_LABEL###'] = $title;
		$markerArray['###ACTION_PARAMS###'] = $params;
		$editIconStr = $this->cObj->substituteMarkerArrayCached($this->templateAction, $markerArray, array(), array());

		return $editIconStr;
	}

	/**
	 * Additional function for special rendering for the frontend editing mode 'Forms on page'
	 * This functions adds wraps for the content and for some records possible to edit content just clicking the content somewhere
	 *
	 * @param	string		The marker array to fill in
	 * @param	string		The "table" of the record being processed by the panel.
	 * @param	string		The "uid" of the record.
	 * @param	array		The "data" array of the record.
	 * @param	array		The configuration passed
	 * @param	array		Allowed order of each action/panelItem
	 * @param	string		The current command
	 * @param	string		new uid, if it is a new content element
	 * @param	string		field list
	 * @see	editPanel(), editIcons(), t3lib_tsfeBeUserAuth::extEditAction()
	 */
 	protected function wrapContent($markerArray, $table, $uid, array $recordData=array(), array $conf=array(), array $allowOrder=array(), $theCmd='', $newUID='', $fieldList='') {
		$editpanelItems = '';
			// Put the edit panel items in given order
		/*
		if (is_array($this->panelItems)) {
			$whichOrder = is_array($allowOrder) ? $allowOrder : $this->panelItems;
			foreach($whichOrder as $item => $value) {
				$isThere = array_key_exists($value,$this->panelItems);
				
					// expand hide to hide + unhide
				if ($isThere && ($value == 'hide') && isset($this->panelItems['hide'])) {
					$editpanelItems .= $this->panelItems['hide'] . $this->panelItems['unhide'];
				} elseif ($isThere && ($value != 'editClick') && ($value != 'draggable')) {
					$editpanelItems .= $this->panelItems[$value];
				}
				// expand move to up + down
				elseif ($value == 'move' && (isset($this->panelItems['up']) || isset($this->panelItems['down']))) {
					$editpanelItems .= $this->panelItems['up'] . $this->panelItems['down'] . $this->panelItems['drag'];
				}
			}
		}
		*/
		
		if (is_array($this->panelItems)) {
			$allowed = array();
			$panelItems = $this->panelItems;
			if (is_array($allowOrder)) {
				foreach ($allowOrder as $key) {
					if (array_key_exists($key, $panelItems)) {
						$editpanelItems .= $this->addAction($key);
						unset($panelItems[$key]);
						if ($key == 'hide') {
							unset($panelItems['unhide']);
						}
						if ($key == 'move') {
							unset($panelItems['up']);
							unset($panelItems['down']);
							unset($panelItems['drag']);
						}
					}
				}
			}
			
			foreach ($panelItems as $key => $panelItem) {
				$editpanelItems .= $this->addAction($key);
			}
		}
		
		
		if ($recordData['hidden']) {
			$markerArray['###ALLWRAPPER_CLASS###'] .= ' feEditAdvanced-hiddenElement';
		}
		if (isset($this->panelItems['editClick']) && !empty($this->panelItems['editClick'])) {
			if ($this->panelItems['editClick'] != 'return false;') {
				$markerArray['###CWRAPPER_CLASS###'] .= ' editableOnClick';
				$markerArray['###CWRAPPER_EXTRA###'] .= $this->panelItems['editClick'];
			}
		}
		if (isset($this->panelItems['draggable'])) {
			$markerArray['###ALLWRAPPER_CLASS###'] .= $this->panelItems['draggable'];
		}

		$wrapperID = $table . ':' . $uid;
		$markerArray['###EDITPANEL_ID###'] = $wrapperID;

			// if edit or new, then add the form on page
		if ($theCmd=='edit' || $theCmd=='new') {
			if ($theCmd == 'edit') {
				$markerArray['###CONTENT_ELEMENT###'] = '';
			}
			$markerArray = $this->formsOnPageForm($markerArray,$table, $recordData, $currentRecord, $conf, $content, $theCmd, $newUID, $fieldList);
		} else {
				// fill in the markers
			$markerArray['###EDITPANEL_ACTIONS###'] = $editpanelItems;
		}

		return $markerArray;
	}
	
	protected function addAction($key) {
		switch ($key) {
			case 'hide':
				$content = $this->panelItems['hide'] . $this->panelItems['unhide'];
				break;
			case 'move':
				$content = $this->panelItems['up'] . $this->panelItems['down'] . $this->panelItems['drag'];
				break;
			case 'editClick':
			case 'draggable':
				// Do nothing
				break;
			default:
				$content = $this->panelItems[$key];
		}

		return $content;
	}


	/**
	 * Special rendering for the frontend editing mode 'Forms on page'
	 *
	 * @param	array		The marker array of content
	 * @param	string		The "table" of the record being processed by the panel.
	 * @param	string		The "uid" of the record.
	 * @param	array		The "data" array of the record.
	 * @param	array		The panelItems which have been set
	 * @param	array		The configuration passed
	 * @param	array		Allowed order of each action/panelItem
	 * @param	string		The current command
	 * @param	string		new uid, if it is a new content element
	 * @param	string		field list
	 * @see	editPanel(), editIcons(), t3lib_tsfeBeUserAuth::extEditAction()
	 */
	protected function formsOnPageForm($markerArray, $table, $dataArr=array(), $currentRecord='', $conf='', $content='', $theCmd='edit', $newUID='', $fieldList='') {
			// change some TCA for this editing mode - must use here because tceforms related hook is not available for edit icons
		tx_feeditadvanced_tceforms::changeTCAforFormsOnPage($GLOBALS['TCA'],$table);

			 // configuration for edit panels
		$formOnPageConf = $GLOBALS['TSFE']->tmpl->setup[$table . '.']['stdWrap.']['editPanel.'];

			// hook to add additional JavaScript or CSS to the HEAD section of the page
		if (isset($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['tslib/class.tslib_content.php']['addAdditionalHeaderDataForFormsOnPage']) && is_array ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['tslib/class.tslib_content.php']['addJSorCSSforFormsOnPage'])) {
			foreach  ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['tslib/class.tslib_content.php']['addAdditionalHeaderDataForFormsOnPage'] as $classRef) {
				$hookObj= &t3lib_div::getUserObj($classRef);
				if (method_exists($hookObj, 'addAdditionalHeaderDataForFormsOnPage'))
					$GLOBALS['TSFE']->additionalHeaderData['feEditAdvanced-additionalHeaderDataForFormsOnPage'] = $hookObj->addAdditionalHeaderDataForFormsOnPage();
			}
		}
		$this->table=$table;
		$this->init($conf);
		$tceforms = t3lib_div::makeInstance('tx_feeditadvanced_tceforms');
		$tceforms->prependFormFieldNames = 'TSFE_EDIT[data]';
		$tceforms->prependFormFieldNames_file = 'TSFE_EDIT_file';
		$tceforms->doSaveFieldName = 'TSFE_EDIT[doSave]';
		$tceforms->formName = $markerArray['###FORM_NAME###'];
		$tceforms->backPath = TYPO3_mainDir;

			// add include files
		$incFiles = $this->addFormIncludes($tceforms);

		$imagePathForFormsOnPage = $this->imagePath ? $this->imagePath . "/forms/" :  $tceforms->backPath . 'gfx/';
		$trData = t3lib_div::makeInstance('t3lib_transferData');
		$trData->addRawData = TRUE;
		$trData->lockRecords = 1;
		$trData->defVals = t3lib_div::_GP('defVals');
		$trData->fetchRecord($table, ($theCmd == 'new' ? $newUID : $dataArr['uid']), ($theCmd == 'new' ? 'new' : ''));
		reset($trData->regTableItems_data);
		$processedDataArr = current($trData->regTableItems_data);
		$processedDataArr['uid'] = ($theCmd == 'new') ? 'NEW' : $dataArr['uid'];
		$processedDataArr['pid'] = ($theCmd == 'new') ? $newUID : $dataArr['pid'];
		if($processedDataArr['CType']) {
			$CType = $processedDataArr['CType'];
		}
		if($processedDataArr['CType'] == 'list') {
			$listType = $processedDataArr['list_type'];
		}
		$mainMode = ($fieldList) ? 'editIcons' : 'editPanel';

			 // related with original reference t3lib_div::makeInstance('t3lib_TCEforms_FE');
		$tceforms->setFancyDesign($tceforms->totalWrap, $tceforms->fieldTemplate, $tceforms->palFieldTemplateHeader, $tceforms->palFieldTemplate, $tceforms->sectionWrap, $conf, $table, $CType, $listType, $mainMode);

		$tceforms->defStyle = 'font-family:Verdana;font-size:10px;';
		$tceforms->edit_showFieldHelp = $GLOBALS['BE_USER']->uc['edit_showFieldHelp'];
		$tceforms->helpTextFontTag = '<font class="helpTextFont" face="verdana,sans-serif" color="#333333" size="1">';
			// configuration for edit panels
		$formOnPageConf = $GLOBALS['TSFE']->tmpl->setup[$table.'.']['stdWrap.']['editPanel.'];

			// hook to add additional JavaScript or CSS before the actual form
		$addHeaderHook = $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['tslib/class.tslib_content.php']['addJSorCSSforFormsOnPage'];
		if (isset($addHeaderHook) && is_array($addHeaderHook)) {
			foreach ($addHeaderHook as $classRef) {
				$hookObj= &t3lib_div::getUserObj($classRef);
				if (method_exists($hookObj, 'addJSorCSSforFormsOnPage')) {
					$JSTop .= $hookObj->addJSorCSSforFormsOnPage();
				}
			}
		} elseif ($formOnPageConf['formsOnPage.']['advFields']) {
				// should not be set for edit icons because they must be handled differently
			if (t3lib_div::_POST('mode')!='editIcons') {
				$toggle .= '<div class="toggleShowHide class-main21"><a href="#" onclick="toggleSimpleAdvanced();return false;"><span id="simpleadv_toggle">' . $GLOBALS['BE_USER']->extGetLL('toggle_advanced') . '</span></a></div>';
			}
		}
		$panel = '';

			// add the save, saveClose, close buttons
		$buttons = '<div class="feEditAdvanced-editControls" id="feEditAdvanced-editControls">';
		$buttons .= '<button type="submit" name="TSFE_EDIT[update]" value="1" class="feEditAdvanced-actionButton saveAction" title="' . $GLOBALS['LANG']->sL('LLL:EXT:lang/locallang_core.php:rm.saveDoc', 1) . '"><span>'.$GLOBALS['BE_USER']->extGetLL('saveButton').'</span></button>';
		$buttons .= '<button type="submit" name="TSFE_EDIT[update_close]" value="1" class="feEditAdvanced-actionButton saveCloseAction" title="' . $GLOBALS['LANG']->sL('LLL:EXT:lang/locallang_core.php:rm.saveCloseDoc', 1) . '"><span>'.$GLOBALS['BE_USER']->extGetLL('saveCloseButton').'</span></button>';
		$buttons .= '<button type="submit" name="TSFE_EDIT[cancel]" value="1" class="feEditAdvanced-actionButton closeAction" title="' . $GLOBALS['LANG']->sL('LLL:EXT:lang/locallang_core.php:rm.closeDoc', 1) . '"><span>'.$GLOBALS['BE_USER']->extGetLL('closeButton').'</span></button>';
		$buttons .= '</div>';

			// Buttons top
		$panel .= $tceforms->intoTemplate(array('ITEM' => $toggle));

		if (!$fieldList && $this->modTSconfig['formsOnPage.']['useListForFields']) {
			if ($this->modTSconfig['formsOnPage.'][$table.'.']) {
				if ($table == 'tt_content') {
					if ($processedDataArr['CType'] == 'list') {
						$fieldList = trim($this->modTSconfig['formsOnPage.'][$table.'.'][$processedDataArr['CType'].'.'][$processedDataArr['list_type'].'.']['fieldList']);
					} else {
						$fieldList = trim($this->modTSconfig['formsOnPage.'][$table.'.'][$processedDataArr['CType'].'.']['0.']['fieldList']);
					}
				} else {
					$fieldList = trim($this->modTSconfig['formsOnPage.'][$table.'.']['fieldList']);
				}
			} elseif ($conf['formsOnPage.']) {
				if($table == 'tt_content') {
					if($processedDataArr['CType'] == 'list') {
						$fieldList = trim($conf['formsOnPage.'][$processedDataArr['CType'].'.'][$processedDataArr['list_type'].'.']['fieldfieldList']);
					} else {
						$fieldList = trim($conf['formsOnPage.'][$processedDataArr['CType'].'.']['0.']['fieldList']);
					}
				} else {
					$fieldList = trim($conf['formsOnPage.']['fieldList']);
				}
			} elseif ($hookRef = $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['tslib/class.tslib_content.php']['formsOnPageFieldList'][$table]) {
				$hookObj = &t3lib_div::getUserObj($hookRef);
				if ($table == 'tt_content') {
					$CType = $processedDataArr['CType'];
					if($processedDataArr['CType'] == 'list') {
						$CType ='getList_tt_content_list_' . $processedDataArr['list_type'];
					} else {
						$hookName='getList_tt_content_' . $CType;
					}
				} else {
					$hookName='getList_' . $table;
				}
				if (is_object($hookObj) && method_exists($hookObj, $hookName)) {
					$fieldList = $hookObj->$hookName(); //$table,$CType,$LType
				}
			}
		}

			// if fieldList exists and it is not empty
		if ($fieldList) {
			$panel .= $tceforms->getListedFields($table, $processedDataArr, $fieldList);
		}
			// if field list has not been found use full form
		else {
			$panel .= $tceforms->getMainFields($table, $processedDataArr);
		}
			// for new, add hidden fields
		if ($theCmd == 'new') {
			$hiddenF .= '<input type="hidden" name="TSFE_EDIT[data][' . $table . '][NEW][pid]" value="' . $newUID . '" />';
				// If a new page is created in front-end, then show it by default!
			if ($table == 'pages') {
				$hiddenF .= '<input type="hidden" name="TSFE_EDIT[data][' . $table . '][NEW][hidden]" value="0" />';
			}
		}
			// add hidden fields to form
		$hiddenF .= '<input type="hidden" name="TSFE_EDIT[doSave]" class="feEditAdvanced-tsfeedit-input-doSave" value="0" />';
		$panel .= $tceforms->intoTemplate(array('ITEM' => $hiddenF));

			// create panel
		$panel = '<div style="position:relative;">' . $tceforms->wrapTotal($panel, $dataArr, $table) . '</div>';

			// for editor code reset
		$JSTop .= $tceforms->printNeededJSFunctions_top() . ($conf['edit.']['displayRecord'] ? $content : '');
		$JSBottom = $tceforms->printNeededJSFunctions();

		$formContent = $JSTop . $incFiles . $panel . $JSBottom . $buttons;

			// Insert any header data from TCEForms.
			// @todo	Temporarily commented out because some styles conflict with page content.
		//$GLOBALS['SOBE']->doc->insertHeaderData();

		$markerArray['###EDITFORM_CONTENT###'] = $formContent;
		$markerArray['###EDITFORM_NAME###'] = $markerArray['###FORM_NAME###'];
		$markerArray['###EDITFORM_URL###'] = $markerArray['###FORM_URL###'];
		$markerArray['###EDITFORM_ONSUBMIT###'] = $markerArray['###FORM_ONSUBMIT###'];
		$markerArray['###EDITFORM_ENCTYPE###'] = $markerArray['###FORM_ENCTYPE###'];
		$markerArray['###FORM_CONTENT###'] = '';

		return $markerArray;
	}

	/**
	 * Adds an edit icon to the content string. The edit icon links to alt_doc.php with proper parameters for editing the table/fields of the context.
	 * This implements TYPO3 context sensitive editing facilities. Only backend users will have access (if properly configured as well).
	 *
	 * @param	string		The content to which the edit icons should be appended
	 * @param	string		The parameters defining which table and fields to edit. Syntax is [tablename]:[fieldname],[fieldname],[fieldname],... OR [fieldname],[fieldname],[fieldname],... (basically "[tablename]:" is optional, default table is the one of the "current record" used in the function). The fieldlist is sent as "&columnsOnly=" parameter to alt_doc.php
	 * @param	array		TypoScript properties for configuring the edit icons.
	 * @param	string		The "table:uid" of the record being shown. If empty string then $this->currentRecord is used. For new records (set by $conf['newRecordFromTable']) it's auto-generated to "[tablename]:NEW"
	 * @param	array		Alternative data array to use. Default is $this->data
	 * @param	string		Additional URL parameters for the link pointing to alt_doc.php
	 * @return	string		The input content string, possibly with edit icons added (not necessarily in the end but just after the last string of normal content.
	 * @todo	Dave: not sure if this is needed in advanced.
	 */
	public function editIcons($content, $params, array $conf=array(), $currentRecord='', array $dataArr=array(), $addUrlParamStr='', $table, $editUid, $fieldList) {
		return $content; //.'<div style="background-color: #ccc; padding: 5px">Edit Icons should go here.</div>';
	}

	/**d
	 *  Add Javascript and CSS includes for editPanel
	 *
	 * @return		void
	 */
	protected function addIncludes() {
			// if already included, then return
		if (strpos($GLOBALS['TSFE']->additionalHeaderData['fe_edit_inc'], 'feEdit.js')) {
			return;
		}

			// loading ext JS, rudimentary for now (should be skinnable etc and only include the JS that is needed)
		$GLOBALS['TSFE']->additionalHeaderData['ext-base.js'] = '<script type="text/javascript" src="typo3/contrib/extjs/adapter/ext/ext-base.js"></script>';
		$GLOBALS['TSFE']->additionalHeaderData['ext-dd.js'] = '<script type="text/javascript" src="' . t3lib_extMgm::siteRelPath('feeditadvanced')  . 'res/js/ext-dd.js"></script>';

			// load AJAX handling functions
		$GLOBALS['TSFE']->additionalHeaderData['feEdit.js'] = '<script type="text/javascript" src="' . t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/js/feEdit.js"></script>';
		$GLOBALS['TSFE']->additionalHeaderData['lightbox.js'] = '<script type="text/javascript" src="' . t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/js/lightbox.js"></script>';
		$GLOBALS['TSFE']->additionalHeaderData['fe_edit_advanced.css'] = '<link href="' .  t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/css/lightbox.css" rel="stylesheet" type="text/css" />';

		
			// @todo Do we need to load these now?
		if (t3lib_extMgm::isLoaded('tinyrte')) {
			$GLOBALS['TSFE']->additionalHeaderData['tinyrte'] = '<script language="javascript" src="typo3conf/ext/tinyrte/tiny_mce/tiny_mce.js"></script>';
		} else if (t3lib_extMgm::isLoaded('tinymce_rte')) {
			$GLOBALS['TSFE']->additionalHeaderData['tinymce_rte'] = '<script language="javascript" src="typo3conf/ext/tinymce_rte/res/tiny_mce/tiny_mce.js"></script>';
		}

			// include anything from controller
		$controllerIncludes = $GLOBALS['BE_USER']->frontendEdit->getJavascriptIncludes();
		if ($controllerIncludes) {
			$GLOBALS['TSFE']->additionalHeaderData['feEditAdvanced-controllerIncludes'] = $controllerIncludes;
		}
			// hook to load in any extra / additional JS includes
		if (is_array($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_editpanel.php']['addIncludes'])) {
			foreach  ($GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['typo3/sysext/feeditadvanced/view/class.tx_feeditadvanced_editpanel.php']['addIncludes'] as $classRef) {
				$hookObj= &t3lib_div::getUserObj($classRef);
				if (method_exists($hookObj, 'addIncludes'))
					$GLOBALS['TSFE']->additionalHeaderData['feEditAdvanced-hookIncludes'] = $hookObj->addIncludes();
			}
		}
	}

	/**
	* Add Javascript and CSS includes for forms on page
	*
 	* @param	object		The TCE Form object to use to generate JS code.
    *
	* @return	void
	*/
	protected function addFormIncludes($tceforms=0) {
		
			// code for dynamic tabs
		$incJS .= '<script type="text/javascript" src="' . t3lib_div::getIndpEnv('TYPO3_SITE_URL') . t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/js/getDynTabMenuJScode.js"></script>';

			// forms on page CSS
		$cssfile = $this->modTSconfig['properties']['skin.']['cssFormFile'];
		$cssFormFile =  $cssfile ? $cssfile : t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/css/fe_formsOnPage.css';
		$incJS .= '<link href="' . t3lib_div::getIndpEnv('TYPO3_SITE_URL') . $cssFormFile . '" rel="stylesheet" type="text/css" />';

			// this allows toggling advanced/simple buttons on form
		$incJS .= '<script type="text/javascript">
				function toggleSimpleAdvanced() {
					advFields = document.getElementsByClassName("advField");
					var turnOn = 0;
					if (advFields.length) {
						for (var i = 0; i < advFields.length; i++) {
							if (advFields[i].style.display == "none") {
								advFields[i].style.display = "";
								turnOn = 1
							}
							else
								advFields[i].style.display = "none";
						}
						if (turnOn)
							$(\'simpleadv_toggle\').update("' . $GLOBALS['BE_USER']->extGetLL('toggle_simple') . '");
						else
							$(\'simpleadv_toggle\').update("' . $GLOBALS['BE_USER']->extGetLL('toggle_advanced') . '");
						$(\'simpleadv_toggle\').blur();
					}
				}
		</script>';

			// add JS functions, as needed
		if ($tceforms) {
			$incJS .= $tceforms->printNeededJSFunctions_top();
			$incJS .= $tceforms->printNeededJSFunctions();
		}

			// @todo: Dave -- this is needed because top.busy is not defined for jsunc.tbe_editor.js -- needs a workaround
		$incJS .= '<script type="text/javascript" src="' . t3lib_div::getIndpEnv('TYPO3_SITE_URL') . t3lib_extMgm::siteRelPath('feeditadvanced') . 'res/js/fe_logout_timer.js"></script>';

		if (t3lib_div::_GP('eID') != 'feeditadvanced') {
			$GLOBALS['TSFE']->additionalHeaderData['feEditAdvanced-formIncludes'] = $incJS;
			$incJS = "";
		}

		return $incJS;
	}
}

if (defined('TYPO3_MODE') && $TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/feeditadvanced/view/class.tx_feeditadvanced_editpanel.php']) {
	include_once($TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/feeditadvanced/view/class.tx_feeditadvanced_editpanel.php']);
}

?>
