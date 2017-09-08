
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        var bottom = this.node.getChildByName('bottom');
        var btn_create = bottom.getChildByName('btn_create');
        var btn_add = bottom.getChildByName('btn_add');

        cc.vv.utils.addClickEvent(btn_create, this.node, 'CreateClub', 'onBtnCreate');
        cc.vv.utils.addClickEvent(btn_add, this.node, 'CreateClub', 'onBtnAdd');

        var btn_back = cc.find('top/btn_back', this.node);

        cc.vv.utils.addClickEvent(btn_back, this.node, 'CreateClub', 'onBtnClose');
	},

    onEnable : function() {
        this.refresh();
    },

    refresh : function() {
        // TODO
    },

    onBtnClose: function() {
        cc.vv.audioMgr.playButtonClicked();
		this.node.active = false;
    },

    onBtnCreate: function() {
        cc.vv.audioMgr.playButtonClicked();

        this.createClub();
    },

    onBtnAdd: function() {

    },

    createClub: function() {
        var content = cc.find('body/items/view/content', this.node);
        var edt_name = cc.find('name/edt_name', content).getComponent(cc.EditBox);
        var edt_desc = cc.find('desc/edt_desc', content).getComponent(cc.EditBox);

        var msg = null;

        if (edt_name.string == '')
            msg = '俱乐部名字不能为空';
        else if (edt_desc.string == '')
            msg = '请填写俱乐部介绍';

        if (msg != null) {
            cc.vv.alert.show(msg);
            return;
        }

        var data = {
            name : edt_name.string,
            desc : edt_desc.string,
            logo : '' // TODO
        };

        var self = this;
        var pp = this.node.parent_page;

        cc.vv.pclient.request_apis('create_club', data, ret=>{
            if (ret.errcode != 0) {
                cc.vv.alert.show(ret.errmsg);
                return;
            }

            cc.vv.alert.show('俱乐部创建成功！', ()=>{
                edt_name.string = '';
                edt_desc.string = '';

                self.node.active = false;
                if (pp != null)
                    pp.refresh();
            });
        });
    },
});

