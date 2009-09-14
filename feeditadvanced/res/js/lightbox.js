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
				this.initEvents();
				initialized = true;
			}
		},

		initMarkup: function() {

			els.overlay = Ext.DomHelper.append(document.body, {
				id: 'ux-lightbox-overlay'
			}, true);

			var lightboxTpl = new Ext.Template(this.getTemplate());
			els.lightbox = lightboxTpl.append(document.body, {}, true);

			els.shim = Ext.DomHelper.append(Ext.fly('ux-lightbox-imageContainer'), {
				tag: 'iframe',
				id: 'ux-lightbox-shim',
				name: 'ux-lightbox-shim'
			}, true);
			
			els.msg = Ext.DomHelper.append(Ext.fly('ux-lightbox-imageContainer'), {
				tag: 'div',
				id: 'ux-lightbox-msg'
			}, true);

			var ids = ['outerImageContainer', 'imageContainer', 'loading', 'loadingLink'];

			Ext.each(ids, function(id){
				els[id] = Ext.get('ux-lightbox-' + id);
			});

			Ext.each([els.overlay, els.lightbox, els.shim], function(el){
				el.setVisibilityMode(Ext.Element.DISPLAY);
				el.hide();
			});

			var size = (this.animate ? 250 : 1) + 'px';
			els.outerImageContainer.setStyle({
				width: size,
				height: size
			});
		},

		getTemplate : function() {
			return [
				'<div id="ux-lightbox">',
					'<div id="ux-lightbox-outerImageContainer">',
						'<div id="ux-lightbox-imageContainer">',
							'<img id="ux-lightbox-image">',
							'<div id="ux-lightbox-loading">',
								'<a id="ux-lightbox-loadingLink"></a>',
							'</div>',
						'</div>',
					'</div>',
				'</div>'
			];
		},

		initEvents: function() {
			var close = function(ev) {
				ev.preventDefault();
				this.close();
			};

			els.loadingLink.on('click', close, this);
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
						width: fWidth + 'px',
						height: fHeight + 'px',
						alpha:	'(opacity=100)'
					});
					this.setUrl(index, fWidth, fHeight);

					this.fireEvent('open', urls[index]);
				},
				scope: this
			});
		},
		
		openMessage: function(mText, fWidth, fHeight) {
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
					els.msg.setStyle({
						width: fWidth-30 + 'px',
						height: fHeight-30 + 'px'
					});
					this.setMessage(mText, fWidth, fHeight);

					this.fireEvent('open', mText);
				},
				scope: this
			});		
		},
		
		openLoader: function(fWidth, fHeight) {
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
					els.msg.setStyle({
						width: fWidth + 'px',
						height: fHeight + 'px'
					});
					this.setLoader(fWidth, fHeight);

					this.fireEvent('open', '#Loader#');
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

		setMessage: function(mText, fWidth, fHeight){
			
			els.msg.update('');
			if (this.animate) {
				els.loading.show();
			}

			els.shim.hide();
			els.msg.hide();

			els.msg.update(mText);
			els.msg.show();

			this.resizeBox(fWidth, fHeight);
			els.loading.hide();
		},

		setLoader: function(fWidth, fHeight){
			fWidth = fWidth || width;
			fHeight = fHeight || height;
			
			if (this.animate) {
				els.loading.show();
			}

			els.shim.hide();
			els.msg.hide();

			this.resizeBox(fWidth, fHeight);
			
		},

		setUrl: function(index, fWidth, fHeight){
			activeUrl = index;

			if (this.animate) {
				els.loading.show();
			}

			els.shim.hide();
			els.msg.hide();

			els.shim.dom.src = urls[activeUrl][0];
			els.shim.show();
			
			// @todo Temporary solution to pull AJAX response out of iframe.
			els.shim.on('load', function(evt, el) {
				els.msg.hide();
				els.shim.show();
				
				this.resizeBox(fWidth, fHeight);
				els.shim.setStyle({
					alpha:	'(opacity=100)'
				});
				
				// @todo What's the best way to trigger the lightbox close?
				if (window.frames['ux-lightbox-shim'].response) {
					this.close();
				}
			}, this);

			this.resizeBox(fWidth, fHeight);
			els.shim.setStyle({
				alpha:	'(opacity=100)'
			});
			els.loading.hide();
		},
		
		resizeBox: function(w,h) {
			var wCur = els.outerImageContainer.getWidth();
			var hCur = els.outerImageContainer.getHeight();

			var wNew = w;
			var hNew = h;

			var wDiff = wCur - wNew;
			var hDiff = hCur - hNew;

			var queueLength = 0;

			if (hDiff != 0 || wDiff != 0) {
				els.outerImageContainer.syncFx()
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
			this.fireEvent('close', activeImage);
		},

		getViewSize: function() {
			return [Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true)];
		}
	}
})();

Ext.onReady(Ext.ux.Lightbox.init, Ext.ux.Lightbox);