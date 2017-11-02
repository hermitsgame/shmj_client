
cc.Class({
    extends: cc.Component,

    properties: {
        _nextPlayTime: 1,
        _replay: null,
        _isPlaying: true,

		_btnPlay: null,
		_btnPause: null,
		_over: null,
    },

    onLoad: function() {
        if (cc.vv == null)
            return;

        let replay = cc.find("Canvas/replay");
        replay.active = cc.vv.replayMgr.isReplay();

		let btnPlay = replay.getChildByName('btn_play');
		let btnPause = replay.getChildByName('btn_pause');
        let btnBack = replay.getChildByName('btn_back');
        let btnPrev = replay.getChildByName('btn_prev');
        let btnForward = replay.getChildByName('btn_forward');
        let btnStop = replay.getChildByName('btn_stop');
        let utils = cc.vv.utils;

        utils.addClickEvent(btnPlay, this.node, 'ReplayCtrl', 'onBtnPlayClicked');
        utils.addClickEvent(btnPause, this.node, 'ReplayCtrl', 'onBtnPauseClicked');
        utils.addClickEvent(btnBack, this.node, 'ReplayCtrl', 'onBtnBackClicked');
        utils.addClickEvent(btnPrev, this.node, 'ReplayCtrl', 'onBtnPrevClicked');
        utils.addClickEvent(btnForward, this.node, 'ReplayCtrl', 'onBtnForwardClicked');
        utils.addClickEvent(btnStop, this.node, 'ReplayCtrl', 'onBtnStopClicked');

		this._over = replay.getChildByName('over');
		this._over.active = false;

		this._replay = replay;

		this.refreshBtn();
    },

	refreshBtn: function() {
	    let replay = cc.find("Canvas/replay");
        let btnPlay = replay.getChildByName('btn_play');
		let btnPause = replay.getChildByName('btn_pause');

		btnPlay.active = !this._isPlaying;
		btnPause.active = this._isPlaying;
    },

	replayOver: function(status) {
		var over = this._over;

        if (status) {
    		var position = cc.p(over.x, over.y);

	    	over.active = true;
	    	over.y += over.height;

		    over.runAction(cc.moveTo(0.6, position));
        } else {
            over.active = false;
        }
    },

    onBtnPauseClicked: function() {
		cc.vv.audioMgr.playButtonClicked();
	
        this._isPlaying = false;
		this.refreshBtn();
    },

    onBtnPlayClicked: function() {
		cc.vv.audioMgr.playButtonClicked();
        this._isPlaying = true;
		this.refreshBtn();
    },

    onBtnBackClicked: function() {
		cc.vv.audioMgr.playButtonClicked();
        cc.vv.replayMgr.clear();
        cc.vv.gameNetMgr.reset();
        cc.vv.gameNetMgr.roomId = null;
        cc.director.loadScene("hall");
    },

	onBtnPrevClicked: function() {
		var gameNetMgr = cc.vv.gameNetMgr;
		var old = this._isPlaying;

		cc.vv.audioMgr.playButtonClicked();

		this._isPlaying = false;

		cc.vv.replayMgr.prev(2);
		cc.vv.gameNetMgr.doSync();

        this.updateProgress(true);
		this._nextPlayTime = 2.0;
		this._isPlaying = old;

		this.refreshBtn();
		this.replayOver(false);
    },

	onBtnForwardClicked: function() {
		var old = this._isPlaying;

		cc.vv.audioMgr.playButtonClicked();
	
		this._isPlaying = false;

		cc.vv.replayMgr.forward(2);
		cc.vv.gameNetMgr.doSync();

        this.updateProgress(true);
		this._nextPlayTime = 2.0;
		this._isPlaying = old;

		this.refreshBtn();
    },

    onBtnStopClicked: function() {
        cc.vv.audioMgr.playButtonClicked();
        this._isPlaying = false;

        cc.vv.replayMgr.prev(1000);
		cc.vv.gameNetMgr.doSync();

        this.updateProgress(true);
		this._nextPlayTime = 2.0;
		this.refreshBtn();
		this.replayOver(false);
    },

    updateProgress: function(enable) {
        let progress = cc.find("Canvas/replay/progress");

        progress.active = enable;
        if (!enable)
            return;

        let percent = Math.floor(cc.vv.replayMgr.getProgress() * 100);

        progress.getComponent(cc.Label).string = percent + '%';
    },

    update: function(dt) {
        if (!cc.vv)
            return;

        if (this._isPlaying && cc.vv.replayMgr.isReplay() && this._nextPlayTime > 0) {
            this._nextPlayTime -= dt;
            if (this._nextPlayTime < 0) {
                var next = cc.vv.replayMgr.takeAction();
                if (next < 0) {
                    this.replayOver(true);
                }

                this._nextPlayTime = next;

                this.updateProgress(true);
            }
        }
    },
});

