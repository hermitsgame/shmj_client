
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        let node = this.node;
        let btn_back = cc.find('top/btn_back', node);
        let addEvent = cc.vv.utils.addClickEvent;

        addEvent(btn_back, node, 'Setting', 'onBtnClose');

        let content = cc.find('items/view/content', node);
        let musicGame = cc.find('music_game/score', content);
        let musicBg = cc.find('music_bg/score', content);

        musicBg.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume;
        musicGame.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        musicBg.getChildByName('body').getComponent(cc.Sprite).fillRange = cc.vv.audioMgr.bgmVolume;
        musicGame.getChildByName('body').getComponent(cc.Sprite).fillRange = cc.vv.audioMgr.sfxVolume;

        musicBg.on('slide', this.onSliderChanged, this);
        musicGame.on('slide', this.onSliderChanged, this);
    },

    onBtnClose: function() {
        this.node.active = false;
    },

    onSliderChanged: function(event) {
        let slide = event.detail;
        let node = slide.node;
        let body = node.getChildByName('body').getComponent(cc.Sprite);
        let val = slide.progress;

        body.fillRange = val;

        if (node.parent.name == 'music_bg')
            cc.vv.audioMgr.setBGMVolume(val);
        else
            cc.vv.audioMgr.setSFXVolume(val);
    },

    onBtnRating: function() {
        console.log('onBtnRating');
    },

    onBtnAboutUs: function() {
        console.log('onBtnAbutUs');
    },
});

