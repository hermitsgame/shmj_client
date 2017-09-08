

function loadImage(url,code,callback){
    /*
    if(cc.vv.images == null){
        cc.vv.images = {};
    }
    var imageInfo = cc.vv.images[url];
    if(imageInfo == null){
        imageInfo = {
            image:null,
            queue:[],
        };
        cc.vv.images[url] = imageInfo;
    }

    cc.loader.load(url,function (err,tex) {
        imageInfo.image = tex;
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        for(var i = 0; i < imageInfo.queue.length; ++i){
            var itm = imageInfo.queue[i];
            itm.callback(itm.code,spriteFrame);
        }
        itm.queue = [];
    });
    if(imageInfo.image != null){
        var tex = imageInfo.image;
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code,spriteFrame);
    }
    else{
        imageInfo.queue.push({code:code,callback:callback});
    }*/

	console.log('load ' + code + ': ' + url);

	var addr = {
		url : url,
		type : 'jpg'
	};

    cc.loader.load(addr, function(err,tex) {
		if (err) {
			console.log(err);
			return;
    	}

        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code, spriteFrame);
    });
};

function getBaseInfo(userid,callback){
    console.log("enter getBaseInfo=" + userid);
    if(cc.vv.baseInfoMap == null){
        cc.vv.baseInfoMap = {};
    }

    if(cc.vv.baseInfoMap[userid] != null){
        callback(userid,cc.vv.baseInfoMap[userid]);
    } else {
		var data = {
			uid: userid,
		};
		
        cc.vv.pclient.request_apis("query_base_info", data, function(ret) {
            if ( cc.vv.global.const_code.OK !== ret.code )
            {
                console.log("req wrong:" + ret.code );
                return;
            }

            var url = null;
            if (ret.headimgurl) {
               url = ret.headimgurl;// + ".jpg";
            }
            console.log("url=" + url);
            var info = {
                name:ret.name,
                sex:ret.sex,
                url:url
            };
            cc.vv.baseInfoMap[userid] = info;
            callback(userid,info);
        });
    }
};

cc.Class({
    extends: cc.Component,
    properties: {

    },

    onLoad: function () {
        this.setupSpriteFrame();
    },

	setLogo: function(uid, logo) {
		if (!cc.sys.isNative)
			return;

		if (!uid || !logo)
			return;

		if (cc.vv.baseInfoMap == null)
			cc.vv.baseInfoMap = {};

		var self = this;

		var info = cc.vv.baseInfoMap[uid];

		if (!info) {
			info = {
                name: '',
                sex: 0
            };

			cc.vv.baseInfoMap[uid] = info;
		}

		info.url = logo;

		loadImage(logo, uid, function(err, spriteFrame) {
        	self._spriteFrame = spriteFrame;
            self.setupSpriteFrame();
        });
    },

    setUserID: function(userid) {
		if (!cc.sys.isNative)
			return;

		if (!userid)
			return;

        var self = this;
        getBaseInfo(userid, function(code,info) {
           if (info && info.url) {
                loadImage(info.url,userid,function (err,spriteFrame) {
                    self._spriteFrame = spriteFrame;
                    self.setupSpriteFrame();
                });
            }
        });
    },

    setupSpriteFrame: function() {
        if (this._spriteFrame) {
            var spr = this.getComponent(cc.Sprite);
            if (spr) {
                spr.spriteFrame = this._spriteFrame;
            }
        }
    }
});

