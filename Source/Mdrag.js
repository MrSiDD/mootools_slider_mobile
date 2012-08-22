/*
---

name: MDrag

description: Makes the Drag class touch friendly

authors: Michaël Boué (@MrSiDD)

license: MIT-style license.

requires: [Drag]

...
*/

var MDrag = new Class({
	Extends: Drag,

	initialize: function(){
		var params = Array.link(arguments, {
			'options': Type.isObject,
			'element': function(obj){
				return obj !== null;
			}
		});

		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = typeOf(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};


		if (Browser.Platform.ios || Browser.Platform.android) {
			this.selection = 'touchstart';
		}
		else {
			this.selection = (Browser.ie) ? 'selectstart' : 'mousedown';
		}


		if (Browser.ie && !Drag.ondragstartFixed){
			document.ondragstart = Function.from(false);
			Drag.ondragstartFixed = true;
		}

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: Function.from(false)
		};
		this.attach();
	},

	attach: function(){
		if (Browser.Platform.ios || Browser.Platform.android) {
			this.handles.addEvent('touchstart', this.bound.start);
		}
		else {
			this.handles.addEvent('mousedown', this.bound.start);
		}
		return this;
	},

	detach: function(){
		if (Browser.Platform.ios || Browser.Platform.android) {
			this.handles.addEvent('touchstart', this.bound.start);
		}
		else {
			this.handles.addEvent('mousedown', this.bound.start);
		}
		return this;
	},

	start: function(event){
		var options = this.options;

		if (event.rightClick) return;

		if (options.preventDefault) event.preventDefault();
		if (options.stopPropagation) event.stopPropagation();
		this.mouse.start = event.page;

		this.fireEvent('beforeStart', this.element);

		var limit = options.limit;
		this.limit = {x: [], y: []};

		var z, coordinates;
		for (z in options.modifiers){
			if (!options.modifiers[z]) continue;

			var style = this.element.getStyle(options.modifiers[z]);

			// Some browsers (IE and Opera) don't always return pixels.
			if (style && !style.match(/px$/)){
				if (!coordinates) coordinates = this.element.getCoordinates(this.element.getOffsetParent());
				style = coordinates[options.modifiers[z]];
			}

			if (options.style) this.value.now[z] = (style || 0).toInt();
			else this.value.now[z] = this.element[options.modifiers[z]];

			if (options.invert) this.value.now[z] *= -1;

			this.mouse.pos[z] = event.page[z] - this.value.now[z];

			if (limit && limit[z]){
				var i = 2;
				while (i--){
					var limitZI = limit[z][i];
					if (limitZI || limitZI === 0) this.limit[z][i] = (typeof limitZI == 'function') ? limitZI() : limitZI;
				}
			}
		}

		if (typeOf(this.options.grid) == 'number') this.options.grid = {
			x: this.options.grid,
			y: this.options.grid
		};

		var events;

		if (Browser.Platform.ios || Browser.Platform.android) {
			events = {
				touchmove: this.bound.check,
				touchend: this.bound.cancel
			};
		}
		else {
			events = {
				mousemove: this.bound.check,
				mouseup: this.bound.cancel
			};
		}
		events[this.selection] = this.bound.eventStop;
		this.document.addEvents(events);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();

			var events;

			if (Browser.Platform.ios || Browser.Platform.android) {
				events = {
					touchmove: this.bound.drag,
					touchend: this.bound.stop
				};
			}
			else {
				events = {
					mousemove: this.bound.drag,
					mouseup: this.bound.stop
				};
			}

			this.document.addEvents(events);
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	cancel: function(event){
		var events;

		if (Browser.Platform.ios || Browser.Platform.android) {
			events = {
				touchmove: this.bound.check,
				touchend: this.bound.cancel
			};
		}
		else {
			events = {
				mousemove: this.bound.check,
				mouseup: this.bound.cancel
			};
		}

		this.document.removeEvents(events);

		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		var events;

		if (Browser.Platform.ios || Browser.Platform.android) {
			events = {
				touchmove: this.bound.drag,
				touchend: this.bound.stop
			};
		}
		else {
			events = {
				mousemove: this.bound.drag,
				mouseup: this.bound.stop
			};
		}

		events[this.selection] = this.bound.eventStop;
		this.document.removeEvents(events);
		if (event) this.fireEvent('complete', [this.element, event]);
	}
});