<?php
/***************************************************************
*  Copyright notice
*
*  (c) 2007-2009 Stanislas Rolland <stanislas.rolland(arobas)fructifor.ca>
*  All rights reserved
*
*  This script is part of the Typo3 project. The Typo3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/
/**
 * Block Style extension for htmlArea RTE
 *
 * @author Stanislas Rolland <stanislas.rolland(arobas)fructifor.ca>
 *
 * TYPO3 SVN ID: $Id: class.tx_rtehtmlarea_blockstyle.php 5165 2009-03-09 18:28:59Z ohader $
 *
 */

require_once(t3lib_extMgm::extPath('rtehtmlarea').'class.tx_rtehtmlareaapi.php');

class tx_rtehtmlarea_blockstyle extends tx_rtehtmlareaapi {

	protected $extensionKey = 'rtehtmlarea';		// The key of the extension that is extending htmlArea RTE
	protected $pluginName = 'BlockStyle';			// The name of the plugin registered by the extension
	protected $relativePathToLocallangFile = 'extensions/BlockStyle/locallang.xml';	// Path to this main locallang file of the extension relative to the extension dir.
	protected $relativePathToSkin = '';			// Path to the skin (css) file relative to the extension dir.
	protected $htmlAreaRTE;					// Reference to the invoking object
	protected $thisConfig;					// Reference to RTE PageTSConfig
	protected $toolbar;					// Reference to RTE toolbar array
	protected $LOCAL_LANG; 					// Frontend language array
	
	protected $pluginButtons = 'blockstyle';		// The comma-seperated list of button names that the extension id adding to the htmlArea RTE tollbar
	protected $pluginLabels = 'blockstylelabel';		// The comma-seperated list of label names that the extension id adding to the htmlArea RTE tollbar
								// The name-converting array, converting the button names used in the RTE PageTSConfing to the button id's used by the JS scripts
	protected $convertToolbarForHtmlAreaArray = array (
		'blockstylelabel'	=> 'I[Block style label]',
		'blockstyle'		=> 'BlockStyle',
		);
	protected $requiresClassesConfiguration = true;		// True if the extension requires the PageTSConfig Classes configuration

} // end of class

if (defined('TYPO3_MODE') && $TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/rtehtmlarea/extensions/BlockStyle/class.tx_rtehtmlarea_blockstyle.php']) {
	include_once($TYPO3_CONF_VARS[TYPO3_MODE]['XCLASS']['ext/rtehtmlarea/extensions/BlockStyle/class.tx_rtehtmlarea_blockstyle.php']);
}

?>