cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    onLoad: function () {
        let btnClose = cc.find('top/btn_back', this.node);
		cc.vv.utils.addClickEvent(btnClose, this.node, 'Achieve', 'onBtnClose');
    },
    
    onBtnClose: function() {
        this.node.active = false;
    }
});
