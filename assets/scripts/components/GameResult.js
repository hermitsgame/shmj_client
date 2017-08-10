
cc.Class({
    extends: cc.Component,

    properties: {
        _gameresult:null,
        _seats:[],

		_time: null,
		_roominfo: null,
		_lastSeconds: 0,
    },

    onLoad: function() {
		if (cc.vv == null) {
			return;
		}

        var gameresult = this.node.getChildByName('game_result');
		this._gameresult = gameresult;

		this._time = gameresult.getChildByName('time').getComponent(cc.Label);
		this._roominfo = gameresult.getChildByName('roominfo').getComponent(cc.Label);

        var seats = this._gameresult.getChildByName('seats');
        for (var i = 0; i < seats.children.length; i++) {
            this._seats.push(seats.children[i].getComponent('Seat'));
        }

        var btnClose = gameresult.getChildByName('btnClose');
        if (btnClose) {
            cc.vv.utils.addClickEvent(btnClose, this.node, 'GameResult', 'onBtnCloseClicked');
        }

        var btnShare = gameresult.getChildByName('btnShare');
        if (btnShare) {
            cc.vv.utils.addClickEvent(btnShare, this.node, 'GameResult', 'onBtnShareClicked');
        }

        var self = this;
        this.node.on('game_end', function(data) {
			self.onGameEnd(data.detail);
		});
    },

    showResult: function(seat, info, winner) {
		var type = cc.vv.gameNetMgr.getGameType();
    	var values = seat.getChildByName('values');

		var wzmj = [ info.numzz, info.numgang, info.nummd, info.numdd, info.numyp, info.numsf ];
		var vals = [ info.numzimo, info.numjiepao, info.numdianpao, info.numangang, info.numminggang ];

		console.log('info');
		console.log(info);
		console.log(type);

		if ('wzmj' == type) {
			vals = wzmj;
		}

		for (var i = 0; i < vals.length; i++) {
			var child = values.children[i];

			child.getComponent(cc.Label).string = vals[i];
		}

        seat.getChildByName('winner').active = winner;
    },

	showStat: function(seat) {
		var type = cc.vv.gameNetMgr.getGameType();
		var wzmj = [ '坐庄次数', '扛牌次数', '买底次数', '顶底次数', '硬牌次数', '双翻次数' ];
		var stats = [ '自摸次数', '接炮次数', '点炮次数', '暗杠次数', '明杠次数' ];

		if ('wzmj' == type) {
			stats = wzmj;
		}

		var stat = seat.getChildByName('stats');

		for (var i = 0; i < stats.length; i++) {
			var child = stat.children[i];

			child.getComponent(cc.Label).string = stats[i];
		}
    },

    onGameEnd: function(endinfo) {
		var net = cc.vv.gameNetMgr;
		var seats = net.seats;
		var nSeats = net.numOfSeats;
		var maxscore = -1;

		for (var i = 0; i < seats.length; i++) {
            var seat = seats[i];
            if (seat.score > maxscore) {
                maxscore = seat.score;
            }
        }

		var layouts = [ [ 1 , 2 ], [ 0, 1, 2 ], [ 0, 1, 2, 3 ] ];
		var layout = layouts[nSeats - 2];

		var index = 0;

		for (var i = 0; i < 4; i++) {
			var s = this._seats[i];

			s.node.active = false;
		}

		for (var i = 0; i < layout.length; i++) {
			var loc = layout[i];
            var seat = seats[index];
            var isBigwin = false;
            if (seat.score > 0) {
                isBigwin = seat.score == maxscore;
            }

			var s = this._seats[loc];
			var node = s.node;
			var owner = node.getChildByName('owner');

			node.active = true;
			owner.active = (index == 0);

            s.setInfo(seat.name, seat.score);
            s.setID(seat.userid);

			this.showStat(node);
            this.showResult(node, endinfo[index], isBigwin);

			index++;
        }
		
		this._roominfo.string = '房间号: ' + net.roomId + ' 局数: ' + net.numOfGames + '/' + net.maxNumOfGames;
    },
    
    onBtnCloseClicked:function(){
        cc.director.loadScene("hall");
    },
    
    onBtnShareClicked:function(){
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

