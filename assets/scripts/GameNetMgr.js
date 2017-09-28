
cc.Class({
    extends: cc.Component,

    properties: {
        dataEventHandler:null,
        roomId:null,
        maxNumOfGames:0,
        numOfGames:0,
        numOfMJ:0,
        seatIndex:-1,
        seats: null,
        numOfSeats: 0,
        turn:-1,
        button:-1,
        chupai:-1,
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
            this.seats[i].hastingpai = false;
            this.seats[i].flowers = [];
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

    isClubRoom : function() {
        return this.roomId.indexOf('c') == 0;
    },

    isOwner: function() {
        return !this.isClubRoom() && this.seatIndex == 0;
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

    getLocalIdxByUID : function(uid) {
        return this.getLocalIndex(this.getSeatIndexByID(uid));
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

    prepareReplay: function(roomInfo, detailOfGame) {
        console.log('prepareReplay');
        console.log(roomInfo);
        console.log(detailOfGame);
	
        this.roomId = roomInfo.room_tag;
        this.seats = roomInfo.info.seats;
        this.numOfSeats = roomInfo.info.seats.length;
        this.turn = detailOfGame.base_info.button;
        var baseInfo = detailOfGame.base_info;

        this.gamestate = 'playing';

        this.seatIndex = -1;
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
            s.hastingpai = false;
            s.flowers = [];

            if (cc.vv.userMgr.userId == s.userid) {
                this.seatIndex = i;
            }
        }

        if (this.seatIndex < 0)
            this.seatIndex = 0;

        var conf = baseInfo.conf;
        this.conf = conf;

        this.numOfHolds = 13;
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
	

    getGameType: function() {
        var conf = this.conf;

        if (conf && conf.type) {
            return conf.type;
        }

        return '';
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
                self.numOfHolds = 13;
            }
            else{
                console.log(data.errmsg);
            }
        });

        net.addHandler("login_finished",function(data){
            console.log("login_finished");
            cc.director.loadScene("mjgame");
        });

        net.addHandler("exit_result",function(data) {
            self.roomId = null;
            self.turn = -1;
            //self.seats = null;

            var reason = data.reason;

            var fnBack = function() {
                cc.director.loadScene("hall");
            };

            if (reason == 'kick') {
                cc.vv.alert.show('you are kicked by admin!', ()=>{
                    fnBack();
                });
            } else if (reason == 'request') {
                fnBack();
            }
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

                userMgr.login(ret=>{
                    console.log('login ret=' + ret);
                    if (ret == 0) {
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

            //cc.vv.wc.show(1);
            fnLogin();
        });

        net.addHandler("new_user_comes_push", function(data) {
            var seatIndex = data.seatindex;

            if (!self.seats)
                return;

            if(self.seats[seatIndex].userid > 0){
                self.seats[seatIndex].online = true;
            }
            else{
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user',self.seats[seatIndex]);
        });

        net.addHandler("user_state_push", function(data) {
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.online = data.online;
            self.dispatchEvent('user_state_changed',seat);
        });

        net.addHandler("user_ready_push", function(data) {
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

                if (s.flowers == null) {
                    s.flowers = [];
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

                if (s.flowers == null) {
                    s.flowers = [];
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
                seat.hastingpai = sd.tingpai;
                seat.tings = sd.tings;
                seat.flowers = sd.flowers;
                seat.ready = false;
           }

            for(var i = 0; i < self.numOfSeats; ++i) {
                var seat = self.seats[i];
                self.dispatchEvent('user_state_changed', seat);
            }

            self.dispatchEvent('user_hf_updated');
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
            self.numOfMJ = data.value;
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
            var flowers = data.flowers;
            var si = self.getSeatIndexByID(userId);
            self.doMopai(si, pai);

            if (flowers != null) {
                var sd = self.seats[si];

                sd.flowers = sd.flowers.concat(flowers);
                self.dispatchEvent('user_state_changed', sd);

                console.log('send user_hf_updated');
                self.dispatchEvent('user_hf_updated', self.seats[si]);
            }
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

        net.addHandler('game_hf_push', function(data) {
            console.log('game_hf_push');
            console.log(data);

            var hf = data.hf;

            for (var i = 0; i < self.seats.length; i++) {
                var seat = self.seats[i];

                if (hf[i] != null) {
                    seat.flowers = hf[i];
                    self.dispatchEvent('user_state_changed', seat);
                }
            }

            self.dispatchEvent('user_hf_updated');
        });

        net.addHandler("ting_notify_push",function(data) {
            console.log('ting_notify_push');
            console.log(data);
            var userId = data.userid;
            var tings = data.tings;
            var si = self.getSeatIndexByID(userId);
            self.doTing(si, tings);
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

        net.addHandler("demoji_push", data=>{
            self.dispatchEvent("demoji_push", data);
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

        net.addHandler('start_club_room', function(data) {
            console.log('start_club_room');
            console.log(data);

            console.log('enter ' + data.room_tag);
            cc.vv.userMgr.enterRoom(data.room_tag);
        });

        net.addHandler('club_room_updated', function(data) {
            console.log('club_room_updated');

            self.dispatchEvent('club_room_updated', data);
        });

        net.addHandler('club_room_removed', function(data) {
            console.log('club_room_removed');

            self.dispatchEvent('club_room_removed', data);
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

        if (seatIndex == this.seatIndex) {
            seatData.lastChiPai = null;
            console.log('set lastChiPai=null');
        }

        this.dispatchEvent('game_chupai_notify', { seatData: seatData, pai: pai });
    },

    getChiArr: function(pai, ign) {
        var type = parseInt(pai / 100);
        var c = pai % 100;


        var begin = c - type;

        var arr = [];
        for (var i = 0; i < 3; i++) {
            var k = begin + i;
            if (ign && k == c) {
                continue;
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

        if (seatIndex == this.seatIndex && holds.length > 2) {
            seatData.lastChiPai = pai % 100;
            console.log('set lastChiPai=' + pai);
        }

        this.dispatchEvent('chi_notify', { seatData: seatData, pai: pai });
    },

    doPeng: function(seatIndex, pai, skip) {
        var seatData = this.seats[seatIndex];
        var holds = seatData.holds;

        var c = pai % 100;

        if (holds != null && holds.length > 0) {
            for (var i = 0; i < 2; i++) {
                var idx = holds.indexOf(c);
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

    doTing:function(seatIndex, tings, skip) {
        var seatData = this.seats[seatIndex];

        seatData.hastingpai = true;
        if (tings) {
            seatData.tings = tings;
        }

        if (skip) {
            return;
        }

        this.dispatchEvent('ting_notify', seatData);
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

	sortMJ: function(holds) {
        holds.sort(function(a, b) {
            return a - b;
        });
    },

	getChuPaiList: function() {
        // TODO
        return [];
    },

    refreshMJ: function(data) {
        this.dispatchEvent("refresh_mj");
    },

    refreshBG: function(data) {
        console.log('refreshBG');
        this.dispatchEvent("refresh_bg", data);
    },
});

