// Leaflet fullHash plugin, modified by Qwilka
// Additional parameter for config.
(function(window) {
	var HAS_HASHCHANGE = (function() {
		var doc_mode = window.documentMode;
		return ('onhashchange' in window) &&
			(doc_mode === undefined || doc_mode > 7);
	})();

	L.Hash = function(map, options) {
		this.onHashChange = L.Util.bind(this.onHashChange, this);

		if (map) {
			this.init(map, options);
		}
	};

	L.Hash.parseHash = function(hash) {
		if(hash.indexOf('#') === 0) {
			hash = hash.substr(1);
		}
		var args = hash.split("/");
		if (args.length >= 4) {
			var zoom = parseInt(args[0], 10),
			lat = parseFloat(args[1]),
			lon = parseFloat(args[2]),
			layers = (args[3]).split("-");
			let retObj = {
				center: new L.LatLng(lat, lon),
				zoom: zoom,
				layers: layers				
			};
			if (args.length >= 5) retObj.config = args[4];
			if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
				return false;
			} else {
				return retObj;
			}
		} else {
			return false;
		}
	};

	L.Hash.formatHash = function(map, config) {
		var center = map.getCenter(),
		    zoom = map.getZoom(),
		    precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
		    layers = [];

		//console.log(this.options);
		var options = this.options;
		//Check active layers
		for(var key in options) {
			if (options.hasOwnProperty(key)) {
				if (map.hasLayer(options[key])) {
					layers.push(key);
				};
			};
		};
		let retStr = "#" + [zoom,
			center.lat.toFixed(precision),
			center.lng.toFixed(precision),
			layers.join("-")
		].join("/");
		if (config) {
			retStr += "/" + config;
		}

		return retStr;
	},

	L.Hash.prototype = {
		map: null,
		lastHash: null,
		config: null,

		parseHash: L.Hash.parseHash,
		formatHash: L.Hash.formatHash,

		init: function(map, options) {
			this.map = map;
			L.Util.setOptions(this, options);

			// reset the hash
			this.lastHash = null;
			this.onHashChange();

			if (!this.isListening) {
				this.startListening();
			}
		},

		removeFrom: function(map) {
			if (this.changeTimeout) {
				clearTimeout(this.changeTimeout);
			}

			if (this.isListening) {
				this.stopListening();
			}

			this.map = null;
		},

		onMapMove: function() {
			// bail if we're moving the map (updating from a hash),
			// or if the map is not yet loaded

			if (this.movingMap || !this.map._loaded) {
				return false;
			}

			var hash = this.formatHash(this.map, this.config);
			if (this.lastHash != hash) {
				location.replace(hash);
				this.lastHash = hash;
			}
		},

		movingMap: false,
		update: function() {
			var hash = location.hash;
			if (hash === this.lastHash) {
				return;
			}
			var parsed = this.parseHash(hash);
			if (parsed) {
				this.movingMap = true;
				this.config = parsed.config;

				this.map.setView(parsed.center, parsed.zoom);
				var layers = parsed.layers,
					options = this.options,
					that = this;
				//Add/remove layers
				this.map.eachLayer(function(layer) {
					that.map.removeLayer(layer);
				});

				layers.forEach(function(element, index, array) {
					//console.log(options[element]);
					console.log("L.Hash.update: adding layer: " + element);
					that.map.addLayer(options[element]);
				});			

				this.movingMap = false;
			} else {
				this.onMapMove(this.map);
			}
		},

		// defer hash change updates every 100ms
		changeDefer: 100,
		changeTimeout: null,
		onHashChange: function() {
			// throttle calls to update() so that they only happen every
			// `changeDefer` ms
			if (!this.changeTimeout) {
				var that = this;
				this.changeTimeout = setTimeout(function() {
					that.update();
					that.changeTimeout = null;
				}, this.changeDefer);
			}
		},

		isListening: false,
		hashChangeInterval: null,
		startListening: function() {
			this.map.on("moveend layeradd layerremove", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.addListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
				this.hashChangeInterval = setInterval(this.onHashChange, 50);
			}
			this.isListening = true;
		},

		stopListening: function() {
			this.map.off("moveend layeradd layerremove", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
			}
			this.isListening = false;
		},

		_keyByValue: function(obj, value) {
			for(var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (obj[key] === value) {
						return key;
					} else { return null; };
				};
			};
		}
	};
	L.hash = function(map, options) {
		return new L.Hash(map, options);
	};
	L.Map.prototype.addHash = function() {
		this._hash = L.hash(this, this.options);
	};
	L.Map.prototype.removeHash = function() {
		this._hash.removeFrom();
	};
})(window);
