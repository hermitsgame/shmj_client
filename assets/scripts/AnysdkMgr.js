cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _isCapturing:false,

        _isTimeline : false,

        _pickNotify: null,
        _receiptPath: null,
        
        _isBuying : false,

        _iapInited: false
    },

    // use this for initialization
    onLoad: function() {
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    init:function() {
		this.ANDROID_API = 'com/' + cc.vv.company + '/' + cc.vv.appname + '/WXAPI';
        this.ANDROID_IMG_API = 'com/' + cc.vv.company + '/' + cc.vv.appname + '/Image';
        this.IOS_API = "AppController";
    },
	
	checkWechat: function() {
        if (!cc.sys.isNative)
            return false;

        if (cc.sys.os == cc.sys.OS_ANDROID)
            return true;

        console.log('check wechat');

        return jsb.reflection.callStaticMethod(this.IOS_API, 'checkWechat');
	},
	
    login:function(){
        if (cc.sys.os == cc.sys.OS_ANDROID) {

            jsb.reflection.callStaticMethod(this.ANDROID_API, "Login", "()V");
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API, "login");
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },

    share: function(title, desc, data, timeline) {
        let tl = timeline != null ? timeline : false;

        this._isTimeline = tl;

        let url = '' + cc.vv.SI.appweb;
        let add = [];

        if (data != null) {
            for (let key in data)
                add.push(key + '=' + data[key]);
        }

        if (add.length > 0)
            url += '?' + add.join('&');

        console.log('share url=' + url);
        console.log('timeline=' + tl);

        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API,
                                            "Share",
                                            "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Z)V",
                                            url,
                                            title,
                                            desc,
                                            tl);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API,
                                            "share:shareTitle:shareDesc:timeLine:",
                                            url,
                                            title,
                                            desc,
                                            tl);
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },
    
    shareResult:function(timeline) {
        if(this._isCapturing){
            return;
        }

        var tl = timeline != null;

        this._isTimeline = tl;

        this._isCapturing = true;
        var size = cc.director.getWinSize();
        var currentDate = new Date();
        var fileName = "result_share.jpg";
        var fullPath = jsb.fileUtils.getWritablePath() + fileName;
        if(jsb.fileUtils.isFileExist(fullPath)){
            jsb.fileUtils.removeFile(fullPath);
        }
        var texture = new cc.RenderTexture(Math.floor(size.width), Math.floor(size.height));
        texture.setPosition(cc.p(size.width/2, size.height/2));
        texture.begin();
        cc.director.getRunningScene().visit();
        texture.end();
        texture.saveToFile(fileName, cc.IMAGE_FORMAT_JPG);
        
        var self = this;
        var tryTimes = 0;
        var fn = function(){
            if(jsb.fileUtils.isFileExist(fullPath)){
                var height = 100;
                var scale = height/size.height;
			    var width = Math.floor(size.width * scale);
                
                if(cc.sys.os == cc.sys.OS_ANDROID){
					//cc.eventManager.removeCustomListeners(cc.game.EVENT_HIDE);

                    jsb.reflection.callStaticMethod(self.ANDROID_API, "ShareIMG", "(Ljava/lang/String;IIZ)V",fullPath,width,height, tl);
                }
                else if(cc.sys.os == cc.sys.OS_IOS){
                    jsb.reflection.callStaticMethod(self.IOS_API,
                                                    "shareIMG:width:height:timeLine:",
                                                    fullPath,
                                                    width,
                                                    height,
                                                    tl);
                }
                else{
                    console.log("platform:" + cc.sys.os + " dosn't implement share.");
                }
                self._isCapturing = false;
            }
            else{
                tryTimes++;
                if(tryTimes > 10){
                    console.log("time out...");
                    return;
                }
                setTimeout(fn,50); 
            }
        }
        setTimeout(fn,50);
    },

	pay: function(token, info) {
        let id = info.id;
    
		if (cc.sys.os == cc.sys.OS_ANDROID) {
			jsb.reflection.callStaticMethod(this.ANDROID_API, "Pay", "(Ljava/lang/String;I)V", token, id);
		} else if (cc.sys.os == cc.sys.OS_IOS) {
		    if (this._isBuying) {
		        console.log('isBuying...');
		        return;
		    }

		    this._isBuying = true;

            let product = info.product;

            console.log('buyProduct:' + product);

		    jsb.reflection.callStaticMethod(this.IOS_API, "buyProduct:", product);
		}
    },

	onPayResp: function(errcode, out_trade_no) {
		var data = {
			out_trade_no : out_trade_no,
			token : cc.vv.userMgr.sign
		};

		if (errcode != 0) {
			console.log('pay errcode=' + errcode);
			return;
		}
	
		cc.vv.http.sendRequest("/pay_wechat/query_order", data, function(ret) {
			if (!ret)
				return;

			console.log('query_order:');
			console.log(ret);

			var errcode = ret.errcode;
			if (errcode == cc.vv.global.const_code.ORDER.ORDER_SUCCESS) {
				var data = {
					currency : ret.currency,
					amount : ret.quantity
				};

				cc.vv.gg.show(data);
			}
			// TODO
		});
    },

    initIAP: function(identifiers) {
        if (!identifiers || identifiers.length == 0)
            return false;

        if (this._iapInited)
            return true;

        let args = identifiers.join(',');
        let receipts = jsb.fileUtils.getWritablePath() + "receipts/";

        this._receiptPath = receipts;

        if (!jsb.fileUtils.isDirectoryExist(receipts))
            jsb.fileUtils.createDirectory(receipts);

        jsb.reflection.callStaticMethod(this.IOS_API, "initIAP:receipts:", args, receipts);

        this._iapInited = true;
        return true;
    },

    buyIAP: function(identifier) {
        if (cc.sys.os != cc.sys.OS_IOS) {
            return false;
        }

        jsb.reflection.callStaticMethod(this.IOS_API, "buyProduct", identifier);
        return true;
	},

	onBuyIAPResp: function(ret, receipt) {
		console.log('onBuyIAPResp');

        cc.vv.anysdkMgr._isBuying = false;

		if (ret != 0) {
		    cc.vv.wc.hide();
		    cc.vv.alert.show('购买失败');
		    return true;
		}
		
		console.log('receipt: ' + receipt);
		
		var path = jsb.fileUtils.getWritablePath() + "receipts/" + receipt;
		
		if (!jsb.fileUtils.isFileExist(path)) {
		    console.log('receipt not exist !!!');
		    cc.vv.wc.hide();
		    return true;
		}
		
		var content = jsb.fileUtils.getStringFromFile(path);
		
		console.log('the path: ' + path);

		var args = {
		    token : cc.vv.userMgr.sign,
		    receipt : content
		};
		
		cc.vv.http.post('/pay_iap/query_order', args, ret=>{
		    console.log('ret from pay_iap');
		    let errcode = ret.errcode;
		    
		    cc.vv.wc.hide();
			if (errcode == cc.vv.global.const_code.ORDER.ORDER_SUCCESS) {
				var data = {
					currency : ret.currency,
					amount : ret.quantity
				};

				cc.vv.gg.show(data);
				
				jsb.fileUtils.removeFile(path);
			}
		});

		return true;
	},

    onLoginResp: function(code) {
    	console.log('onLoginResp');
        var fn = function(ret) {
            if (ret.errcode == 0) {
                cc.sys.localStorage.setItem("wx_account",ret.account);
                cc.sys.localStorage.setItem("wx_sign",ret.token);
            }

            cc.vv.userMgr.onAuth(ret);
        }

		if (code != null) {
	        cc.vv.http.sendRequest("/wechat_auth", {code:code,os:cc.sys.os}, fn);
		} else {
			cc.vv.wc.hide();
		}

    },

    onShareResp: function(code) {
        console.log('onShareResp, ret=' + code);

        if (0 == code && this._isTimeline) {
            cc.vv.pclient.request_apis('user_exec_wechatshare', {}, ret=>{
                if (ret.errcode != 0)
                    return;

                cc.vv.gg.show(ret.data);

                var hall = cc.find('Canvas').getComponent('Hall');
                if (hall != null)
                    hall.refreshShare();
            });
        }
    },

    setPortrait: function() {
        var view = cc.view;
        if (cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "changeOrientation", "(I)V", 1);
        } else if (cc.sys.isNative && cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "changeOrientation:", true);
        }
        else {
            view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
        }

        let width = view.getFrameSize().height > view.getFrameSize().width ? view.getFrameSize().width : view.getFrameSize().height;
        let height = view.getFrameSize().height < view.getFrameSize().width ? view.getFrameSize().width : view.getFrameSize().height;

        view.setFrameSize(width, height);
        console.log('set width=' + width + ' height=' + height);
        view.setDesignResolutionSize(720, 1280, cc.ResolutionPolicy.FIXED_HEIGHT); 
    },

    setLandscape: function() {
    	var view = cc.view;
        if (cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "changeOrientation", "(I)V", 0);
        } else if (cc.sys.isNative && cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "changeOrientation:", false);
        }
        else {
            view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
        }

        let width = view.getFrameSize().height < view.getFrameSize().width ? view.getFrameSize().width : view.getFrameSize().height;
        let height = view.getFrameSize().height > view.getFrameSize().width ? view.getFrameSize().width : view.getFrameSize().height;

        cc.view.setFrameSize(width, height);
        console.log('set width=' + width + ' height=' + height);
        cc.view.setDesignResolutionSize(1280, 720, cc.ResolutionPolicy.FIXED_WIDTH);
    },

    pick: function(notify) {
        var path = jsb.fileUtils.getWritablePath();
        this._pickNotify = notify;

        if (!cc.sys.isNative)
            return;

        console.log('pick path: ' + path);

        var file = path + 'icon.jpg';

        if(jsb.fileUtils.isFileExist(file)){
            jsb.fileUtils.removeFile(file);
        }

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_IMG_API, "pickImage", "(Ljava/lang/String;)V", path);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "pickImage:", path);
        }
    },

    onPickResp: function(code) {
        var notify = this._pickNotify;
        var path = jsb.fileUtils.getWritablePath() + 'icon.jpg';

        console.log('onPickResp code:' + code + ' notify:' + notify);
        console.log('path: ' + path);
        if (notify != null)
            notify.emit('pick_result', { result: code, path: path });
    },
    
    getBatteryInfo: function() {
        let info = {
            power: 100,
            state: 'full'   // unplugged: 1, charging: 2, full: 3
        };
        
        // TODO
        return info;
        
        if (!cc.sys.isNative)
            return info;

        if (cc.sys.os == cc.sys.OS_ANDROID)
            return info;    // TODO
        else if (cc.sys.os === cc.sys.OS_IOS) {
            let val = jsb.reflection.callStaticMethod(this.IOS_API, 'getBatteryInfo');
            
            console.log('getBatteryInfo ret=' + val);
            
            info.power = val % 1000;
        
            let tmp = parseInt(val / 1000);
            if (tmp == 2)
                info.state = 'charging';
            else if (tmp == 3)
                info.state = 'full';
            else
                info.state = 'unplugged';

            return info;
        }
    },
    
    getNetworkInfo: function() {
        let info = {
            type: 'wifi',
            strength: 4
        }
        
        // TODO
        return info;
        
        if (!cc.sys.isNative)
            return info;
            
        if (cc.sys.os == cc.sys.OS_ANDROID)
            return info;    // TODO
        else if (cc.sys.os === cc.sys.OS_IOS) {
            let val = jsb.reflection.callStaticMethod(this.IOS_API, 'getNetworkInfo');
            
            console.log('getNetworkInfo ret=' + val);
            
            info.strength = val % 1000;
        
            let tmp = parseInt(val / 1000);
            let types = [ 'N', 'wifi', '2G', '3G', '4G', '5G' ];
            
            if (tmp >= types.length)
                info.type = 'N';
            else
                info.type = types[tmp];

            return info;
        }
    },
    
    onInvite: function(query) {
        console.log('onInvite: ' + query);
        let utils = cc.vv.utils;

        if (!query || query.length == 0)
            return;

        let params = utils.queryParse(query);
        
        let roomid = params.room;
        let clubid = params.club;

        console.log('roomid=' + roomid);
        console.log('clubid=' + clubid);

        let scene = cc.director.getScene().name;
        if (scene == 'hall') {
            let hall = cc.find('Canvas').getComponent('Hall');
            if (hall != null)
                hall.checkQuery();

        } else if (scene == 'mjgame') {
            cc.vv.anysdkMgr.clearQuery();
        }
    },
    
    getQuery: function() {
        if (!cc.sys.isNative)
            return null;

        if (cc.sys.os == cc.sys.OS_ANDROID)
            return null;  // TODO

        console.log('getQuery');

        let ret = jsb.reflection.callStaticMethod(this.IOS_API, 'getQuery');
        
        console.log('get query: ' + ret);
        return ret;
    },
    
    clearQuery: function() {
        if (!cc.sys.isNative)
            return;

        if (cc.sys.os == cc.sys.OS_ANDROID)
            return; // TODO

        console.log('clear query');

        jsb.reflection.callStaticMethod(this.IOS_API, 'clearQuery');

        return;
    }
});
