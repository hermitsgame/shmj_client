
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

        _emoji : null
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

        var btnInvite = cc.find('actions/btnInvite', prepare);
        var btnDissolve = cc.find('actions/btnDissolve', prepare);
        var btnLeave = prepare.getChildByName('btnLeave');

        cc.vv.utils.addClickEvent(btnInvite, this.node, 'MJRoom', 'onBtnWeichatClicked');
        cc.vv.utils.addClickEvent(btnDissolve, this.node, 'MJRoom', 'onBtnDissolveClicked');
        cc.vv.utils.addClickEvent(btnLeave, this.node, 'MJRoom', 'onBtnExit');

        var emoji = this.node.getChildByName('emoji');

        this._emoji = emoji;
        this.node.removeChild(emoji);
    },

    start: function() {
        var net = cc.vv.gameNetMgr;
        var isIdle = net.numOfGames == 0;

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
        var btnLeave = prepare.getChildByName('btnLeave');

        waiting.active = isIdle;
        actions.active = isIdle && isOwner;
        btnLeave.active = isIdle && !isOwner;

        if (isIdle) {
            var sprite = waiting.getComponent('SpriteMgr');

            sprite.setIndex(net.isClubRoom() ? 1 : 0);
        }
    },

    initEventHandlers: function() {
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

            var btn_chat = self.node.getChildByName("btn_chat").getComponent(cc.Button);

            btn_chat.interactable = false;
            cc.vv.audioMgr.playQuickChat(index, data.sender, ()=>{
                btn_chat.interactable = true;
            });
        });

        this.node.on('emoji_push',function(data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            console.log(data);
            //self._seats[localIdx].emoji(data.content + 1);

            self.emoji(idx, data.content + 1);
        });
    },

    emoji: function(seatindex, emoji_id) {
        var seat = cc.vv.gameNetMgr.seats[seatindex];
        var emoji = cc.instantiate(this._emoji);
        var y = Math.floor(Math.random() * 400 - 200);

        console.log('play emoji: ' + emoji_id);

        this.node.addChild(emoji);
        emoji.active = true;
        emoji.y = y;

        var name = emoji.getChildByName('name').getComponent(cc.Label);
        var anim = emoji.getChildByName('anim').getComponent(cc.Animation);

        name.string = seat.name + ': ';
        anim.play(emoji_id);

        emoji.runAction(cc.sequence(cc.moveBy(6, -1280, 0), cc.fadeOut(1), cc.callFunc(()=>{
            emoji.active = false;

            setTimeout(()=>{
                emoji.removeFromParent(true);
            }, 100);
        })));
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
        if (!seat.userid) {
            this._seats[index].reset();
            return;
        }

        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
        this._seats[index].setZhuang(isZhuang);
        this._seats[index].setReady(ready);
        this._seats[index].setFlowers(flowers);
    },

    onBtnSettingsClicked: function() {
        cc.vv.popupMgr.showMenu();
    },

    onBtnBackClicked: function() {
        cc.vv.alert.show("返回大厅房间仍会保留，快去邀请大伙来玩吧！", ()=>{
            cc.director.loadScene("hall");
        }, true);
    },

    onBtnChatClicked: function() {

    },

    onBtnWeichatClicked: function() {
        var title = "<麻友圈>";
        cc.vv.anysdkMgr.share(title, "房号:" + cc.vv.gameNetMgr.roomId + " 玩法:" + cc.vv.gameNetMgr.getWanfa());
    },

    onBtnDissolveClicked: function() {
        cc.vv.alert.show("解散房间不扣房卡，是否确定解散？", ()=>{
            cc.vv.net.send("dispress");
        }, true);
    },

    onBtnExit:function() {
        cc.vv.net.send("exit");
    },

    playVoice: function() {
        var net = cc.vv.gameNetMgr;
	
        if (this._playingSeat == null && this._voiceMsgQueue.length > 0) {
            console.log("playVoice2");
            var data = this._voiceMsgQueue.shift();

            var idx = net.getSeatIndexByID(data.sender);
            var localIndex = net.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);

            var msgInfo = data.content;

            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
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
