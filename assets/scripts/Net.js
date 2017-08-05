
if(window.io == null){
    window.io = require("socket-io");
}
 
var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: '',
        sio: null,
        isPinging: false,
        fnDisconnect: null,
        handlers: {},
		isBackground: false,
		
        addHandler: function(event, fn) {
            if (this.handlers[event]) {
                console.log("event:" + event + "' handler has been registered.");
                return;
            }

            var handler = function(data) {
                if (typeof(data) == "string") {
                    data = JSON.parse(data);
                }

                fn(data);
            };

            this.handlers[event] = handler;
            console.log("register: function " + event);
            cc.vv.pclient.on(event, handler);
        },

        prepare_connect: function() {
            var self = this;
			cc.game.on(cc.game.EVENT_HIDE, function() {
				self.isBackground = true;
			});

			cc.game.on(cc.game.EVENT_SHOW, function() {
				self.isBackground = false;

				self.lastRecieveTime = Date.now();

				self.ping();
/*
				var offset = self.lastHideTime - self.lastRecieveTime;
				if (offset > 0) {
					self.lastRecieveTime = Date.now() - offset;
				}
*/
			});
        },

        request : function(route, data, callback) {
            cc.vv.pclient.request(route, data, callback);
        },

        send: function(event, data) {
            cc.vv.pclient.notify_game(event, data);
        },
        
        ping: function() {
            this.send('game_ping');
        },
        
        close: function() {
            console.log('close');

            if (this.sio && this.sio.connected) {
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }

            if(this.fnDisconnect) {
                this.fnDisconnect();
                this.fnDisconnect = null;
            }
        },
        
        test: function(fnResult) {

            //TODO:
            return;
            
            var xhr = null;
            var fn = function(ret){
                fnResult(ret.isonline);
                xhr = null;
            }
            
            var arr = this.ip.split(':');
            var data = {
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                ip:arr[0],
                port:arr[1],
            }
            xhr = cc.vv.http.sendRequest("/is_server_online",data,fn);
            setTimeout(function(){
                if(xhr){
                    xhr.abort();
                    fnResult(false);                    
                }
            },1500);
            /*
            var opts = {
                'reconnection':false,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            var self = this;
            this.testsio = window.io.connect(this.ip,opts);
            this.testsio.on('connect',function(){
                console.log('connect');
                self.testsio.close();
                self.testsio = null;
                fnResult(true);
            });
            this.testsio.on('connect_error',function(){
                console.log('connect_failed');
                self.testsio = null;
                fnResult(false);
            });
            */
        }
    },
});

