
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

        _lastMinute: 0,
        _timeLabel: null,

        _emoji : null,

        _demoji : [],
        _semoji : [],
        
        _lastCheck: 0,
    },

    onLoad: function () {
        if(cc.vv == null)
            return;

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
        let addEvent = cc.vv.utils.addClickEvent;

        for (let i = 0; i < seats.children.length; ++i) {
            let child = seats.children[i];

            this._seats.push(child.getComponent("Seat"));
            child.active = (valids.indexOf(i) >= 0);

            let demoji = child.getChildByName('demoji');
            let semoji = child.getChildByName('semoji');

            this._demoji.push(demoji);
            this._semoji.push(semoji);
            child.removeChild(demoji);
            child.removeChild(semoji);

            let mask = cc.find('info/mask', child);
            addEvent(mask, this.node, 'MJRoom', 'onBtnMask');
        }

        this.refreshBtns();

        this.lblRoomNo = cc.find("Canvas/roominfo/room_id").getComponent(cc.Label);
        this.lblRoomNo.string = net.roomId;

        let btnInvite = cc.find('actions/btnInvite', prepare);
        let btnReady = cc.find('actions/btnReady', prepare);

        cc.vv.utils.addClickEvent(btnInvite, this.node, 'MJRoom', 'onBtnWeichatClicked');
        cc.vv.utils.addClickEvent(btnReady, this.node, 'MJRoom', 'onBtnReady');

        let emoji = this.node.getChildByName('emoji');

        this._emoji = emoji;
        this.node.removeChild(emoji);
        
        this._timeLabel = cc.find('devinfo/time', this.node).getComponent(cc.Label);
    },

    onBtnMask: function(event) {
        let info = event.target.parent;
        
        info.active = false;
    },

    onBtnReady : function() {
        cc.vv.net.send('ready');
    },

    start: function() {
        let net = cc.vv.gameNetMgr;
        let isIdle = net.numOfGames == 0;

        this.initSeats();

        if ( cc.vv.replayMgr.isReplay() )
            return;

        if (!isIdle)
            cc.vv.net.send('ready');
    },
    
    updateBattery: function() {
        let power = cc.find('devinfo/power', this.node);
        let progress = power.getChildByName('progress');
        let sptmgr = progress.getComponent('SpriteMgr');
        let sprite = progress.getComponent(cc.Sprite);
        let info = cc.vv.anysdkMgr.getBatteryInfo();

        power.active = true;
        sptmgr.setIndex(info.state == 'charging' ? 1 : 0);

        sprite.fillRange = info.power  / 100;
    },
    
    updateSignal: function() {
        let network = cc.find('devinfo/network', this.node);
        let state = network.getChildByName('state');
        let wifi = network.getChildByName('wifi');
        let signal = wifi.getComponent('SpriteMgr');
        let desc = state.getComponent(cc.Label);
        
        let info = cc.vv.anysdkMgr.getNetworkInfo();
        let type = info.type;
        let isWifi = type == 'wifi';
        
        wifi.active = isWifi;
        state.active = !isWifi;
        
        if (isWifi) {
            signal.setIndex(info.strength - 1);
        } else {
            desc.string = type;
        }
    },

    refreshBtns:function(){
    	let net = cc.vv.gameNetMgr;
        let prepare = this.node.getChildByName("prepare");
        let isIdle = net.numOfGames == 0;
        let isOwner = net.isOwner();
        let seat = net.getSelfData();
        let actions = prepare.getChildByName('actions');
        let btnReady = actions.getChildByName('btnReady');
        let waiting = prepare.getChildByName('waiting');

        waiting.active = isIdle;
        actions.active = isIdle;
        btnReady.active = !seat.ready;

        if (isIdle) {
            let sprite = waiting.getComponent('SpriteMgr');

            sprite.setIndex(net.isClubRoom() ? 1 : 0);
        }
    },

    initEventHandlers: function() {
        let self = this;
        let node = this.node;
        let net = cc.vv.gameNetMgr;
        
        node.on('new_user',function(data){
            self.initSingleSeat(data.detail);
        });

        node.on('user_state_changed',function(data){
            self.refreshBtns();
            self.initSingleSeat(data.detail);
        });

        node.on('game_begin',function(data) {
            self.refreshBtns();
            self.initSeats();
        });

        node.on('game_sync', function(data) {
            self.refreshBtns();
            self.initSeats();
        });

        node.on('game_num', function(data) {
            self.refreshBtns();
        });

        node.on('game_state', function(data) {
            self.refreshBtns();
            self.initSeats();
        });

        node.on('ting_notify', function(data) {
            self.initSingleSeat(data.detail);
        });


        node.on('user_ready', data=>{
            self.initSingleSeat(data.detail);
        });
        node.on('gang_notify', function(info) {
            var data = info.detail;

            if (cc.vv.replayMgr.isReplay()) {
                return;
            }
        });

        node.on('voice_msg',function(data){
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });

        node.on('chat_push',function(data){
            var data = data.detail;
            var idx = net.getSeatIndexByID(data.sender);
            var localIdx = net.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
        });

        node.on('quick_chat_push',function(data){
            var data = data.detail;
            var idx = net.getSeatIndexByID(data.sender);
            var localIdx = net.getLocalIndex(idx);

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

        node.on('emoji_push',function(data) {
            var data = data.detail;
            var idx = net.getSeatIndexByID(data.sender);
            var localIdx = net.getLocalIndex(idx);
            console.log(data);
            self._seats[localIdx].emoji(data.content + 1);
            //self.emoji(idx, data.content + 1);
        });

        node.on('demoji_push', data=>{
            var data = data.detail;
            var sender = net.getLocalIdxByUID(data.sender);
            var target = net.getLocalIdxByUID(data.target);
            var id = data.id;

            console.log('demoji_push: ' + sender + ' to ' + target + ' ' + id);

            self.demoji(sender, target, id);
        });
    },

    demoji: function(sender, target, id) {
        var seats = this.node.getChildByName("seats");
        var sseat = seats.children[sender];
        var dseat = seats.children[target];
        var demoji = cc.instantiate(this._demoji[target]);
        var semoji = cc.instantiate(this._semoji[sender]);

        sseat.addChild(semoji);
        dseat.addChild(demoji);

        var anims = [ 'fanqie', 'egg', 'fozu', 'beer', 'bianbian', 'qinwen', 'liwu', 'meigui', 'zhadan' ];
        var anim = anims[id];

        var spos = sseat.convertToWorldSpace(semoji.getPosition());
        var dpos = dseat.convertToWorldSpace(demoji.getPosition());

        var fnPlay = cc.callFunc(()=>{
            var dnode = demoji.getComponent(cc.Animation);

            dnode.on('finished', ()=>{
                dseat.removeChild(demoji);
                sseat.removeChild(semoji);
            });

            dnode.play(anim);
        });

        semoji.getComponent('SpriteMgr').setIndex(id);

        var acts = cc.sequence(cc.moveBy(0.3, dpos.x - spos.x, dpos.y - spos.y),
                                cc.hide(),
                                fnPlay);

        semoji.runAction(acts);
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
        if (!seat.userid) {
            this._seats[index].reset();
            return;
        }

        this._seats[index].setInfo(seat.name.slice(0, 5), seat.score);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
        this._seats[index].setZhuang(isZhuang);
        this._seats[index].setReady(ready);
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
        let title = "<雀达麻友圈> - 房间分享";
        let game = cc.vv.gameNetMgr;
        let content = '房号:' + game.roomId + ' 玩法:' + game.getWanfa();

        let data = {
            room : game.roomId
        };

        cc.vv.anysdkMgr.share(title, content, data);
    },

    onBtnDissolveClicked: function() {
        cc.vv.alert.show("解散房间不扣房卡，是否确定解散？", ()=>{
            cc.vv.net.send("dispress");
        }, true);
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
        let minutes = Math.floor(Date.now()/1000/60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            let date = new Date();
            let h = date.getHours();
            h = h < 10 ? '0' + h : h;

            let m = date.getMinutes();
            m = m < 10 ? '0'+ m : m;
            this._timeLabel.string =  h + ':' + m;
        }

        let now = Date.now();

        if (this._lastPlayTime != null) {
            if (now > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
        
        let secs = parseInt(now / 1000);
        if (secs > this._lastCheck && secs % 2 == 0) {
            this.updateBattery();
            this.updateSignal();
            this._lastCheck = secs;
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

