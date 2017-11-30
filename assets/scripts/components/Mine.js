
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        var me = this.node.getChildByName('me');
		var head = cc.find('icon/head', me).getComponent('ImageLoader');
        var name = me.getChildByName('name').getComponent(cc.Label);

		head.setUserID(cc.vv.userMgr.userId);
        name.string = cc.vv.userMgr.userName;
    },

	onClubClicked: function() {
		var club_list = cc.find('Canvas/club_list');

		club_list.active = true;
    },

    onShopClicked: function() {
        var shop = cc.find('Canvas/shop');

        shop.active = true;
    },
    
    onFeedback: function() {
        var fb = cc.find('Canvas/feedback');

        fb.active = true;
    },
    
    onSetting: function() {
        var setting = cc.find('Canvas/setting');

        setting.active = true;
    },
    
    onAchieve: function() {
        let achieve = cc.find('Canvas/achieve');
        
        achieve.active = true;
    },
});

