
cc.Class({
    extends: cc.Component,

    properties: {
        tipLabel:cc.Label,
        _stateStr:'',
        _progress:0.0,
        _splash:null,
        _isLoading:false,
    },

    onLoad: function() {
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        
        this.initMgr();
        cc.vv.anysdkMgr.setPortrait();
        
        this._splash = cc.find("Canvas/splash");
        this._splash.active = true;
/*
        this._mianze = cc.find('Canvas/mianze');
        this._mianze.active = false;
*/
    },

    setProgress: function(per) {
        var progress = this.node.getChildByName('progress');
        var percent = progress.getComponent('Progress')

        progress.active = true;
        percent.setPercent(per);
    },

    start: function() {
        var self = this;
        var SHOW_TIME = 1000;
        var FADE_TIME = 300;
        var splash = this._splash;

        if(cc.sys.os != cc.sys.OS_IOS || !cc.sys.isNative){
            splash.active = true;

            var t = Date.now();
            var fn = function() {
                var dt = Date.now() - t;
                if(dt < SHOW_TIME){
                    setTimeout(fn,33);
                }
                else {
                    var op = (1 - ((dt - SHOW_TIME) / FADE_TIME)) * 255;
                    if(op < 0){
                        splash.opacity = 0;
                        //self.checkVersion();
                    }
                    else {
                        splash.opacity = op;
                        setTimeout(fn,33);
                    }
                }
            };
            setTimeout(fn,33);
        }
        else {
            splash.active = false;
            //this.checkVersion();
        }
    },
    
    initMgr: function() {
        cc.vv = {};

        cc.vv.company = 'dinosaur';
        cc.vv.appname = 'shmj';

        var pclient = require("pclient");
        cc.vv.pclient = new pclient();

        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();
        
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();
        
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        cc.vv.gameNetMgr.initHandlers();
        
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        
        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();
        
        var Utils = require("Utils");
        cc.vv.utils = new Utils();

        var Crypto = require("Crypto");
        cc.vv.crypto = new Crypto();
        cc.vv.crypto.init();
        
        cc.args = this.urlParse();
    },
    
    urlParse: function() {
        var params = {};
        if (window.location == null) {
            return params;
        }

        var name, value; 
        var str = window.location.href; //取得整个地址栏
        var num = str.indexOf("?") 
        str = str.substr(num+1); //取得所有参数   stringvar.substr(start [, length ]
        
        var arr = str.split("&"); //各个参数放到数组里
        for (var i=0; i < arr.length; i++) { 
            num = arr[i].indexOf("="); 
            if (num > 0) {
                name = arr[i].substring(0, num);
                value = arr[i].substr(num + 1);
                params[name] = value;
            }
        }

        return params;
    },
    
    checkVersion: function() {
        var self = this;
        var onGetVersion = function(ret){
            if(ret.version == null){
                console.log("error.");
            }
            else{
                cc.vv.SI = ret;
                if(ret.version != cc.VERSION){
                    cc.find("Canvas/alert").active = true;
                }
                else{
                    self.startPreloading();
                }
            }
        };
        
        var xhr = null;
        var complete = false;
        var fnRequest = function(){
            self._stateStr = "正在连接服务器";
            xhr = cc.vv.http.sendRequest("/get_serverinfo",null,function(ret){
                xhr = null;
                complete = true;
                onGetVersion(ret);
            });
            setTimeout(fn,5000);            
        }
        
        var fn = function(){
            if(!complete){
                if(xhr){
                    xhr.abort();
                    self._stateStr = "连接失败，即将重试";
                    setTimeout(function(){
                        fnRequest();
                    },5000);
                }
                else{
                    fnRequest();
                }
            }
        };
        fn();
    },
    
    onBtnDownloadClicked:function(){
        cc.sys.openURL(cc.vv.SI.appweb);
    },
    
    startPreloading: function() {
        var self = this;

        if (true) {
            this._stateStr = "正在加载资源，请稍候";
            this._isLoading = true;

            console.log('start loading');
            var onProgress = function (completedCount, totalCount,  item ) {
                if (self._isLoading)
                    self._progress = completedCount / totalCount;
	    };

            cc.loader.loadResDir("textures/hall", onProgress, function(err, assets) {
                self.onLoadComplete();
            });
        } else {
            self.onLoadComplete();
        }
    },
    
    onLoadComplete: function() {
        var loadCount = 0;
        var t = cc.sys.localStorage.getItem('loadCount');
        if (t != null) {
            loadCount = parseInt(t);
        }

        loadCount++;
        cc.sys.localStorage.setItem('loadCount', loadCount);
        
        if (false && 1 == loadCount) {
            this._mianze.active = true;
        } else {
            this.login();
        }
    },
    
    login: function() {
        this._isLoading = false;
        this._stateStr = "准备登陆";
        cc.director.loadScene("login");
        cc.loader.onComplete = null;
    },

    onBtnOkClicked: function() {
		cc.vv.audioMgr.playButtonClicked();
        this._mianze.active = false;
        this.login();
    },

    update: function (dt) {
        if (this._stateStr.length == 0) {
            return;
        }

        this.tipLabel.string = this._stateStr + ' ';
        if (this._isLoading) {
            this.setProgress(this._progress);
        }
        else {
            var t = Math.floor(Date.now() / 1000) % 4;
            for (var i = 0; i < t; ++ i) {
                this.tipLabel.string += '.';
            }
        }
    }
});

