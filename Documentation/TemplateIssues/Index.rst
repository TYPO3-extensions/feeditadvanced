

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


Template issues
---------------

We tried to make the CSS of feeditadvanced bullet proof so that it
works with as many page templates as possible. There is however a
chance that it does not work with your page out of the box, but that
you need to do some adjustments to get it working properly.

When a backend user is logged in, feeditadvanced for example uses
styles.content.get.stdWrap.prependto put div containers into the
columns of the frontend page. That way, the content elements can be
highlighted and moved with the mouse.

Note that these containers are only added to the most commonly used
columns. If you want to work with feeditadvanced in other columns, you
must add the needed definitions there, too. You find those definitions
in the file ext\_localconf.phpof this extension.

If you use the same properties in your custom template, they will
override the ones of feeditadvanced, causing feeditadvanced to not
work correctly.

You can detect and fix that kind of problem in the TypoScript template
tools. Just make sure that you do not use
styles.content.get.stdWrap.prependand its child properties.


