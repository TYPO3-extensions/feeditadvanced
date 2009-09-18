Ext.ns('Ext.ux');

Ext.ux.Lightbox = (function(){
	var els = {},
		urls = [],
		activeUrl,
		initialized = false,
		selectors = [],
		width = 400,
		height = 300;

	return {
		overlayOpacity: 0.5,
		animate: true,
		resizeSpeed: 8,
		borderSize: 10,

		init: function() {
			this.resizeDuration = this.animate ? ((11 - this.resizeSpeed) * 0.15) : 0;
			this.overlayDuration = this.animate ? 0.2 : 0;

			if(!initialized) {
				Ext.apply(this, Ext.util.Observable.prototype);
				Ext.util.Observable.constructor.call(this);
				this.addEvents('open', 'close');
				this.initMarkup();
				
				els.shim.on('load', this.shimLoaded, this);
				initialized = true;
			}
		},

		initMarkup: function() {
			els.overlay = Ext.DomHelper.append(document.body, {
				id: 'ux-lightbox-overlay'
			}, true);

			var lightboxTpl = new Ext.Template(this.getTemplate());
			els.lightbox = lightboxTpl.append(document.body, {}, true);

			els.shim = Ext.DomHelper.append(Ext.fly('ux-lightbox-content'), {
				tag: 'iframe',
				id: 'ux-lightbox-shim',
				name: 'ux-lightbox-shim'
			}, true);
			
			els.loading = Ext.DomHelper.append(Ext.fly('ux-lightbox-content'), {
				tag: 'div',
				id: 'ux-lightbox-loading'
			}, true);
			
			els.msg = Ext.DomHelper.append(Ext.fly('ux-lightbox-content'), {
				tag: 'div',
				id: 'ux-lightbox-msg'
			}, true);

			var ids = ['wrapper', 'content', 'loading'];

			Ext.each(ids, function(id){
				els[id] = Ext.get('ux-lightbox-' + id);
			});

			Ext.each([els.overlay, els.lightbox, els.shim], function(el){
				el.setVisibilityMode(Ext.Element.DISPLAY);
				el.hide();
			});

			var size = (this.animate ? 250 : 1) + 'px';
			els.wrapper.setStyle({
				width: size,
				height: size
			});
		},

		getTemplate : function() {
			return [
				'<div id="ux-lightbox">',
					'<div id="ux-lightbox-wrapper">',
						'<div id="ux-lightbox-content">',
						'</div>',
					'</div>',
				'</div>'
			];
		},

		register: function(sel, group) {
			if(selectors.indexOf(sel) === -1) {
				selectors.push(sel);

				Ext.fly(document).on('click', function(ev){
					var target = ev.getTarget(sel);

					if (target) {
						ev.preventDefault();
						this.open(target, sel, group);
					}
				}, this);
			}
		},

		registerUrl: function(sel, width, height) {
			if(selectors.indexOf(sel) === -1) {
				selectors.push(sel);

				Ext.fly(document).on('click', function(ev){
					var target = ev.getTarget(sel);

					if (target) {
						ev.preventDefault();
						this.openUrl(target, width, height);
					}
				}, this);
			}
		},

		openUrl: function(url, fWidth, fHeight) {
			els.shim.dom.src = '';
			this.setViewSize();
			els.overlay.fadeIn({
				duration: this.overlayDuration,
				endOpacity: this.overlayOpacity,
				callback: function() {
					urls = [];

					var index = 0;
					urls.push([url.href, url.title]);


					// calculate top and left offset for the lightbox
					var pageScroll = Ext.fly(document).getScroll();

					var lightboxTop = pageScroll.top + (Ext.lib.Dom.getViewportHeight() / 10);
					var lightboxLeft = pageScroll.left;
					els.lightbox.setStyle({
						top: lightboxTop + 'px',
						left: lightboxLeft + 'px'
					}).show();
					els.shim.setStyle({
						width: (fWidth - 20) + 'px',
						height: (fHeight - 20) + 'px',
						alpha:	'(opacity=100)'
					});
					this.setUrl(index, fWidth, fHeight);

					this.fireEvent('open', urls[index]);
				},
				scope: this
			});
		},
		
		openMessage: function(mText, fWidth, fHeight, showLoadingIndicator) {
			fWidth = fWidth || width;
			fHeight = fHeight || height;
			 
			this.setViewSize();
			els.overlay.fadeIn({
				duration: this.overlayDuration,
				endOpacity: this.overlayOpacity,
				callback: function() {
					

					// calculate top and left offset for the lightbox
					var pageScroll = Ext.fly(document).getScroll();

					var lightboxTop = pageScroll.top + (Ext.lib.Dom.getViewportHeight() / 10);
					var lightboxLeft = pageScroll.left;
					els.lightbox.setStyle({
						top: lightboxTop + 'px',
						left: lightboxLeft + 'px'
					}).show();
					this.setMessage(mText, fWidth, fHeight, showLoadingIndicator);

					this.fireEvent('open', mText);
				},
				scope: this
			});		
		},

		setViewSize: function(){
			var viewSize = this.getViewSize();
			els.overlay.setStyle({
				width: viewSize[0] + 'px',
				height: viewSize[1] + 'px'
			});
			els.shim.setStyle({
				width: viewSize[0] + 'px',
				height: viewSize[1] + 'px'
			}).show();
		},

		setMessage: function(mText, fWidth, fHeight, showLoadingIndicator){
			
			els.msg.update('');
			if (showLoadingIndicator) {
				els.loading.show();
			}

			els.shim.hide();
			els.msg.hide();

			els.msg.update(mText);
			els.msg.show();

			this.resizeBox(fWidth, fHeight);
		},

		setUrl: function(index, fWidth, fHeight) {
			activeUrl = index;
			els.shim.dom.src = urls[activeUrl][0];
			this.shimWidth = fWidth;
			this.shimHeight = fHeight;
		},
		
		shimLoaded : function() {
			els.msg.hide();
			els.loading.hide();
			this.resizeBox(this.shimWidth, this.shimHeight);
			els.shim.fadeIn();
				
			els.shim.setStyle({
				alpha:	'(opacity=100)'
			});
				
			// @todo What's the best way to trigger the lightbox close?
			if (window.frames['ux-lightbox-shim'].response) {
				this.close();
			}
				
			// @todo Do something here to hide the lightbox when we're in between page loads
			forms = Ext.get(window.frames['ux-lightbox-shim'].document.forms);
			if (forms) {
				forms.on('submit', function(evt, el) {
					//alert('submitted form.  we should hide now');
				});
			}
		},
		
		resizeBox: function(w,h) {
			var wCur = els.wrapper.getWidth();
			var hCur = els.wrapper.getHeight();

			var wNew = w;
			var hNew = h;

			var wDiff = wCur - wNew;
			var hDiff = hCur - hNew;

			var queueLength = 0;

			if (hDiff != 0 || wDiff != 0) {
				els.wrapper.syncFx()
					.shift({
						height: hNew,
						duration: this.resizeDuration
					})
					.shift({
						width: wNew,
						duration: this.resizeDuration
					});
				queueLength++;
			}

			var timeout = 0;
			if ((hDiff == 0) && (wDiff == 0)) {
				timeout = (Ext.isIE) ? 250 : 100;
			}
		},

		close: function(){
			els.lightbox.hide();
			els.overlay.fadeOut({
				duration: this.overlayDuration
			});
			els.shim.hide();
			this.fireEvent('close', this);
		},

		getViewSize: function() {
			return [Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true)];
		}
	}
})();

Ext.onReady(Ext.ux.Lightbox.init, Ext.ux.Lightbox);