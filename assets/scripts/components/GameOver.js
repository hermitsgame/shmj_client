
cc.Class({
    extends: cc.Component,

    properties: {
        _gameover: null,
        _gameresult: null,
        _seats: [],
        _isGameEnd: false,
        
        _pengTemp: null,
        _btnStart: null,
        _btnResult: null,
        _title: null,
        _time: null,
        _roominfo: null,
		_lastSeconds: 0,
    },

    onLoad: function() {
        if (cc.vv == null) {
            return;
        }

        if (cc.vv.gameNetMgr.conf == null) {
            return;
        }

        var gameover = this.node.getChildByName("game_over");
        this._gameover = gameover;

        gameover.active = false;

        var gameresult = this.node.getChildByName("game_result");
		this._gameresult = gameresult;

		this._time = gameover.getChildByName('time').getComponent(cc.Label);
		this._title = gameover.getChildByName('title').getComponent('SpriteMgr');

        var seats = gameover.getChildByName("seats");
        for (var i = 0; i < seats.childrenCount; i++) {
            var viewdata = {};
            var seat = seats.children[i];

			viewdata.seat = seat;

			viewdata.icon = cc.find('head/icon', seat).getComponent('ImageLoader');
            viewdata.username = seat.getChildByName('name').getComponent(cc.Label);
            viewdata.reason = seat.getChildByName('tips').getComponent(cc.Label);

			viewdata.winScore = seat.getChildByName("winScore").getComponent(cc.Label);
			viewdata.loseScore = seat.getChildByName("loseScore").getComponent(cc.Label);
            viewdata.action = seat.getChildByName("action");
			viewdata.zhuang = seat.getChildByName('zhuang');

            var mjs = seat.getChildByName("mjs");
            viewdata.mjs = mjs;

            viewdata._pengandgang = [];

            var penggangs = mjs.getChildByName('penggangs');
            viewdata.penggangs = penggangs;
            if (penggangs.childrenCount > 0) {
                var temp = penggangs.children[0];
                this._pengTemp = temp;
                
                penggangs.removeChild(temp);
            }
            
            this._seats.push(viewdata);
        }
        
        var btnStart = gameover.getChildByName('btnStart');
        cc.vv.utils.addClickEvent(btnStart, this.node, "GameOver","onBtnReadyClicked");
        this._btnStart = btnStart;

        var btnResult = gameover.getChildByName('btnResult');
        cc.vv.utils.addClickEvent(btnResult, this.node, "GameOver","onBtnReadyClicked");
        this._btnResult = btnResult;
        
        var btnShare = gameover.getChildByName('btnShare');
        cc.vv.utils.addClickEvent(btnShare, this.node, "GameOver","onBtnShareClicked");

        var self = this;
        this.node.on('game_over', function(data) {
            var net = cc.vv.gameNetMgr;
    		self._roominfo = '房间号: ' + net.roomId + ' 局数: ' + net.numOfGames + '/' + net.maxNumOfGames;
    		//self.onGameOver(data.detail);
        });
        
        this.node.on('game_end', function(data) {
            self._isGameEnd = true;

            self._btnResult.active = true;
            self._btnStart.active = false;
        });
    },
    
    onGameOver: function(odata) {
        var einfo = odata.info;
        var data = odata.results;
	
        if (data.length == 0) {
            this._gameresult.active = true;
            return;
        }

        this._gameover.active = true;

        var roominfo = this._gameover.getChildByName('roominfo').getComponent(cc.Label);
        roominfo.string = this._roominfo;

        var nSeats = data.length;
        var huSeats = [];

        for (var i = 0; i < nSeats; i++) {
            var seatView = this._seats[i];
            var userData = data[i];
			var detail = userData.detail;
            var hu = userData.hu;
            var hued = hu.hued;
			var fangpao = hu.fangpao;
            var mjs = seatView.mjs;
            var hupai = mjs.getChildByName('hupai');

            seatView.seat.active = true;

            console.log(userData.userId);
            seatView.icon.setUserID(userData.userId);
			
            hupai.active = hued;

            if (hued) {
                var nc = hupai.getChildByName('south_meld');
                var mj = nc.getComponent('Majiang');

                nc.active = true;
                mj.setMJID(hu.pai);

                huSeats.push(i);
            }

            seatView.username.string = userData.name;
            seatView.zhuang.active = userData.button;

            if (detail) {
                seatView.reason.string = detail.tips ? detail.tips : '';
            }

            var score = userData.score;

            console.log('score=' + score);
            if (score >= 0) {
                seatView.winScore.string = '+' + score;
                seatView.winScore.node.active = true;
                seatView.loseScore.node.active = false;
            } else {
                seatView.loseScore.string = score;
                seatView.loseScore.node.active = true;
                seatView.winScore.node.active = false;
            }

            var action = seatView.action;
            var spriteMgr = action.getComponent('SpriteMgr');
            if (hued) {
                action.active = true;
                spriteMgr.setIndex(0);
            } else if (fangpao) {
                action.active = true;
                spriteMgr.setIndex(1);
            } else {
                action.active = false;
            }

            var holds = seatView.mjs.getChildByName('holds');
            for (var k = 0; k < holds.childrenCount; k++) {
                var mjnode = holds.children[k];
                mjnode.active = false;
            }

            cc.vv.gameNetMgr.sortMJ(userData.holds);

            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
            var lackingNum = (userData.pengs.length + (userData.chis ? userData.chis.length : 0) + numOfGangs) * 3;
            var total = userData.holds.length;

            for (var k = 0; k < total && k + lackingNum < holds.childrenCount; k++) {
                var pai = userData.holds[k];
                var mjnode = holds.children[k + lackingNum];
                var mj = mjnode.getComponent("Majiang");

                mjnode.active = true;
                mj.setMJID(pai);
            }

            for (var k = 0; k < seatView._pengandgang.length; k++) {
                seatView._pengandgang[k].active = false;
            }

            seatView.penggangs.width = 0;

            var index = 0;
            var gangs = userData.angangs;
            for (var k = 0; k < gangs.length; k++) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, 'angang');
                index++;
            }
			
            var gangs = userData.diangangs;
            for (var k = 0; k < gangs.length; k++) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, 'diangang');
                index++;
            }
			
            var gangs = userData.wangangs;
            for (var k = 0; k < gangs.length; k++) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, 'wangang');
                index++;
            }

            var pengs = userData.pengs;
            if (pengs) {
                for (var k = 0; k < pengs.length; k++) {
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView, index, mjid, 'peng');
                    index++;    
                }
            }

            var chis = userData.chis;
            if (chis) {
                for (var k = 0; k < chis.length; k++) {
                    var mjid = chis[k];
                    this.initChis(seatView, index, mjid);
                    index++;
                }
            }
        }

        for (var i = nSeats; i < 4; i++) {
            var seat = this._seats[i].seat;

            seat.active = false;
        }

        var si = cc.vv.gameNetMgr.seatIndex;
        var id = 0;

        if (huSeats.length == 0) {
            id = 2;
        } else if (huSeats.indexOf(si) >= 0) {
            id = 0;
        } else {
            id = 1;
        }

        this._title.setIndex(id);
    },

    getChiArr: function(pai) {
        var type = parseInt(pai / 100);
        var c = pai % 100;

        var begin = c - type;

        var arr = [];
        for (var i = 0; i < 3; i++) {
            var k = begin + i;

            arr.push(k);
        }

        return arr;
    },

    initChis: function(seatView, index, mjid) {
        var pgroot = null;
        var mgr = cc.vv.mahjongmgr;

        if (seatView._pengandgang.length <= index) {
            pgroot = cc.instantiate(this._pengTemp);
            seatView._pengandgang.push(pgroot);
            seatView.penggangs.addChild(pgroot);
        } else {
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }

		pgroot.children[3].active = false;

		let mjs = this.getChiArr(mjid);
		let side = 'south';

        for (let i = 0; i < 3; i++) {
            let child = pgroot.children[i];
            let board = child.getComponent(cc.Sprite);
            let tile = child.children[0].getComponent(cc.Sprite);
            let chi = child.getChildByName('chi');
            let arrow = child.getChildByName('arrow');

            if (chi)
                chi.active = false;

            if (arrow)
                arrow.active = false;

			board.spriteFrame = mgr.getBoardSprite2D(side, "meld");
			tile.spriteFrame = mgr.getTileSprite2D(mjs[i]);
		}
    },

    initPengAndGangs: function(seatView,index,mjid,flag) {
        var pgroot = null;
        var mgr = cc.vv.mahjongmgr;
        
        if(seatView._pengandgang.length <= index){
            pgroot = cc.instantiate(this._pengTemp);
            seatView._pengandgang.push(pgroot);
            seatView.penggangs.addChild(pgroot);    
        }
        else{
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }

        mjid = mjid % 100;
		
        var side = 'south';
        for (let i = 0; i < pgroot.childrenCount; i++) {
            let child = pgroot.children[i];
            let board = child.getComponent(cc.Sprite);
            let tile = child.children[0].getComponent(cc.Sprite);
            let chi = child.getChildByName('chi');
            let arrow = child.getChildByName('arrow');

            if (chi)
                chi.active = false;

            if (arrow)
                arrow.active = false;

            if (child.name == "gang") {
                var isGang = flag != "peng";
                child.active = isGang;

                if (!isGang)
                    continue;

                board.spriteFrame = mgr.getBoardSprite2D(side, "meld");
                tile.spriteFrame = mgr.getTileSprite2D(mjid);
            } else {
                if (flag == "angang") {
                    board.spriteFrame = mgr.getBoardSprite2D(side, "meld_cover");
                    tile.spriteFrame = null;
                } else {
                    board.spriteFrame = mgr.getBoardSprite2D(side, "meld");
                    tile.spriteFrame = mgr.getTileSprite2D(mjid);
                }
            }
        }
    },
    
    onBtnReadyClicked: function() {
        console.log("onBtnReadyClicked");
        if (this._isGameEnd) {
            this._gameresult.active = true;
        }
        else {
            cc.vv.net.send('ready');   
        }
        this._gameover.active = false;
    },
    
    onBtnShareClicked: function() {
		cc.vv.audioMgr.playButtonClicked();

		setTimeout(function() {
			cc.vv.anysdkMgr.shareResult();
		}, 100);
    },

	curentTime: function() {
		var now = new Date();

		var year = now.getFullYear();
		var month = now.getMonth() + 1;
		var day = now.getDate();

		var hh = now.getHours();
		var mm = now.getMinutes();
		var ss = now.getSeconds();

		var clock = year + "-";

		if (month < 10) {
			clock += "0";
		}

		clock += month + "-";

		if (day < 10) {
			clock += "0";
		}

		clock += day + " ";

		if (hh < 10) {
			clock += "0";
		}

		clock += hh + ":";
		if (mm < 10) {
			clock += '0';
		}

		clock += mm + ":";

		if (ss < 10) {
			clock += '0';
		}

		clock += ss;
		
		return clock;
    },

    update: function (dt) {
		var seconds = Math.floor(Date.now()/1000);
        if (this._lastSeconds != seconds) {
            this._lastSeconds = seconds;

            this._time.string = this.curentTime();
        }
    },
});

