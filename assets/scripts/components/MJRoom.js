
cc.Class({
    extends: cc.Component,

    properties: {
        lblRoomNo:{
            default: null,
            type: cc.Label
        },

        _seats:[],
        _voiceMsgQueue:[],
        _lastPlayingSeat:null,
        _playingSeat:null,
        _lastPlayTime:null,
    },

    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        this.initView();
        this.initSeats();
        this.initEventHandlers();
    },

    initView:function() {
    	var net = cc.vv.gameNetMgr;
        var prepare = this.node.getChildByName("prepare");
        var seats = this.node.getChildByName("seats");
		var valids = net.getValidLocalIDs();
		var nSeats = net.numOfSeats;

        for (var i = 0; i < seats.children.length; ++i) {
			var child = seats.children[i];

			this._seats.push(child.getComponent("Seat"));
			child.active = (valids.indexOf(i) >= 0);
        }

        this.refreshBtns();

        this.lblRoomNo = cc.find("Canvas/infobar/room/room_id").getComponent(cc.Label);
        this.lblRoomNo.string = cc.vv.gameNetMgr.roomId;

        var btnInvite = cc.find("Canvas/prepare/actions/btnInvite");
        if (btnInvite) {
            cc.vv.utils.addClickEvent(btnInvite, this.node, "MJRoom", "onBtnWeichatClicked");
        }
    },

	start: function() {
		var isIdle = cc.vv.gameNetMgr.numOfGames == 0;

        if ( cc.vv.replayMgr.isReplay() )
            return;

		if (isIdle) {
			cc.vv.net.send('ready');
		} else if (!isIdle) {
			cc.vv.net.send('ready');
		}
    },

    refreshBtns:function(){
    	var net = cc.vv.gameNetMgr;
        var prepare = this.node.getChildByName("prepare");
        var isIdle = net.numOfGames == 0;
        var isOwner = net.isOwner();
        var actions = prepare.getChildByName('actions');
        var waiting = prepare.getChildByName('waiting');

        waiting.active = isIdle;
        actions.active = isIdle && isOwner;
    },

    initEventHandlers:function(){
        var self = this;
        this.node.on('new_user',function(data){
            self.initSingleSeat(data.detail);
        });

        this.node.on('user_state_changed',function(data){
            self.refreshBtns();
            self.initSingleSeat(data.detail);
        });

        this.node.on('game_begin',function(data) {
            self.refreshBtns();
            self.initSeats();
        });

		this.node.on('game_sync', function(data) {
            self.refreshBtns();
            self.initSeats();
        });

        this.node.on('game_num', function(data) {
            self.refreshBtns();
        });

		this.node.on('game_state', function(data) {
			self.refreshBtns();
			self.initSeats();
		});

        this.node.on('ting_notify', function(data) {
            self.initSingleSeat(data.detail);
        });

		this.node.on('gang_notify', function(info) {
			var data = info.detail;

			if (cc.vv.replayMgr.isReplay()) {
				return;
			}
        });

        this.node.on('voice_msg',function(data){
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });

        this.node.on('chat_push',function(data){
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
        });

        this.node.on('quick_chat_push',function(data){
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);

            var index = parseInt(data.content);

            var info = cc.vv.chat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);

			index += 1;
			console.log(index);

			cc.vv.audioMgr.playQuyu(index);
        });

        this.node.on('emoji_push',function(data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            console.log(data);
            self._seats[localIdx].emoji(data.content);
        });
    },

    initSeats: function() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },

    initSingleSeat:function(seat) {
    	var net = cc.vv.gameNetMgr;
        var index = net.getLocalIndex(seat.seatindex);
        var isOffline = !seat.online;
        var isZhuang = (seat.seatindex == net.button);
		var ready = (net.gamestate == '') ? seat.ready : false;
        var flowers = seat.flowers;

		console.log('seat=');
		console.log(seat);
		console.log(flowers);
		console.log(seat.flowers)

        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
        this._seats[index].setZhuang(isZhuang);
		this._seats[index].setReady(ready);
        this._seats[index].setFlowers(flowers);
    },

    onBtnSettingsClicked:function(){
        cc.vv.popupMgr.showMenu();
    },

    onBtnBackClicked:function(){
        cc.vv.alert.show("返回大厅房间仍会保留，快去邀请大伙来玩吧！",function(){
            cc.director.loadScene("hall");
        },true);
    },

    onBtnChatClicked:function(){

    },

    onBtnWeichatClicked:function(){
        var title = "<梦幻卡五星>";
        cc.vv.anysdkMgr.share(title, "房号:" + cc.vv.gameNetMgr.roomId + " 玩法:" + cc.vv.gameNetMgr.getWanfa());
    },

    onBtnDissolveClicked:function() {
		cc.vv.net.send("dispress");
/*  TODO
        cc.vv.alert.show("解散房间不扣房卡，是否确定解散？",function(){
            cc.vv.net.send("dispress");
        },true);
*/
    },

    onBtnExit:function(){
        cc.vv.net.send("exit");
    },

    playVoice:function(){
        if(this._playingSeat == null && this._voiceMsgQueue.length){
            console.log("playVoice2");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);

            var msgInfo = JSON.parse(data.content);

            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            cc.vv.voiceMgr.writeVoice(msgfile,msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
            this._lastPlayTime = Date.now() + msgInfo.time;
        }
    },

    update: function (dt) {
/*
        var minutes = Math.floor(Date.now()/1000/60);
        if(this._lastMinute != minutes){
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10? "0"+h:h;

            var m = date.getMinutes();
            m = m < 10? "0"+m:m;
            this._timeLabel.string = "" + h + ":" + m;
        }
*/

        if(this._lastPlayTime != null){
            if(Date.now() > this._lastPlayTime + 200){
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        }
        else{
            this.playVoice();
        }
    },


    onPlayerOver:function(){
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
    },

    onDestroy:function(){
        cc.vv.voiceMgr.stop();
//        cc.vv.voiceMgr.onPlayCallback = null;
    }
});
