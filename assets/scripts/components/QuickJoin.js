
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {

    },

	onBtnClose:function() {
        cc.vv.audioMgr.playButtonClicked();
		this.node.active = false;
    },

    onBtnQuickJoinClicked: function() {
        var edtRoom = this.node.getChildByName('edt_room').getComponent(cc.EditBox);

        var roomId = edtRoom.string;
        var self = this;

        cc.vv.userMgr.enterRoom(roomId, function(ret) {
            if (ret.errcode == 0) {
                self.node.active = false;
            }
            else {
                var content = "房间["+ roomId +"]不存在，请重新输入!";
                if(ret.errcode == 4){
                    content = "房间["+ roomId + "]已满!";
                }
                cc.vv.alert.show(content);
            }
        });
    },
});

