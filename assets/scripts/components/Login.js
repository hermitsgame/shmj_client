
String.prototype.format = function(args) { 
    if (arguments.length>0) { 
        var result = this; 
        if (arguments.length == 1 && typeof (args) == "object") { 
            for (var key in args) { 
                var reg=new RegExp ("({"+key+"})","g"); 
                result = result.replace(reg, args[key]); 
            } 
        } 
        else { 
            for (var i = 0; i < arguments.length; i++) { 
                if(arguments[i]==undefined) { 
                    return ""; 
                } 
                else { 
                    var reg=new RegExp ("({["+i+"]})","g"); 
                    result = result.replace(reg, arguments[i]); 
                } 
            } 
        } 
        return result; 
    } 
    else {
        return this; 
    } 
};
 
cc.Class({
    extends: cc.Component,

    properties: {
        _agreeCheck: null,
    },

    onLoad: function() {
        if(!cc.sys.isNative && cc.sys.isMobile){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }

        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }

        cc.vv.http.url = cc.vv.http.master_url;

        //cc.vv.audioMgr.playBackGround(); // TODO

        cc.find("Canvas/btn_guest").active = (!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS);

        //this._agreeCheck = cc.find("Canvas/agreement/check").getComponent("CheckBox");
    },
    
    start:function() {
        var account =  cc.sys.localStorage.getItem("wx_account");
        var sign = cc.sys.localStorage.getItem("wx_sign");
		
        if (account != null && sign != null) {
            var ret = {
                errcode:0,
                account:account,
                token:sign
            }

            cc.vv.userMgr.onAuth(ret);
        }
    },
    
    onBtnQuickStartClicked: function() {
        cc.vv.audioMgr.playButtonClicked();

/*
        if (this._agreeCheck.checked) {
            cc.vv.userMgr.guestAuth();
        } else {
            this.agreementAlert.active = true;
            cc.vv.alert.show("您必须先同意用户协议！", null, false);
        }
*/
		cc.vv.userMgr.guestAuth();
    },
    
    onBtnWeichatClicked: function() {
/*
        cc.vv.audioMgr.playButtonClicked();
        if (this._agreeCheck.checked) {
			cc.vv.wc.show();
			cc.vv.anysdkMgr.login();
        } else {
            cc.vv.alert.show("您必须先同意用户协议！", null, false);
        }
*/
		cc.vv.anysdkMgr.login();
    },

    onBtnAgreementClicked: function() {
        // TODO
    },
});

