
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        var top = this.node.getChildByName('top');
        var btn_save = top.getChildByName('btn_save');
        var btn_back = top.getChildByName('btn_back');

        cc.vv.utils.addClickEvent(btn_save, this.node, 'SetClub', 'onBtnSave');
        cc.vv.utils.addClickEvent(btn_back, this.node, 'SetClub', 'onBtnClose');
	},

    onEnable : function() {
        this.refresh();
    },

    refresh : function() {
        var content = cc.find('body/items/view/content', this.node);
        var head = cc.find('logo/icon/head', content);
        var edt_name = cc.find('name/edt_name', content).getComponent(cc.EditBox);
        var edt_desc = cc.find('desc/edt_desc', content).getComponent(cc.EditBox);
        var auto_start = cc.find('params/auto_start', content).getComponent('CheckBox');
        var data = this.node.clubInfo;

		cc.vv.utils.loadImage(data.logo, head);

        edt_name.string = data.name;
        edt_desc.string = data.desc;
        auto_start.setChecked(data.auto_start);
    },

    onBtnClose: function() {
        cc.vv.audioMgr.playButtonClicked();
		this.node.active = false;
    },

    onBtnSave: function() {
        cc.vv.audioMgr.playButtonClicked();

        this.setClub();
    },

    setClub: function() {
        var content = cc.find('body/items/view/content', this.node);
        var edt_name = cc.find('name/edt_name', content).getComponent(cc.EditBox);
        var edt_desc = cc.find('desc/edt_desc', content).getComponent(cc.EditBox);
        var auto_start = cc.find('params/auto_start', content).getComponent('CheckBox');
        var clubInfo = this.node.clubInfo;

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
            id : clubInfo.id,
            name : edt_name.string,
            desc : edt_desc.string,
            logo : '', // TODO
            auto_start : auto_start.checked
        };

        var self = this;
        var pp = this.node.parent_page;

        cc.vv.pclient.request_apis('set_club', data, ret=>{
            if (ret.errcode != 0) {
                cc.vv.alert.show(ret.errmsg);
                return;
            }

            cc.vv.alert.show('俱乐部设置成功！', ()=>{
                self.node.active = false;
                if (pp != null)
                    pp.refresh();
            });
        });
    },
});

