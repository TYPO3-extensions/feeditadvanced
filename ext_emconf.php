<?php

/***************************************************************
 * Extension Manager/Repository config file for ext "feeditadvanced".
 *
 * Auto generated 09-05-2014 16:35
 *
 * Manual updates:
 * Only the data in the array - everything else is removed by next
 * writing. "version" and "dependencies" must not be touched!
 ***************************************************************/

$EM_CONF[$_EXTKEY] = array (
	'title' => 'Advanced Frontend Editing',
	'description' => 'This extension is the next generation for editing basic content directly through the frontend. It has all the bells an whistles like AJAX and Drag&Drop. TemplaVoila support included.',
	'category' => 'fe',
	'version' => '1.6.1-dev',
	'state' => 'beta',
	'uploadfolder' => false,
	'createDirs' => '',
	'clearcacheonload' => false,
	'author' => 'Frontend Editing Team',
	'author_email' => 'jeff@webempoweredchurch.org',
	'author_company' => '',
	'constraints' =>
	array (
		'depends' =>
		array (
			'typo3' => '4.5.0-6.2.99',
			'php' => '5.2.0-0.0.0',
		),
		'conflicts' =>
		array (
			'feedit' => '',
		),
		'suggests' =>
		array (
		),
	),
);

