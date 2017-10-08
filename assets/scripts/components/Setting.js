
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        var node = this.node;
        
        var btn_back = cc.find('top/btn_back', node);
        
        cc.vv.utils.addClickEvent(btn_back, node, 'Setting', 'onBtnClose');
    },
    
    onBtnClose: function() {
        this.node.active = false;
    },
    
    onBtnAudio: function() {
        console.log('onBtnAudio');
        
        var content = cc.find('items/view/content', this.node);
        var item = content.children[0];
        var check = item.getChildByName('btn_switch').getComponent('CheckBox');

        console.log(check.checked);
    },
    
    onBtnRating: function() {
        console.log('onBtnRating');
    },
    
    onBtnAboutUs: function() {
        console.log('onBtnAbutUs');
    },
});

