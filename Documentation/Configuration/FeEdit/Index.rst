

.. ==================================================
.. FOR YOUR INFORMATION
.. --------------------------------------------------
.. -*- coding: utf-8 -*- with BOM.

.. ==================================================
.. DEFINE SOME TEXTROLES
.. --------------------------------------------------
.. role::   underline
.. role::   typoscript(code)
.. role::   ts(typoscript)
   :class:  typoscript
.. role::   php(code)


->FeEdit
^^^^^^^^

The following options can be used in Page TSconfig and can be
overwritten in User TSconfig:


.. ### BEGIN~OF~TABLE ###

.. container:: table-row

   Property
         Property
   
   Data type
         Data type
   
   Description
         Description
   
   Default
         Default


.. container:: table-row

   Property
         disable
   
   Data type
         boolean
   
   Description
         Disables feeditadvanced completely.
   
   Default
         0


.. container:: table-row

   Property
         useAjax
   
   Data type
         boolean
   
   Description
         If set, Ajax is used when otherwise the page would have to reload
         (e.g. after inserting a new content element).
   
   Default
         1


.. container:: table-row

   Property
         clickContentToEdit
   
   Data type
         boolean
   
   Description
         If set to 1, clicking on content elements allows you to edit them. If
         you want to be able to follow links in content elements instead, let
         it set to 0.
   
   Default
         0


.. container:: table-row

   Property
         reloadPageOnContentUpdate
   
   Data type
         boolean
   
   Description
         TSconfig option for complete page reload on content change.
         
         Notice: This option still is experimental.
   
   Default
         0


.. container:: table-row

   Property
         showIcons
   
   Data type
         list of values
   
   Description
         Comma separated list of icons to show when hovering over content
         elements with the mouse.
         
         Possible values:
         
         edit: Show icon to edit elements.
         
         new: Show icon to insert new element after the current one.
         
         copy: Show icon to copy elements.
         
         cut: Show icon to cut elements.
         
         hide: Show icon to hide and unhide elements.
         
         delete: Show icon to delete the elements.
         
         draggable: Show button to drag elements.
   
   Default
         edit, new, copy, cut, hide, delete, draggable


.. container:: table-row

   Property
         showPageIcons
   
   Data type
         list of values
   
   Description
         Options to show on a page for editing pages.
         
         Possible values:
         
         new: Show button to create a new page.
         
         edit: Show button to edit page properties.
         
         delete: Show button to delete the page.
         
         hide: Show icon to hide and unhide the page.
   
   Default
         edit, new


.. container:: table-row

   Property
         skin.cssFile
   
   Data type
         string
   
   Description
         Path to the CSS file with the styles generally used by feeditadvanced.
   
   Default
         typo3conf/ext/feeditadvanced/res/css/fe\_edit\_advanced.css


.. container:: table-row

   Property
         skin.cssFormFile
   
   Data type
         string
   
   Description
         Path to the CSS file with the needed styles for editing forms on the
         page.
   
   Default
         typo3conf/ext/feeditadvanced/res/css/fe\_formsOnPage.css


.. container:: table-row

   Property
         skin.templateFile
   
   Data type
         string
   
   Description
         The template file to be used. Holding the HTML Code for the menu and
         the edit panels
   
   Default
         typo3conf/ext/feeditadvanced/res/template/feedit.tmpl


.. container:: table-row

   Property
         skin.imagePath
   
   Data type
         string
   
   Description
         Path to images for skinning. Influences icons in edit panels and
         editing icons.
         
         If editing takes place with forms on the page, there must be a
         subfolder called forms/ inside skin.imagePath. It must hold the needed
         images.
   
   Default
         typo3conf/ext/feeditadvanced/res/icons/


.. container:: table-row

   Property
         menuBar.disable
   
   Data type
         boolean
   
   Description
         Do not show the menu at the top.
   
   Default
         0


.. container:: table-row

   Property
         menuBar.config
   
   Data type
         list of values
   
   Description
         Defines, which sections of the menu to show.
         
         Possible values:
         
         action: Options to edit page, file, user and some more. Currently not
         supported.
         
         clipboard: Display the clipboard.
         
         context: Display a context menu on the right site of the top menu.
         Available buttons in that menu can be configured with
         menuBar.contextMenu, see below.
   
   Default
         action, clipboard, context


.. container:: table-row

   Property
         menuBar.contextMenu
   
   Data type
         list of values
   
   Description
         Configures available buttons in the right part of the top menu.
         
         Possible values:
         
         preview: Display a preview button.
         
         close: Display the close button. This button closes the frontend
         editing.
         
         logout: Display the logout button. With this button you can log out
         from the TYPO3 Backend.
   
   Default
         close, logout


.. container:: table-row

   Property
         editWindow.height
   
   Data type
         int
   
   Description
         Adjusts the height of the editing window. This is especially useful,
         if using larger screens. If the editing window is larger than the
         browser window, the size is reduced to fit.
   
   Default
         600


.. container:: table-row

   Property
         editWindow.width
   
   Data type
         int
   
   Description
         Adjusts the width of the editing window. This is especially useful, if
         using larger screens. If the editing window is larger than the browser
         window, the size is reduced to fit.
   
   Default
         800


.. ###### END~OF~TABLE ######


[page:FeEdit; beuser:page.FeEdit]

