
if (!window.pomelo)
    require("pomelo-creator-client");

var pclient = cc.Class({
    extends: cc.Component,

    statics: {

    },

    init: function(data, cb, errcb) {
		var pomelo = window.pomelo;

		var disc = function() {
			console.log('pomelo init failed');
			if (errcb) {
				errcb();
			}
		};

		var init_cb = function() {
			if (errcb)
				pomelo.off('need_reconnect', disc);

			if (cb)
				cb();
		};

		if (errcb)
			pomelo.once('need_reconnect', disc);

        pomelo.init(data, init_cb);
    },

    request: function(route, data, handler) {
        window.pomelo.request(route, data, handler);
    },

    disconnect: function() {
        window.pomelo.disconnect();
    },

    on: function(ename, cb) {
        window.pomelo.on(ename, cb);
    },

    on_game: function(ename, cb) {
        ename = "game." + ename;
        window.pomelo.on(ename, cb);
    },

    notify: function(route, params) {
        window.pomelo.notify(route, params);
    },

    notify_connector: function(route, params) {
        route = "connector.entryHandler." + route;
        window.pomelo.notify(route, params);
    },

    notify_game: function(route, params) {
        route = "game.gameHandler." + route;
        window.pomelo.notify(route, params);
    },

	request_connector: function(route, data, handler) {
		route = 'connector.entryHandler.' + route;
		window.pomelo.request(route, data, handler);
    },

	request_apis: function(route, data, handler) {
		route = 'apis.apisHandler.' + route;
		window.pomelo.request(route, data, handler);
	},
});

