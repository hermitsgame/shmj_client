
cc.Class({
    extends: cc.Component,

    properties: {
        _pointer:null,
        _timeLabel:null,
        _time:-1,
        _alertTime:-1,
        _alarmId : -1,
    },

    onLoad: function() {
        var gameChild = this.node.getChildByName("game");
        this._pointer = gameChild.getChildByName("arrow");

        this._timeLabel = gameChild.getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "0";

        this.initPointer();
        
        var self = this;
        
        this.node.on('game_begin',function(data) {
            self.initPointer();
        });

		this.node.on('game_sync',function(data) {
			if (!cc.vv.gameNetMgr.isPlaying())
				return;

            self.initPointer();
        });
		
        this.node.on('game_chupai', function(data) {
            self.initPointer();
        });
            self._time = 10 + Date.now() / 1000;
            self._alertTime = 3;
        this.node.on('game_over', function(data) {
            self._time = -1;
            self.initPointer();
            self.stopAlarm();
        });
    },

    stopAlarm: function() {
        if (this._alarmId >= 0) {
            cc.vv.audioMgr.stopSFX(this._alarmId);
            this._alarmId = -1;
        }
    },

    initPointer: function() {
        if (cc.vv == null)
            return;

        var pt = this._pointer;
        var time = this._timeLabel.node;
        var net = cc.vv.gameNetMgr;

        pt.active = net.gamestate == "playing" || cc.vv.replayMgr.isReplay();
        time.active = pt.active && this._time != -1;
        if (!pt.active)
            return;

        var turn = net.turn;
        var localIndex = net.getLocalIndex(turn);

        for(var i = 0; i < pt.children.length; i++) {
            pt.children[i].active = i == localIndex;
        }
    },

    update: function (dt) {
        var now_ms = Date.now();
        var self = this;

        if (this._time > 0) {
            var now = now_ms / 1000;
            var left = this._time - now;

            if (left < 0) {
                this._time = 0;
                return;
            }

            if (this._alertTime > 0 && left < this._alertTime) {
                this._alarmId = cc.vv.audioMgr.playSFX("Sound/timeup_alarm.mp3", ()=>{
                    self._alarmId = -1;
                });

                this._alertTime = -1;
            }
            
            var t = Math.ceil(left);

            this._timeLabel.string = t;
        }
    },
});

