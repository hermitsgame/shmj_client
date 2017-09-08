
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        var musicBg = cc.find('body/music_bg', this.node);
        var musicGame = cc.find('body/music_game', this.node);

        musicBg.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume;
        musicGame.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        musicBg.getChildByName('body').getComponent(cc.Sprite).fillRange = cc.vv.audioMgr.bgmVolume;
        musicGame.getChildByName('body').getComponent(cc.Sprite).fillRange = cc.vv.audioMgr.sfxVolume;

        musicBg.on('slide', this.onSliderChanged, this);
        musicGame.on('slide', this.onSliderChanged, this);

        var btnLogout = cc.find('body/btnLogout', this.node);

        if (cc.director.getScene().name == 'hall') {
            cc.vv.utils.addClickEvent(btnLogout, this.node, "AudioSet", "onLogoutClicked");
        } else {
            btnLogout.active = false;
        }

        var btnClose = cc.find('body/btnClose', this.node);
        cc.vv.utils.addClickEvent(btnClose, this.node, "AudioSet", "onCloseClicked");
    },

    onSliderChanged: function(event) {
        var slide = event.detail;
        var node = slide.node;
        var body = node.getChildByName('body').getComponent(cc.Sprite);
        var val = slide.progress;

        body.fillRange = val;

        if (node.name == 'music_bg')
            cc.vv.audioMgr.setBGMVolume(val);
        else
            cc.vv.audioMgr.setSFXVolume(val);
    },

    onLogoutClicked: function() {
        cc.vv.audioMgr.playButtonClicked();
        cc.vv.utils.showDialog(this.node, 'body', false);

    	cc.vv.alert.show('确认重新登录吗?', ()=>{
            cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            cc.vv.userMgr.userId = null;
            cc.vv.pclient.disconnect();
            cc.director.loadScene("login");
        }, true);
    },

    onCloseClicked: function() {
        cc.vv.audioMgr.playButtonClicked();
        cc.vv.utils.showDialog(this.node, 'body', false);
    },
});

