
cc.Class({
    extends: cc.Component,

    properties: {
        bgmVolume: 1.0,
        sfxVolume: 1.0,
        
        bgmAudioID:-1,
        
        dialectID: 0,
        speakerID: 0,
        
        _bgmUrl: null,
    },

    init: function () {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if(t != null){
            this.bgmVolume = parseFloat(t);
        }
        
        var t = cc.sys.localStorage.getItem("sfxVolume");
        if(t != null){
            this.sfxVolume = parseFloat(t);
        }

        var t = cc.sys.localStorage.getItem("dialectID");
        if (t != null) {
            this.dialectID = parseInt(t);
        }

        var t = cc.sys.localStorage.getItem("speakerID");
        if (t != null) {
            this.speakerID = parseInt(t);
        }

        cc.game.on(cc.game.EVENT_HIDE, function() {
            console.log("cc.audioEngine.pauseAll");
            cc.audioEngine.pauseAll();
        });

        cc.game.on(cc.game.EVENT_SHOW, function() {
            console.log("cc.audioEngine.resumeAll");
            cc.audioEngine.resumeAll();
        });
    },

    getUrl:function(url){
        return cc.url.raw("resources/sounds/" + url);
    },
    
    playBGM: function(url) {
        var audioUrl = this.getUrl(url);
        var bgmVolume = this.bgmVolume;

        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);
            this.bgmAudioID = -1;
        }

        if (bgmVolume > 0) {
            this.bgmAudioID = cc.audioEngine.play(audioUrl, true, bgmVolume);
        } else {
            this._bgmUrl = url;
        }
    },
    
    stopBGM: function() {
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);
            this.bgmAudioID = -1;
        }
    },
    
    playSFX: function(url, cb) {
        var audioUrl = this.getUrl(url);
        var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);

        if (cb != null)
            cc.audioEngine.setFinishCallback(audioId, cb);

        return audioId;
    },

    stopSFX : function(id) {
        if (id >= 0)
            cc.audioEngine.stop(id);
    },

    getRandom: function(n, m) {
        var w = m - n;

        if (w == 0) {
            return n;
        }

        return Math.round(Math.random() * w + n);
    },

	getSex: function(uid) {
		var infos = cc.vv.baseInfoMap;

		if (!infos || !infos[uid])
			return 0;

		return infos[uid].sex;
	},

    playDialect: function(content, uid, cb) {
        var dialect = [ 'PuTong', 'WenZhou' ];
        var speaker = [ 'man', 'woman' ];
		var path = 'Sound_{0}/{1}/{2}_1.mp3';
		var files = [];

		var sex = this.getSex(uid);

		if (!cc.sys.isNative) {
			path = path.format(dialect[this.dialectID], speaker[sex], content);
			this.playSFX(path, cb);
			return;
		}

        path = 'Sound_{0}/{1}/{2}';
        path = path.format(dialect[this.dialectID], speaker[sex], content);

        var idx = 1;

        do {
            var file = path + '_{0}.mp3';
            file = file.format(idx);
    
            if (jsb.fileUtils.isFileExist(this.getUrl(file))) {
	            files.push(file);
				idx++;
            } else {
				break;
            }
        } while (1);

        if (files.length == 0) {
            console.log('Dialect not found: ' + type + ' ' + content);
            cb();
            return;
        }

		var file = files[this.getRandom(0, files.length - 1)];
		console.log('play ' + file);

        this.playSFX(file, cb);
    },

    playQuickChat: function(id, uid, cb) {
        var speaker = [ 'man', 'woman' ];
        var dialect = [ 'putong', 'wenzhou' ];
        var path = 'Sound_QC/{0}/{1}/{2}.mp3';
        var sex = this.getSex(uid);

        path = path.format(dialect[this.dialectID], speaker[sex], id);
        this.playSFX(path, cb);
    },

    playHu: function(name, uid, cb) {
        var speaker = [ 'man', 'woman' ];
		var path = 'Sound_Hu/{0}/{1}.mp3';
		var sex = this.getSex(uid);

		path = path.format(speaker[sex], name);
		this.playSFX(path, cb);
    },

    playBackGround : function() {
        var id = this.getRandom(1, 3);
        var path = 'Sound_BG/backmusic' + id + '.mp3';

        this.playBGM(path);
    },

	playButtonClicked: function() {

		this.playSFX('Sound/Button_Click.mp3');
    },

    setDialect: function(id) {
        if (this.dialectID != id) {
            cc.sys.localStorage.setItem("dialectID", id);
            this.dialectID = id;
        }
    },
    
    setSpeaker: function(id) {
        if (this.speakerID != id) {
            cc.sys.localStorage.setItem("speakerID", id);
            this.speakerID = id;
        }
    },

    setSFXVolume: function(v) {
        if (this.sfxVolume != v) {
            cc.sys.localStorage.setItem("sfxVolume", v);
            this.sfxVolume = v;
        }
    },

    setBGMVolume: function(v, force) {
        if (this.bgmAudioID >= 0) {
            if (v > 0) {
                cc.audioEngine.resume(this.bgmAudioID);
            } else {
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }

        var old = this.bgmVolume;

        if (old != v || force) {
            cc.sys.localStorage.setItem("bgmVolume", v);
            this.bgmVolume = v;
            
            if (this.bgmAudioID >= 0) {
                cc.audioEngine.setVolume(this.bgmAudioID, v);
            } else {
                if (v > 0 && this._bgmUrl != null) {
                    this.playBGM(this._bgmUrl);
                }
            }
        }
    },

    pauseAll: function() {
        cc.audioEngine.pauseAll();
    },

    resumeAll: function() {
        cc.audioEngine.resumeAll();
    }
});

