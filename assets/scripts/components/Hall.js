
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
            cc.vv.anysdkMgr.share("雀达麻友圈",
                "雀达麻友圈，包含了上海敲麻等多种流行麻将玩法。",
                null,
                timeLine);
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
        if (!cc.vv)
            return;

        let userMgr = cc.vv.userMgr;

        let roomId = userMgr.oldRoomId;
        if (roomId != null) {
            userMgr.oldRoomId = null;
            userMgr.enterRoom(roomId);
        } else if(userMgr.roomData != null) {
            userMgr.enterRoom(userMgr.roomData);
            userMgr.roomData = null;
        } else {
            this.checkQuery();
        }
    },

    checkQuery: function() {
        let self = this;
        let utils = cc.vv.utils;
        let userMgr = cc.vv.userMgr;
        let anysdk = cc.vv.anysdkMgr;
        let query = anysdk.getQuery();
        let pc = cc.vv.pclient;
            
        if (query == null || query.length == 0)
            return;

        let params = utils.queryParse(query);
        let roomid = params.room;
        let clubid = params.club;
    
        console.log('roomid=' + roomid);
        console.log('clubid=' + clubid);

        setTimeout(()=>{
            anysdk.clearQuery();
        }, 100);

        if (roomid != null) {
            userMgr.enterRoom(roomid, ret=>{
                let code = ret.errcode;
                if (code != 0) {
                    let content = "房间["+ roomid +"]不存在";

                    if (code == 2224) {
                        content = "房间["+ roomid + "]已满!";
                    } else if (code == 2222) {
                        content = '钻石不足';
                    } else if (code == 2251) {
                        content = '您不是俱乐部普通成员，无法加入俱乐部房间';
                    }

                    cc.vv.alert.show(content);
                }
            });
        } else if (clubid != null) {
            /* 通过俱乐部名片进入
                1) 检查是否俱乐部会员
                2) 如果是普通会员，进入lobby界面；member
                3) 如果是管理员，进入admin界面;            admin
                4) 如果不是俱乐部成员，发送申请，并给提示已申请 ; outsider
            */
            pc.request_apis('get_club_role', { club_id : clubid }, ret=>{
                if (ret.errcode != 0) {
                    console.log('get_club_role ret=' + ret.errcode);
                    return;
                }

                let role = ret.data.role;
                if (role == 'member') {
                    self.showTab(2);
                    let next = cc.find('Canvas/lobby');

                    userMgr.club_id = clubid;
                    userMgr.is_admin = false;
                    next.club_id = clubid;
                    next.active = true;
                } else if (role == 'admin') {
                    self.showTab(2);

                    let next = cc.find('Canvas/admin');

                    userMgr.club_id = clubid;
                    userMgr.is_admin = true;
                    next.club_id = clubid;
                    next.active = true;
                } else if (role == 'outsider') {
                    pc.request_apis('apply_join_club', { club_id: clubid }, ret2=>{
                        if (ret2.errcode != 0) {
                            cc.vv.alert.show(ret2.errmsg);
                            return;
                        }

                        cc.vv.alert.show('已成功申请加入俱乐部' + clubid + '，请等待管理员审核');
                    });
                }
            });    
        }
    },

    showTab: function(id) {
        let body = this.node.getChildByName('body');
        let tabs = [ 'discover', 'club', 'history', 'mine' ];

        for (var i = 0; i < tabs.length; i++) {
            let tab = body.getChildByName(tabs[i]);

            tab.active = i == id;
        }
    },

    refreshCoins: function() {
        let self = this;

        cc.vv.userMgr.simpleRequstWithResult('get_coins', {}, ret=>{
            if (!ret || ret.errcode != 0)
                return;

             self.lblGems.string = ret.gems;
             self.lblLottery.string = ret.lottery;
             self.lblGolds.string = ret.golds;
        });
    },

    refreshNotice: function() {
        let self = this;

        cc.vv.userMgr.simpleRequstWithResult('get_message', { type: 'notice' }, ret=>{
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
        let usermgr = cc.vv.userMgr;

        this.lblName.string = usermgr.userName.slice(0, 8);
        this.lblGems.string = usermgr.gems;
        this.lblID.string = 'ID:' + usermgr.userId;
    },

	onSettingsClose: function() {
		cc.vv.utils.showDialog(this.settingsWin, 'body', false);
    },

    onBtnClicked: function(event) {
        cc.vv.audioMgr.playButtonClicked();

        let name = event.target.name;
        let node = this.node;
        let utils = cc.vv.utils;

        if (name == "btnSetting") {
            var setWin = node.getChildByName('audioSet');

            utils.showDialog(setWin, 'body', true);
        } else if (name == "btnHelp") {
            utils.showFrame(this.helpWin, 'head', 'body', true);
        } else if (name == 'btnFeedback') {
            var fb = node.getChildByName('feedback');

            utils.showDialog(fb, 'body', true);
        } else if (name == 'btnInvest') {
            var invest = node.getChildByName('invest');

            utils.showDialog(invest, 'body', true);
        } else if (name == 'btnBind') {
            var bind = this.node.getChildByName('bind');

            utils.showDialog(bind, 'body', true);
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

        if(cc.vv && cc.vv.userMgr.roomData != null){
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        }
    },
*/
});

