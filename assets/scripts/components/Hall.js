
var Net = require("Net")
var Global = require("Global")

cc.Class({
    extends: cc.Component,

    properties: {
        lblName:cc.Label,
        lblID:cc.Label,
        lblGems:cc.Label,
        lblGolds: cc.Label,
        lblLottery: cc.Label,
        lblNotice:cc.Label,
        sprHeadImg: cc.Node,

        joinGameWin: cc.Node,
        createRoomWin: cc.Node,

        helpWin: cc.Node,
    },

    onShare: function() {
        var share = this.node.getChildByName('share');

        cc.vv.audioMgr.playButtonClicked();
        cc.vv.utils.showDialog(share, 'body', true);
    },

    onShareClose: function() {
        var share = this.node.getChildByName('share');

        cc.vv.audioMgr.playButtonClicked();
        cc.vv.utils.showDialog(share, 'body', false);
    },

    share: function(timeLine) {
        cc.vv.audioMgr.playButtonClicked();

        setTimeout(()=>{
            cc.vv.anysdkMgr.share("雀达麻友圈", "雀达麻友圈，包含了上海敲麻等多种流行麻将玩法。", null, timeLine);
        }, 100);
    },

    onShareWeChat: function() {
        this.share();
    },

    onShareTimeLine: function() {
        this.share(true);
    },

    onLoad: function () {
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }

        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }

        cc.vv.anysdkMgr.setPortrait();

/*
        this.initLabels();
		this.sprHeadImg.getComponent("ImageLoader").setUserID(cc.vv.userMgr.userId);

		this.initButtonHandler('bottom/btnHelp');
		this.initButtonHandler('bottom/btnSetting');
		this.initButtonHandler('left/btnFeedback');
		this.initButtonHandler('left/btnBind');
		this.initButtonHandler('btnInvest');

        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version:null,
                msg:"数据请求中...",
            }
        }

        if(!cc.vv.userMgr.gemstip){
            cc.vv.userMgr.gemstip = {
                version:null,
                msg:"数据请求中...",
            }
        }

        this.lblNotice.string = cc.vv.userMgr.notice.msg;

        this.refreshCoins();
        this.refreshNotice();
*/
        cc.vv.audioMgr.playBackGround();

		var self = this;

		this.node.on("rb-updated", function(event) {
            var id = event.detail.id;
            self.showTab(id);
        });

		cc.vv.gameNetMgr.dataEventHandler = this.node;
    },

    start: function() {
		if (!cc.vv) {
			return;
		}

        var roomId = cc.vv.userMgr.oldRoomId;
        if (roomId != null) {
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }
    },

	showTab: function(id) {
		var body = this.node.getChildByName('body');
		var tabs = [ 'discover', 'club', 'history', 'mine' ];

		for (var i = 0; i < tabs.length; i++) {
			var tab = body.getChildByName(tabs[i]);

			tab.active = i == id;
		}
    },

    refreshCoins: function() {
		var self = this;

		cc.vv.userMgr.simpleRequstWithResult('get_coins', {}, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.lblGems.string = ret.gems;
			self.lblLottery.string = ret.lottery;
			self.lblGolds.string = ret.golds;
		});
    },

    refreshNotice: function() {
        var self = this;

        cc.vv.userMgr.simpleRequstWithResult('get_message', { type: 'notice' }, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.lblNotice.string = ret.msg;
		});
    },

    initButtonHandler: function(path) {
        var btn = cc.find('entry/' + path, this.node);
        cc.vv.utils.addClickEvent(btn, this.node, "Hall", "onBtnClicked");
    },

    initLabels: function() {
        this.lblName.string = cc.vv.userMgr.userName;
        this.lblGems.string = cc.vv.userMgr.gems;
        this.lblID.string = 'ID:' + cc.vv.userMgr.userId;
    },

	onSettingsClose: function() {
		cc.vv.utils.showDialog(this.settingsWin, 'body', false);
    },

    onBtnClicked: function(event) {
        cc.vv.audioMgr.playButtonClicked();

		var name = event.target.name;
		var node = this.node;

        if (name == "btnSetting") {
			var setWin = node.getChildByName('audioSet');

			cc.vv.utils.showDialog(setWin, 'body', true);
        } else if (name == "btnHelp") {
			cc.vv.utils.showFrame(this.helpWin, 'head', 'body', true);
        } else if (name == 'btnFeedback') {
			var fb = node.getChildByName('feedback');

			cc.vv.utils.showDialog(fb, 'body', true);
        } else if (name == 'btnInvest') {
			var invest = node.getChildByName('invest');

			cc.vv.utils.showDialog(invest, 'body', true);
        } else if (name == 'btnBind') {
			var bind = this.node.getChildByName('bind');

			cc.vv.utils.showDialog(bind, 'body', true);
        }
    },

    onJoinGameClicked: function() {
        cc.vv.audioMgr.playButtonClicked();
		//cc.vv.utils.showDialog(this.joinGameWin, 'panel', true);
		this.joinGameWin.active = true;
    },

    onCreateRoomClicked:function(){
        cc.vv.audioMgr.playButtonClicked();

        if(cc.vv.gameNetMgr.roomId != null){
            cc.vv.alert.show("房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }

		//cc.vv.utils.showDialog(this.createRoomWin, 'body', true);

        this.createRoomWin.club_id = null;
		this.createRoomWin.active = true;
    },

    update: function (dt) {
/*
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }

        this.lblNotice.node.x = x;
*/
        if(cc.vv && cc.vv.userMgr.roomData != null){
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        }
    },
});

