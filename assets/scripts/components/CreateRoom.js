
cc.Class({
    extends: cc.Component,

    properties: {
        _gamenum: null,
        _maxfan: null,
        _flowers: 0,
        _maima: null,
        _allpairs: null,
		slider: cc.Slider,
    },

    onLoad: function() {
        this._gamenum = [];

		var content = cc.find('body/items/view/content', this.node);

		var t = content.getChildByName('game_num');
        for (var i = 0; i < t.childrenCount; i++) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._gamenum.push(n);
            }
        }

        this._maxfan = [];
		var t = content.getChildByName('maxfan');
        for (var i = 0; i < t.childrenCount; i++) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._maxfan.push(n);
            }
        }

		this._maima = cc.find('wanfa/horse', content);
		this._allpairs = cc.find('wanfa/allpairs', content);
		
		var score = this.slider;
		score.node.on('slide', this.onScoreChanged, this);

		var btnClose = cc.find('top/btn_back', this.node);
		cc.vv.utils.addClickEvent(btnClose, this.node, 'CreateRoom', 'onBtnClose');
	},

    onEnable: function() {
        let usermgr = cc.vv.userMgr;
        let gem = cc.find('bottom/lbl_gem', this.node).getComponent(cc.Label);

        gem.string = usermgr.gems;
    },

	onScoreChanged: function(event) {
		let slide = event.detail;
		let content = cc.find('body/items/view/content', this.node);
		let fill = cc.find('base/score/body', content).getComponent(cc.Sprite);
		let flower = cc.find('base/flower', content).getComponent(cc.Label);
		let range = [1, 5, 10, 20, 30, 50, 100, 200, 300];
		let id = Math.round(slide.progress * (range.length - 1));

		flower.string = range[id];
		this._flowers = range[id];

		fill.fillRange = slide.progress;
	},

    onBtnClose: function() {
        cc.vv.audioMgr.playButtonClicked();
		this.node.active = false;
    },

    onBtnOK: function() {
        cc.vv.audioMgr.playButtonClicked();

		this.node.active = false;
        this.createRoom();
    },

    createClubRoom: function(conf, club_id) {
        var pc = cc.vv.pclient;
        var self = this;

        cc.vv.wc.show(2);

        conf.club_id = club_id;

        pc.request_connector('create_private_room', { conf: conf }, function(ret) {
            cc.vv.wc.hide();
            if (!ret)
                return;

            if (ret.errcode != 0) {
                cc.vv.alert.show(errmsg);
                return;
            }

            //cc.vv.alert.show('create success');

            self.node.active = false;
        });
    },

    createRoom: function() {
        var self = this;

        var gamenum = 0;
		var gamenums = [ 4, 8, 16 ];
        for (var i = 0; i < self._gamenum.length; ++i) {
            if (self._gamenum[i].checked) {
                gamenum = gamenums[i];
                break;
            }
        }

        var maxfan = 0;
        var maxfans = [ 2, 3, 4, 100 ];
        for (var i = 0; i < self._maxfan.length; ++i) {
            if (self._maxfan[i].checked) {
                maxfan = maxfans[i];
                break;
            }
        }

		var flowers = this._flowers;
		var maima = this._maima.getComponent('CheckBox').checked;
		var allpairs = this._allpairs.getComponent('CheckBox').checked;

        var conf = {
            type: 'shmj',
            gamenum: gamenum,
            maxfan: maxfan,
            huafen: flowers,
            playernum: 4,
            maima: maima,
            qidui: allpairs
        };

        var club_id = this.node.club_id;
        if (club_id != null) {
            this.createClubRoom(conf, club_id);
            return;
        }

		var pc = cc.vv.pclient;

        cc.vv.wc.show(2);
        pc.request_connector('create_private_room', { conf: conf }, function(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                if (ret.errcode == 2222) {
                    cc.vv.alert.show("房卡不足，创建房间失败!");
                } else {
                    cc.vv.alert.show("创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                var sd = {
                    roomid: ret.data.roomid,
                    userName : cc.vv.userMgr.userName
                };

                pc.request_connector('enter_private_room', sd, function(ret2) {
                    console.log("return from enter_private_room=");
                    if (ret2.errcode != cc.vv.global.const_code.OK)
                    {
                        console.log("enter room failed,code=" + ret2.errcode);
                        cc.vv.wc.hide();
                    } else {
                        cc.vv.gameNetMgr.connectGameServer(ret.data);
                    }
                });
            }
        });
    }
});

