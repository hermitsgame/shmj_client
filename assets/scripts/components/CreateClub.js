
cc.Class({
    extends: cc.Component,

    properties: {
        _pickPath: null
    },

    onLoad: function() {
        var bottom = this.node.getChildByName('bottom');
        var btn_create = bottom.getChildByName('btn_create');
        var btn_add = bottom.getChildByName('btn_add');

        cc.vv.utils.addClickEvent(btn_create, this.node, 'CreateClub', 'onBtnCreate');
        cc.vv.utils.addClickEvent(btn_add, this.node, 'CreateClub', 'onBtnAdd');

        var btn_back = cc.find('top/btn_back', this.node);

        cc.vv.utils.addClickEvent(btn_back, this.node, 'CreateClub', 'onBtnClose');

        var content = cc.find('body/items/view/content', this.node);
        var icon = cc.find('logo/icon', content);
        var head = icon.getChildByName('head');

        cc.vv.utils.addClickEvent(icon, this.node, 'CreateClub', 'onBtnIcon');

        var self = this;
        icon.on('pick_result', data=>{
            var data = data.detail;
            var ret = data.result;
            var path = data.path;

            console.log('pick_result: ' + data.path);

            if (ret != 0)
                return;

            self._pickPath = path;
            cc.vv.utils.loadImage(path, head, true);
        });
	},

    onEnable : function() {
        this.reset();
    },

    reset : function() {
        var content = cc.find('body/items/view/content', this.node);
        var edt_name = cc.find('name/edt_name', content).getComponent(cc.EditBox);
        var edt_desc = cc.find('desc/edt_desc', content).getComponent(cc.EditBox);
        var head = cc.find('logo/icon/head', content).getComponent(cc.Sprite);

        this._pickPath = null;
        edt_name.string = '';
        edt_desc.string = '';

        head.spriteFrame = null;
    },

    onBtnClose: function() {
        cc.vv.audioMgr.playButtonClicked();
		this.node.active = false;
    },

    onBtnIcon: function(event) {
        cc.vv.anysdkMgr.pick(event.target);
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
            desc : edt_desc.string
        };

        var self = this;
        var pp = this.node.parent_page;

        if (cc.sys.isNative && this._pickPath) {
            var fileData = jsb.fileUtils.getDataFromFile(this._pickPath);
            if (fileData) {
                var content = cc.vv.crypto.encode(fileData);

                data.logo = content;
            }
        }

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

