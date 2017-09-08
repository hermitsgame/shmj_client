
cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    onLoad: function () {
        var edt_id = this.node.getChildByName('edt_id').getComponent(cc.EditBox);
        var btn_close = this.node.getChildByName('btn_close');
        var btn_ok = this.node.getChildByName('btn_ok');

        cc.vv.utils.addClickEvent(btn_close, this.node, 'JoinClub', 'onBtnClose');
        cc.vv.utils.addClickEvent(btn_ok, this.node, 'JoinClub', 'onBtnApply');
    },

    onEnable : function() {
        var edt_id = this.node.getChildByName('edt_id').getComponent(cc.EditBox);

        edt_id.string = '';
    },

    onBtnClose : function() {
        this.node.active = false;
    },

    onBtnApply : function() {
        var edt_id = this.node.getChildByName('edt_id').getComponent(cc.EditBox);
        var club_id = edt_id.string;

        if (club_id == '') {
            cc.vv.alert.show('请填写俱乐部ID');
            return;
        }

        var data = {
			club_id : club_id
		};

        var self = this;

		cc.vv.pclient.request_apis('apply_join_club', data, ret=>{
			if (ret.errcode != 0) {
				cc.vv.alert.show(ret.errmsg);
				return;
			}

			cc.vv.alert.show('已成功申请，请等待管理员审核', ()=>{
                self.node.active = false;
                edt_id.string = '';
            });
		});
    },
});

