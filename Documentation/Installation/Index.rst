

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


Installation
------------

To get this extension working you need at least TYPO3 4.3.

Install the extension in the extension manager. There are no further
options to set in the extension manager; most of the extension should
work out of the box.

Go to the frontend of your website and load a page while you are
logged in with a backend user.

Now you should already see the elements, which are added by
feeditadvanced: The top menu and the dashed outline around your
content elements.

You should now be able to edit all types of content elements which
come with TYPO3 by default. For custom content element types (like for
example tt\_news records), an additional configuration is needed. You
find an example in the section "Use feeditadvanced with any kind of
record" later in this manual.

If you test the extension with a backend user, who is no admin, it
might happen that the editing menu does not appear on the frontend
pages.

If that is the case, it might help to include the following
configuration in the TSconfig field of that backend user:

::

   admPanel {
     enable.edit = 1
     hide = 0
   }

The line hide = 0hides the admin panel. If you want to use it, you can
also set this to hide = 1. This should not influence the frontend
editing menu.

Thanks for that hint to Mark Johnston and Walter Karlen!

When you want to use feeditadvanced with workspaces a problem might be
that stage changes and the like cannot be done without logging in to
the backend. The reason is that the extension "version" is not being
loaded in the frontend. As a temporary solution, you can open
typo3conf/localconf.phpand modify
$TYPO3\_CONF\_VARS['EXT']['extList\_FE']to include the version
extension.


