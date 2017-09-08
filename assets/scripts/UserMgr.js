
var shopURL = 'http://test.wzmj.com:12580';

cc.Class({
    extends: cc.Component,
    properties: {
        account:null,
	    userId:null,
		userName:null,
		lv:0,
		exp:0,
		coins:0,
		gems:0,
		sign:0,
        ip:"",
        sex:0,
        roomData:null,

        oldRoomId:null,
    },

    guestAuth: function() {

        var test_users = {
            "test1" : "0d648f562a37229dde3b0c95e083213d6152ecb319a42468f04528d985473b10",
            "test2" : "7358d8c19b8f7f60cd086ccb3614c03ab43f3cbaa3727e00aaf5908dac4540a1",
            "test3" : "8cf59929351ba7201c55072ed7a12b88d2b0225da8a8afb4cbabdc8371f335ad",
            "test4" : "998331947b6f82971aae44518322ff862741f3bd90a9c59e0cfd564d5f6922ee",
            "test5" : "9970d6b7aaaa42d5f138a12bc91176d5d5a9a7641df6f5696d8feda2f92e35c1",
        };

        var account = cc.args["account"];
        if (account == null || test_users[account] == null) {
            return;
        }

        this.onAuth({
            errcode: 0,
            token: test_users[account],
            account: account
        });
    },

    onAuth: function(ret) {
        var self = cc.vv.userMgr;
        if (ret.errcode !== 0) {
            console.log(ret.errmsg);
        } else {
            self.sign = ret.token;
            self.account = ret.account;
            //cc.vv.http.url = "http://1.2.3.4";
			cc.vv.wc.show(0);

			var login_cb = function(ret) {
				if (ret == cc.vv.global.const_code.OK) {
					cc.director.loadScene('hall');
				} else if (ret == cc.vv.global.const_code.ENTRY.FA_USER_NOT_EXIST) {
					cc.sys.localStorage.removeItem("wx_account");
					cc.sys.localStorage.removeItem("wx_sign");
					cc.vv.wc.hide();
					cc.vv.anysdkMgr.login();
				} else {
					cc.vv.wc.hide();
				}
			};

            self.login(login_cb);
        }
    },

    login: function(login_cb) {
        var self = cc.vv.userMgr;
        var pc = cc.vv.pclient;
		var scene = cc.director.getScene().name;

		console.log('start login');

        var onLogin = function(ret) {
            if (ret.code !== cc.vv.global.const_code.OK) {
                console.log(ret.errmsg);
            } else {
				console.log('login success');

                if (!ret.userid) {
                    cc.director.loadScene("createrole");
                } else {
                    self.account = ret.account;
                    self.userId = ret.userid;
                    self.userName = ret.username;
                    self.lv = ret.lv;
                    self.exp = ret.exp;
                    self.coins = ret.coins;
                    self.gems = ret.gems;
                    self.roomData = ret.roomid;
                    self.sex = ret.sex;
                    self.ip = ret.ip;
                }
            }

			if (login_cb) {
				login_cb(ret.code);
			}
        };

        var start_connect = function(host, port, token) {
            console.log("start connect to connector");

            pc.init({ host: host, port: port, log: true, need_reconnect : true }, function() {
                console.log("start login");

                pc.request_connector('entry', { token: token }, function(data) {
                    console.log("log ret");

					if (data.code != 0)
						pc.disconnect();

                    onLogin(data);
                });
            }/*, function() {
				if (login_cb) {
					login_cb();
				}
			}*/);
        };

        pc.init({
            host : cc.vv.SI.gate_host,
            port : cc.vv.SI.gate_port,
            log : true,
        }, function() {
            var route = 'gate.gateHandler.queryEntry';

            pc.request(route, {
    			uid: self.account
    		}, function(data) {

    			pc.disconnect();

    			if (data.code !== cc.vv.global.const_code.OK) {
    				console.log("login error=", data.code);

					if (login_cb) {
						login_cb(data.code);
					}

    				return;
    			}

    			start_connect(data.host, data.port, self.sign);
    		});
        }, function() {
        	console.log('gate failed');
			if (login_cb) {
				login_cb(cc.vv.global.const_code.FAIL);
			}
		});
    },

    create: function(name) {
        var self = this;
        var onCreate = function(ret) {
            cc.vv.wc.hide();
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                self.login();
            }
        };

        var data = {
            account:this.account,
            sign:this.sign,
            name:name
        };

        cc.vv.wc.show(0);
        cc.vv.http.sendRequest("/create_user",data,onCreate);
    },

    enterRoom: function(roomId, callback) {
        var self = this;
		var pc = cc.vv.pclient;
		var net = cc.vv.gameNetMgr;

        var data = {
            roomid: roomId
        };

		console.log('usermgr enterRoom: ' + roomId);

        cc.vv.wc.show(2);
		pc.request_connector('enter_private_room', data, function(ret) {
            console.log("return from enter_private_room=" + ret.errcode);
            if (ret.errcode != cc.vv.global.const_code.OK) {
                console.log("enter room failed,code=" + ret.errcode);

				cc.vv.wc.hide();
                if(callback != null)
                    callback(ret);
            } else {
                if(callback != null)
                    callback(ret);

                console.log(ret);
                net.connectGameServer({roomid : roomId});
            }
        });
    },

    getHistoryList:function(callback){
        var self = this;
        var onGet = function(ret) {
			cc.vv.wc.hide();

            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.history);
                if (callback != null) {
                    callback(ret.history);
                }
            }
        };

		cc.vv.wc.show(0);
        cc.vv.pclient.request_apis('get_history_list', {}, onGet);
    },

    getGamesOfRoom: function(uuid,callback) {
        var self = this;
        var onGet = function(ret) {
			cc.vv.wc.hide();
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };

        var data = {
            uuid:uuid,
        };

		cc.vv.wc.show(0);
        cc.vv.pclient.request_apis('get_games_of_room', data, onGet);
    },

    getDetailOfGame: function(uuid, index, callback) {
        var self = this;
        var onGet = function(ret) {
			cc.vv.wc.hide();
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };

        var data = {
            uuid: uuid,
            index: index,
        };

		cc.vv.wc.show(0);
        cc.vv.pclient.request_apis('get_detail_of_game', data, onGet);
    },

	simpleRequest: function(path, data, cb) {
		var self = this;
		var onGet = function(ret) {
			cc.vv.wc.hide();

			if (ret.errcode !== 0) {
                console.log(ret.errmsg);
			}

			cb(ret.errcode == 0);
		};

		cc.vv.wc.show(0);
		cc.vv.pclient.request_apis(path, data, onGet);
    },

	simpleRequstWithResult: function(path, data, cb) {
		var self = this;
		var onGet = function(ret) {
			cc.vv.wc.hide();

			cb(ret);
		};

		cc.vv.wc.show(0);
		cc.vv.pclient.request_apis(path, data, onGet);
    },

	invest: function(name, phone, wechat, cb) {
		var data = {
			name: name,
			phone: phone,
			wechat: wechat
		};

		this.simpleRequest('invest', data, cb);
	},

	feedback: function(content, qq, phone, cb) {
		var data = {
			content: content,
			qq: qq,
			phone: phone
		};

		this.simpleRequest('feedback', data, cb);
	},

	getGameExchange: function(cb) {
        var self = this;

		// TODO
		var ret = {
			errcode: 0,
			errmsg: 'ok',
			data: [
				{
					id: 0,
					amount: 10,
					name: 'recharge',
					logo: 'http://foo.com/1.png',
					price: {
						count: 100,
						currency: 'lottery',
					},
				},
			],
		};

		cb(ret);
    },

	exchange: function(data, cb) {
		var self = this;

		// TODO
		var ret = {
			errcode: 0,
			errmsg: 'ok',
			data: {
				amount: 10,
				name: 'recharge',
			},
		};

		cb(ret);
    },

	getTicketsInfo: function(callback) {
		var self = this;

		// TODO
		var ret = { ticket: 2000, chip: 500 };

		callback(ret);
    },

	getRewardDesc: function(reward) {
		var count = reward.count;
		var currency = reward.currency;

		var items = [ 'gem', 'gold', 'lottery', 'active' ];
		var descs = [ '钻石', '金币', '奖券', '活跃值' ];

        var index = items.indexOf(currency);
        var desc = '未定义';

        if (index >= 0) {
            desc = descs[index];
        }

        desc += 'x' + count;

        return desc;
    },

	getTaskReward: function(data, cb) {
		this.simpleRequstWithResult('get_task_reward', data, cb);
    },

    getBoxStatus : function(type, cb) {
		var data = {
			type: type,
		};

		this.simpleRequstWithResult('list_user_tbox', data, cb);
    },

    getBoxReward : function(data, cb) {
		this.simpleRequstWithResult('get_tbox_reward', data, cb);
    },

	getDailyStatus: function(cb) {
		var data = {
			type: 'daily',
		};

		this.simpleRequstWithResult('list_user_task', data, cb);
    },

	getShopGoods: function(cb) {
		var data = {
			currency: 'RMB',
		};

		this.simpleRequstWithResult('list_goods_from_shop', data, cb);
	},

	buyGoods: function(data, cb) {

		var args = {
			id:data.id,
			count: 1,
			recipe: 'xxxxxxx',
		};

		this.simpleRequstWithResult('buy_goods_from_shop', args, cb);
	},

	getRouletteLayout: function(rname, cb) {
		this.simpleRequstWithResult('list_prize_by_type', { type: 'wheel' }, cb);
    },

	runRoulette: function(name, cb) {

    },

	getLoginStatus: function(cb) {
		var self = this;

		// TODO

		var ret = {
			errcode: 0,
			errmsg: 'ok',
			login_days: 16,
			data: [
				{
					id: 0,
					days: 3,
					logo: 'http://foo.com/1.png',
					reward: {
						count: 100,
						currency: 'lottery',
					},
					got: false,
				},
				{
					id: 1,
					days: 7,
					logo: 'http://foo.com/1.png',
					reward: {
						count: 100,
						currency: 'lottery',
					},
					got: false,
				},
				{
					id: 2,
					days: 14,
					logo: 'http://foo.com/1.png',
					reward: {
						count: 100,
						currency: 'lottery',
					},
					got: false,
				},
				{
					id: 3,
					days: 21,
					logo: 'http://foo.com/1.png',
					reward: {
						count: 100,
						currency: 'lottery',
					},
					got: false,
				},
				{
					id: 4,
					days: 30,
					logo: 'http://foo.com/1.png',
					reward: {
						count: 100,
						currency: 'lottery',
					},
					got: false,
				},
			],
		};

		cb(ret);
    },

	

	getBindInfo: function(callback) {
		var self = this;

		var onGet = function(ret) {
			if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
		};

		var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
			uid: cc.vv.userMgr.userId,
        };

		cc.vv.http.sendRequest('/get_bind_info', data, onGet);
    },

	getAwards: function(callback) {
		var self = this;

		var onGet = function(ret) {
			if (ret.errcode !== 0) {
                console.log(ret.errmsg);
				callback(false);
            } else {
                callback(true);
            }
		};

		var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
			uid: cc.vv.userMgr.userId,
        };

		cc.vv.http.sendRequest('/get_awards', data, onGet);
    },

	bind: function(bid, callback) {
		var self = this;

		var onGet = function(ret) {
			if (ret.errcode !== 0) {
                console.log(ret.errmsg);
				callback(false);
            } else {
                callback(true);
            }
		};

		var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
			uid: cc.vv.userMgr.userId,
			bid: bid,
        };

		cc.vv.http.sendRequest('/bind', data, onGet);
    },

	bindDone: function(callback) {
		// TODO
    },
});
