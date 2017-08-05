
cc.Class({
    extends: cc.Component,

    properties: {
        dataEventHandler:null,
        roomId:null,
        maxNumOfGames:0,
        numOfGames:0,
        numOfMJ:0,
        numOfHolds: 13,
        seatIndex:-1,
        seats: null,
        numOfSeats: 0,
        turn:-1,
        button:-1,
        wildcard: -1,
        chupai: -1,
        gamestate: '',
        dices: null,
        isOver: false,
        dissoveData: null,

		connecting: false,
    },

    reset: function() {
        this.turn = -1;
        this.chupai = -1,
        this.button = -1;
		this.wildcard = -1;
        this.gamestate = '';
        this.curaction = null;
		this.dices = null;
        for (var i = 0; i < this.seats.length; i++) {
            this.seats[i].holds = [];
            this.seats[i].folds = [];
            this.seats[i].pengs = [];
			this.seats[i].chis = [];
            this.seats[i].angangs = [];
            this.seats[i].diangangs = [];
            this.seats[i].wangangs = [];
            this.seats[i].ready = false;
            this.seats[i].hued = false;
            this.seats[i].tings = [];
            this.seats[i].hasmingpai = false;
            this.seats[i].kou = [];
			this.seats[i].maidi = false;
			this.seats[i].dingdi = false;
        }

        this.dissoveData = null;
    },

    clear: function() {
        this.dataEventHandler = null;
        if(this.isOver == null){
            this.seats = null;
            this.roomId = null;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
            this.numOfSeats = 0;
        }
    },

    dispatchEvent: function(event,data) {
        if(this.dataEventHandler){
            this.dataEventHandler.emit(event,data);
        }
    },

    getSeatIndexByID:function(userId){
        for(var i = 0; i < this.seats.length; ++i){
            var s = this.seats[i];
            if(s.userid == userId){
                return i;
            }
        }
        return -1;
    },

    isOwner: function() {
        return this.seatIndex == 0;
    },

	isButton: function() {
		return this.seatIndex == this.button;
    },

	isPlaying: function() {
		var state = this.gamestate;
		var states = [ 'begin', 'playing' ];

		return states.indexOf(state) >= 0;
    },

    getSeatByID: function(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },

    getSelfData: function() {
        return this.seats[this.seatIndex];
    },

    getLocalIndex: function(index) {
        var id = 0;
        var nSeats = this.numOfSeats;

		var ids = this.getValidLocalIDs();

		if (index >= nSeats) {
			console.log('getLocalIndex: index=' + index + ' nSeats=' + nSeats);
		}

        id = (index - this.seatIndex + nSeats) % nSeats;

        return ids[id];
    },

	getSide: function(localIndex) {
		var sides = [ 'south', 'east', 'north', 'west' ];

		return sides[localIndex];
    },

	getValidLocalIDs: function() {
		var nSeats = this.numOfSeats;
		var ids = [ 0 ];

		if (nSeats == 4) {
			ids = [ 0, 1, 2, 3 ];
		} else if (nSeats == 2) {
			ids = [ 0, 2 ];
		} else if (nSeats == 3) {
			ids = [ 0, 1, 3 ];
		}

		return ids;
    },

    prepareReplay: function(roomInfo,detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.numOfSeats = roomInfo.seats.length;
        this.turn = detailOfGame.base_info.button;
        var baseInfo = detailOfGame.base_info;
		this.wildcard = baseInfo.wc || -1;
		this.gamestate = 'playing';
        for(var i = 0; i < this.seats.length; ++i){
            var s = this.seats[i];
            s.seatindex = i;
            s.score = null;
            s.holds = baseInfo.game_seats[i].slice(0);
            s.pengs = [];
			s.chis = [];
            s.angangs = [];
            s.diangangs = [];
            s.wangangs = [];
            s.folds = [];
            s.tings = [];
            s.hasmingpai = false;
            s.kou = [];
			s.maidi = false;
			s.dingdi = false;

            if (cc.vv.userMgr.userId == s.userid) {
                this.seatIndex = i;
            }
        }

		var conf = baseInfo.conf;
        this.conf = conf;

		this.checkType();

		this.numOfGames = baseInfo.index + 1;
		this.maxNumOfGames = conf.maxGames;
    },

    getWanfa: function() {
        var conf = this.conf;
        var strArr = [];

        if (conf) {
			if (conf.maxGames != null && conf.maxFan != null) {
				var type = conf.type;
				// TODO
			}

            return strArr.join(' ');
        }

        return '';
	},

	checkType: function() {
		var conf = this.conf;
		var num = 13;

		if (conf.type == 'wzmj') {
			num = 16;
		}

		this.numOfHolds = num;
	},

	getGameType: function() {
		var conf = this.conf;

		if (conf && conf.type) {
			return conf.type;
		}

		return '';
	},

	needBigFolds: function() {
		return (2 == this.numOfSeats && 'wzmj' == this.getGameType());
	},

    initHandlers: function() {
        var self = this;
		var net = cc.vv.net;

        net.addHandler("login_result", function(data) {
            console.log("get event: login_result");
            if (data.errcode === cc.vv.global.const_code.OK) {
                var data = data.data;
                self.roomId = data.roomid;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.numOfSeats = data.numofseats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;

				self.checkType();
            }
            else{
                console.log(data.errmsg);
            }
        });

        net.addHandler("login_finished",function(data){
            console.log("login_finished");
            cc.director.loadScene("mjgame");
        });

        net.addHandler("exit_result",function(data){
            self.roomId = null;
            self.turn = -1;
            //self.seats = null;
        });

        net.addHandler("exit_notify_push",function(data){
           var userId = data;
           var s = self.getSeatByID(userId);
           if(s != null){
               s.userid = 0;
               s.name = "";
               self.dispatchEvent("user_state_changed",s);
           }
        });

        net.addHandler("dispress_push",function(data){
            console.log("get event dispress_push");
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
            cc.director.loadScene("hall");
        });

        net.addHandler("need_reconnect",function(data) {
			var userMgr = cc.vv.userMgr;

			console.log('get need_reconnect');

			if (userMgr.userId == null) {
				console.log('userid == null, return');
				return;
			}

			if (self.connecting) {
				console.log('is connecting, return');
				return;
			}
/*
            if(self.roomId == null){
                cc.director.loadScene("hall");
            }
            else{
                if(self.isOver == false){
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                }
                else{
                    self.roomId = null;
                }
            }
*/

			userMgr.userId = null;
			self.connecting = true;

			var retry = 0;
			var max_retry = 10;

			var fnLogin = function() {
				console.log('try login, retry=' + retry);

				userMgr.login(function(ret) {
					if (ret) {
						console.log('reconnect success');
						cc.vv.wc.hide();

						self.connecting = false;

						if (userMgr.roomData != null) {
							userMgr.enterRoom(userMgr.roomData);
							userMgr.roomData = null;
						}

						return;
					}

					retry++;

					console.log('reconnect fail: retry=' + retry);

					if (retry >= max_retry) {
						self.connecting = false;
						cc.director.loadScene("login");
						return;
					}

					setTimeout(fnLogin, 3000);
				});
			}

			cc.vv.wc.show(1);
			fnLogin();
        });

        net.addHandler("new_user_comes_push", function(data) {
            var seatIndex = data.seatindex;
            if(self.seats[seatIndex].userid > 0){
                self.seats[seatIndex].online = true;
            }
            else{
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user',self.seats[seatIndex]);
        });

        net.addHandler("user_state_push",function(data){
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.online = data.online;
            self.dispatchEvent('user_state_changed',seat);
        });

        net.addHandler("user_ready_push",function(data){
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.ready = data.ready;

			if (self.gamestate == '') {
				self.dispatchEvent('user_state_changed', seat);
			}
        });

		net.addHandler("game_dice_push",function(data) {
			self.dices = data;
			self.dispatchEvent('game_dice', data);
        });

		net.addHandler("game_wildcard_push",function(data) {
			self.wildcard = data.value;
			self.dispatchEvent('game_wildcard', data.value);
        });

        net.addHandler("user_dingpiao_push",function(data) {
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.dingpiao = data.dingpiao;
            console.log("user_dingpiao_push: " + data.dingpiao);
            self.dispatchEvent('user_state_changed', seat);
        });

        net.addHandler("game_holds_push",function(data) {
            var seat = self.seats[self.seatIndex];
            console.log(data);
            seat.holds = data;

            for (var i = 0; i < self.seats.length; ++i) {
                var s = self.seats[i];
                if(s.folds == null){
                    s.folds = [];
                }
                if(s.pengs == null){
                    s.pengs = [];
                }

				if(s.chis == null){
                    s.chis = [];
                }

                if(s.angangs == null){
                    s.angangs = [];
                }
                if(s.diangangs == null){
                    s.diangangs = [];
                }
                if(s.wangangs == null){
                    s.wangangs = [];
                }

                if (s.tings == null) {
                    s.tings = [];
                }

                if (s.kou == null) {
                    s.kou = [];
                }

                s.ready = false;

                self.dispatchEvent('user_state_changed', s);
            }

            self.dispatchEvent('game_holds');
        });

		net.addHandler("game_holds_update_push", function(data) {
			var seat = self.seats[self.seatIndex];

			console.log('game_holds_update_push');
			console.log(data);

            seat.holds = data;
			self.dispatchEvent('game_holds_update');
		});

		net.addHandler("game_holds_len_push", function(data) {
			var seatIndex = data.seatIndex;
			var seat = self.seats[seatIndex];

			console.log('game_holds_len_push');

            seat.holdsLen = data.len;
			self.dispatchEvent('game_holds_len', seat);
		});

		net.addHandler("game_holds_updated_push", function(data) {
			console.log('game_holds_updated_push');

			self.dispatchEvent('game_holds_updated');
		});

		net.addHandler('game_state_push', function(data) {
			console.log('game_state_push');
			console.log(data);

			self.gamestate = data.state;
			self.button = data.button;

			self.dispatchEvent('game_state');
		});

		net.addHandler('game_maidi_push', function(data) {
			console.log('game_maidi_push');
			console.log(data);

			var seatindex = data.seatindex;
			var seat = self.seats[seatindex];

			seat.maidi = true;
			self.dispatchEvent('game_maidi', seat);
		});

		net.addHandler('game_dingdi_push', function(data) {
			console.log('game_dingdi_push');
			console.log(data);

			var seatindex = data.seatindex;
			var seat = self.seats[seatindex];

			seat.dingdi = true;
			self.dispatchEvent('game_dingdi', seat);
		});

        net.addHandler("game_begin_push", function(data) {
            console.log('game_begin_push');
            self.button = data.value;
            self.turn = self.button;
            self.gamestate = "begin";

			for (var i = 0; i < self.seats.length; i++) {
                var s = self.seats[i];
                if (s.folds == null) {
                    s.folds = [];
                }

                if (s.pengs == null) {
                    s.pengs = [];
                }

				if (s.chis == null) {
                    s.chis = [];
                }

                if (s.angangs == null) {
                    s.angangs = [];
                }

                if (s.diangangs == null) {
                    s.diangangs = [];
                }

                if (s.wangangs == null) {
                    s.wangangs = [];
                }

                if (s.tings == null) {
                    s.tings = [];
                }

                if (s.kou == null) {
                    s.kou = [];
                }

                s.ready = false;

                self.dispatchEvent('user_state_changed', s);
            }

            self.dispatchEvent('game_begin');
        });

        net.addHandler("game_playing_push",function(data){
            console.log('game_playing_push');
            self.gamestate = "playing";
            self.dispatchEvent('game_playing');
        });

        net.addHandler("game_sync_push", function(data) {
            console.log("game_sync_push");
            console.log(data);
            self.numOfMJ = data.numofmj;
            self.gamestate = data.state;

            self.turn = data.turn;
            self.button = data.button;
			self.wildcard = data.wildcard || -1;
            self.chupai = data.chuPai;
            self.numOfSeats = data.numOfSeats;
            for (var i = 0; i < self.numOfSeats; ++i) {
                var seat = self.seats[i];
                var sd = data.seats[i];
                seat.seatindex = i;
                seat.holds = sd.holds;
                seat.folds = sd.folds;
                seat.angangs = sd.angangs;
                seat.diangangs = sd.diangangs;
                seat.wangangs = sd.wangangs;
                seat.pengs = sd.pengs;
				seat.chis = sd.chis;
                seat.hued = sd.hued;
                seat.iszimo = sd.iszimo;
                seat.huinfo = sd.huinfo;
                seat.tings = sd.tings;
                seat.hasmingpai = sd.mingpai;
                seat.dingpiao = sd.dingpiao;
                seat.kou = sd.kou;
				seat.maidi = sd.maidi;
				seat.dingdi = sd.dingdi;

				seat.ready = false;
           }

            for(var i = 0; i < self.numOfSeats; ++i) {
                var seat = self.seats[i];
                self.dispatchEvent('user_state_changed', seat);
            }

			self.doSync();
        });

        net.addHandler("hangang_notify_push",function(data){
            self.dispatchEvent('hangang_notify',data.value);
        });

        net.addHandler("game_action_push",function(data){
            self.curaction = data;
            console.log("game_action_push");
            console.log(data);
            self.dispatchEvent('game_action',data);
        });

        net.addHandler("game_chupai_push",function(data){
            console.log('game_chupai_push');
            console.log(data);
            var turnUserID = data.value;
            var si = self.getSeatIndexByID(turnUserID);
            self.doTurnChange(si);
        });

        net.addHandler("game_num_push",function(data){
            console.log('game_num_push');
            console.log(data);
            self.numOfGames = data.value;
            self.dispatchEvent('game_num',data);
        });

        net.addHandler("game_over_push", function(data) {
            console.log("game_over_push");
            var results = data.results;
            for (var i = 0; i <  self.seats.length; ++i) {
                self.seats[i].score = results.length == 0 ? 0:results[i].totalscore;
            }


            self.dispatchEvent('game_over', data);
            if (data.endinfo) {
                self.isOver = true;
                self.dispatchEvent('game_end', data.endinfo);
            }

            self.reset();
            for(var i = 0; i <  self.seats.length; ++i){
                self.dispatchEvent('user_state_changed',self.seats[i]);
            }
        });

        net.addHandler("mj_count_push",function(data){
            console.log('mj_count_push');
            self.numOfMJ = data.value
            self.dispatchEvent('mj_count',data.value);
        });

        net.addHandler("hu_push",function(data){
            console.log('hu_push');
            console.log(data);
            self.doHu(data);
        });

        net.addHandler("game_chupai_notify_push",function(data){
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doChupai(si,pai);
        });

        net.addHandler("game_mopai_push",function(data){
            console.log('game_mopai_push');
            console.log(data);
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doMopai(si, pai);
        });

        net.addHandler("guo_notify_push",function(data){
            console.log('guo_notify_push');
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doGuo(si,pai);
        });

        net.addHandler("guo_result",function(data){
            console.log('guo_result');
            self.dispatchEvent('guo_result');
        });

        net.addHandler("guohu_push",function(data){
            console.log('guohu_push');
            self.dispatchEvent("push_notice",{info:"过胡",time:1.5});
        });

        net.addHandler("peng_notify_push",function(data){
            console.log('peng_notify_push');
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doPeng(si,data.pai);
        });

		net.addHandler("chi_notify_push", function(data) {
            console.log('chi_notify_push');
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doChi(si, data.pai);
        });

        net.addHandler("gang_notify_push",function(data){
            console.log('gang_notify_push');
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);

/*
			for (var i = 0; i <  self.seats.length; ++i) {
                self.dispatchEvent('user_state_changed', self.seats[i]);
            }
*/
            self.doGang(si, pai, data.gangtype);
        });

        net.addHandler("ming_notify_push",function(data){
            console.log('ming_notify_push');
            var userId = data.userid;
            var tings = data.tings;
            var holds = data.holds;
            var kou = data.kou;
            var si = self.getSeatIndexByID(userId);
            self.doMing(si, holds, tings, kou);
        });

        net.addHandler("chat_push",function(data){
            self.dispatchEvent("chat_push",data);
        });

        net.addHandler("quick_chat_push",function(data){
            self.dispatchEvent("quick_chat_push",data);
        });

        net.addHandler("emoji_push",function(data){
            self.dispatchEvent("emoji_push",data);
        });

        net.addHandler("dissolve_notice_push",function(data){
            self.dissoveData = data;
            self.dispatchEvent("dissolve_notice",data);
        });

		net.addHandler("dissolve_done_push",function(data){
            self.dissoveData = null;
            self.dispatchEvent("dissolve_done", data);
        });

        net.addHandler("dissolve_cancel_push",function(data){
            self.dissoveData = null;
            self.dispatchEvent("dissolve_cancel",data);
        });

        net.addHandler("voice_msg_push",function(data){
            self.dispatchEvent("voice_msg",data);
        });
    },

    doGuo:function(seatIndex, pai, skip) {
        var seatData = this.seats[seatIndex];
        var folds = seatData.folds;
        folds.push(pai);

		if (skip) {
			return;
		}

	    this.dispatchEvent('guo_notify',seatData);
    },

    doMopai:function(seatIndex, pai, skip) {
        var seatData = this.seats[seatIndex];
		var holds = seatData.holds;
        if (holds != null && holds.length > 0 && pai >= 0) {
            holds.push(pai);
        }

		if (skip) {
			return;
		}

        this.dispatchEvent('game_mopai',{seatIndex:seatIndex, pai:pai});
    },

    doChupai: function(seatIndex, pai, skip) {
        this.chupai = pai;
        var seatData = this.seats[seatIndex];
		var holds = seatData.holds;

        if (holds != null && holds.length > 0) {
            var idx = holds.indexOf(pai);
			if (idx != -1) {
 	           holds.splice(idx, 1);
			}
        }

		if (skip) {
			return;
		}

        this.dispatchEvent('game_chupai_notify', { seatData: seatData, pai: pai });
    },

	getChiArr: function(pai, ign) {
		var type = parseInt(pai / 100);
		var c = pai % 100;
		var wc = this.wildcard;

		if (c == 47) {
			c = wc;
		}

		var begin = c - type;

		var arr = [];
		for (var i = 0; i < 3; i++) {
			var k = begin + i;
			if (ign && k == c) {
				continue;
			}

			if (k == wc) {
				k = 47;
			}

			arr.push(k);
		}

		return arr;
    },

	doChi: function(seatIndex, pai, skip) {
        var seatData = this.seats[seatIndex];
		var holds = seatData.holds;

        if (holds != null && holds.length > 0) {
			var mjs = this.getChiArr(pai, true);
            for (var i = 0; i < 2; i++) {
				var c = mjs[i];
                var idx = holds.indexOf(c);
				if (idx == -1) {
					break;
				}

				holds.splice(idx, 1);
            }
        }

        var chis = seatData.chis;
        chis.push(pai);

		if (skip) {
			return;
		}

        this.dispatchEvent('chi_notify', { seatData: seatData, pai: pai });
    },

    doPeng: function(seatIndex, pai, skip) {
        var seatData = this.seats[seatIndex];
		var holds = seatData.holds;

        if (holds != null && holds.length > 0) {
            for (var i = 0; i < 2; ++i) {
                var idx = holds.indexOf(pai);
				if (idx == -1) {
					break;
				}

				holds.splice(idx, 1);
            }
        }

        var pengs = seatData.pengs;
        pengs.push(pai);

		if (skip) {
			return;
		}

        this.dispatchEvent('peng_notify', { seatData: seatData, pai: pai });
    },

    doMing:function(seatIndex, holds, tings, kou, skip) {
        var seatData = this.seats[seatIndex];

        seatData.hasmingpai = true;
        if (tings) {
            seatData.tings = tings;
        }

        if (kou) {
            seatData.kou = kou;
        }

        if (seatIndex != this.seatIndex && holds) {
            seatData.holds = holds;
        }

		if (skip) {
			return;
		}

        this.dispatchEvent('ming_notify', seatData);
    },

    getGangType: function(seatData, pai) {
        if(seatData.pengs.indexOf(pai) != -1){
            return "wangang";
        }
        else{
            var cnt = 0;
            for(var i = 0; i < seatData.holds.length; ++i){
                if(seatData.holds[i] == pai){
                    cnt++;
                }
            }
            if(cnt == 3){
                return "diangang";
            }
            else{
                return "angang";
            }
        }
    },

    doGang: function(seatIndex, pai, gangtype, skip) {
        var seatData = this.seats[seatIndex];
		var holds = seatData.holds;

		console.log('doGang, si=' + seatIndex);

        if(!gangtype){
            gangtype = this.getGangType(seatData,pai);
        }

        if(gangtype == "wangang"){
            if(seatData.pengs.indexOf(pai) != -1){
                var idx = seatData.pengs.indexOf(pai);
                if(idx != -1){
                    seatData.pengs.splice(idx,1);
                }
            }
            seatData.wangangs.push(pai);
        }

        if (holds != null && holds.length > 0) {
            for (var i = 0; i < 4; ++i) {
                var idx = holds.indexOf(pai);
                if (idx == -1) {
                    break;
                }

                holds.splice(idx, 1);
            }
        }

        if (seatData.kou) {
            var id = seatData.kou.indexOf(pai);
            if (id != -1) {
                seatData.kou.splice(id, 1);
            }
        }

        if (gangtype == "angang") {
            seatData.angangs.push(pai);
        }
        else if(gangtype == "diangang") {
            seatData.diangangs.push(pai);
        }

		if (skip) {
			return;
		}

        this.dispatchEvent('gang_notify', { seatData: seatData, gangtype: gangtype, pai: pai });
    },

    doHu: function(data, skip) {
		if (skip) {
			return;
		}

        this.dispatchEvent('hupai', data);
    },

    doTurnChange: function(si, skip) {
        var data = {
            last: this.turn,
            turn: si,
        }

        this.turn = si;

		if (skip) {
			return;
		}

        this.dispatchEvent('game_chupai',data);
    },

	doSync: function() {
		this.dispatchEvent('game_sync');
    },

    connectGameServer: function(data) {
        this.dissoveData = null;

        var sd = {
            roomid: data.roomid,
            userName : cc.vv.userMgr.userName
        };

		cc.vv.wc.show(2);
        cc.vv.net.prepare_connect();
        cc.vv.net.send("login", sd);
    },

    checkCanChuPai: function(mjid) {
        var seats = this.seats;
        var found  = false;

        for (var i = 0; i < seats.length; i++) {
            var sd = seats[i];
            if (i == this.seatIndex) {
                continue;
            }

            var tings = sd.tings;

            if (tings && tings.indexOf(mjid) >= 0) {
                found = true;
                break;
            }
        }

        return !found;
    },

	convert: function(holds, wc) {
		if (wc < 0) {
			return;
		}

        for (var i = 0; i < holds.length; i++) {
                var pai = holds[i];
                if (pai == wc) {
                        pai = 1;
                } else if (pai == 47) {
                        pai = wc;
                }

				holds[i] = pai;
        }
	},

	revert: function(holds, wc) {
		if (wc < 0) {
			return;
		}

        for (var i = 0; i < holds.length; i++) {
                var pai = holds[i];
                if (pai == 1) {
                        pai = wc;
                } else if (pai == wc) {
                        pai = 47;
                }

				holds[i] = pai;
        }
	},

	sortMJ: function(holds,  wildcard) {
		var wc = wildcard;
		if (null == wc) {
			wc = this.wildcard;
		}

		this.convert(holds, wc);

        holds.sort(function(a, b) {
            return a - b;
        });

		this.revert(holds, wc);
    },

	getChuPaiList: function() {
		var seat = this.seats[this.seatIndex];
		var holds = seat.holds;
		var chupais = [];
		var wc = this.wildcard;

		var map = { '41': 0, '42': 0, '43': 0, '44': 0, '45': 0, '46': 0 };
		var _holds = holds.slice(0);

		this.convert(_holds, wc);

		for (var i = 0; i < _holds.length; i++) {
			var pai = _holds[i];

			if (pai >= 41 && pai <= 46) {
				map[pai] += 1;
			}
		}

		for (var k in map) {
			var pai = parseInt(k);
			var num = map[k];

			if (1 == num) {
				chupais.push(pai);
			}
		}

		if (chupais.length > 0) {
			this.revert(chupais, wc);
			return chupais;
		}

		for (var i = 0; i < holds.length; i++) {
			var pai = holds[i];

			if (pai != wc) {
				chupais.push(pai);
			}
		}

		return chupais;
    },

    refreshMJ: function(data) {
        this.dispatchEvent("refresh_mj");
    },

    refreshBG: function(data) {
        console.log('refreshBG');
        this.dispatchEvent("refresh_bg", data);
    },
});
