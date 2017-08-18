
cc.Class({
    extends: cc.Component,

    properties: {
        _pointer:null,
        _timeLabel:null,
        _time:-1,
        _alertTime:-1,
    },

    onLoad: function() {
        var gameChild = this.node.getChildByName("game");
        this._pointer = gameChild.getChildByName("arrow");
        this.initPointer();
        
        this._timeLabel = gameChild.getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        
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
            self._time = 10;
            self._alertTime = 3;
        });
    }, 
    
    initPointer: function() {
        if (cc.vv == null)
            return;

		var pt = this._pointer;
		var net = cc.vv.gameNetMgr;

        pt.active = net.gamestate == "playing" || cc.vv.replayMgr.isReplay();
        if (!pt.active)
            return;

        var turn = net.turn;
        var localIndex = net.getLocalIndex(turn);

        for(var i = 0; i < pt.children.length; i++) {
            pt.children[i].active = i == localIndex;
        }
    },

    update: function (dt) {
        if (this._time > 0) {
            this._time -= dt;
            if(this._alertTime > 0 && this._time < this._alertTime){
                cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
                this._alertTime = -1;
            }

            var pre = "";
            if(this._time < 0){
                this._time = 0;
            }
            
            var t = Math.ceil(this._time);
            if (t < 10)
                pre = "0";

            this._timeLabel.string = pre + t; 
        }
    },
});

