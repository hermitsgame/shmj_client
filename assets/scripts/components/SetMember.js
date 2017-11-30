
cc.Class({
    extends: cc.Component,

    properties: {
        _temp : null,
    },

    onLoad: function() {
        let content = cc.find('items/view/content', this.node);
        let item = content.children[0];
        let btn_edit = item.getChildByName('btn_edit');
        let btn_history = item.getChildByName('btn_history');
        let addEvent = cc.vv.utils.addClickEvent;

        addEvent(btn_edit, this.node, 'SetMember', 'onBtnEditClicked');
        addEvent(btn_history, this.node, 'SetMember', 'onBtnHistoryClicked');

        this._temp = item;
        content.removeChild(item, false);

        let edit = this.node.getChildByName('edit');
        let btn_cscore = edit.getChildByName('btn_cscore');
        let btn_climit = edit.getChildByName('btn_climit');
        let btn_close = edit.getChildByName('btn_close');
        let btn_ok = edit.getChildByName('btn_ok');
        let btn_del = edit.getChildByName('btn_del');
        let btn_admin = edit.getChildByName('btn_admin');

        addEvent(btn_cscore, this.node, 'SetMember', 'onBtnEditWinClicked');
        addEvent(btn_climit, this.node, 'SetMember', 'onBtnEditWinClicked');
        addEvent(btn_close, this.node, 'SetMember', 'onBtnEditWinClicked');
        addEvent(btn_ok, this.node, 'SetMember', 'onBtnEditWinClicked');
        addEvent(btn_del, this.node, 'SetMember', 'onBtnDel');
        addEvent(btn_admin, this.node, 'SetMember', 'onBtnAdmin');

        let btnClose = cc.find('top/btn_back', this.node);
        addEvent(btnClose, this.node, 'SetMember', 'onBtnClose');
    },

    onEnable: function() {
        this.refresh();
    },

    onBtnClose: function() {
        this.node.active = false;
    },

    onBtnDel: function(event) {
        let self = this;
        let edit = event.target.parent;
        let member = edit.member;
        let data = {
            club_id : this.node.club_id,
            user_id : member.id,
        };

        cc.vv.pclient.request_apis('leave_club', data, ret=>{
            if (!ret || ret.errcode != 0)
                return;

            edit.active = false;
            self.refresh();
        });
    },

    onBtnAdmin: function(event) {
        let self = this;
        let edit = event.target.parent;
        let btn_admin = edit.getChildByName('btn_admin');
        let tile = btn_admin.getChildByName('tile').getComponent(cc.Label);
        let member = edit.member;
        let admin = !member.admin;

        let data = {
            club_id : this.node.club_id,
            user_id : member.id,
            admin : admin
        };

        cc.vv.pclient.request_apis('prompt_club_member', data, ret=>{
            if (!ret || ret.errcode != 0)
                return;

            edit.active = false;
            self.refresh();
            
            let msg = (admin ? '已设置' : '已取消' + member.name + '管理员权限');
            cc.vv.alert.show(msg);
        });
    },

    onBtnEditClicked: function(event) {
        let member = event.target.parent.member;
        let edit = this.node.getChildByName('edit');
        let edt_score = edit.getChildByName('edt_score').getComponent(cc.EditBox);
        let edt_limit = edit.getChildByName('edt_limit').getComponent(cc.EditBox);
        let btn_admin = edit.getChildByName('btn_admin');

        edit.member = member;
        edt_score.string = member.score;
        edt_limit.string = '' + (0 - member.limit);
        
        let tile = btn_admin.getChildByName('tile').getComponent(cc.Label);
        
        tile.string = member.admin ? '取消管理员' : '设为管理员';
        
        edit.active = true;
    },

    onBtnEditWinClicked: function(event) {
        let name = event.target.name;
        let edit = this.node.getChildByName('edit');
        let edt_score = edit.getChildByName('edt_score').getComponent(cc.EditBox);
        let edt_limit = edit.getChildByName('edt_limit').getComponent(cc.EditBox);

        if (name == 'btn_cscore') {
            edt_score.string = '0';
        } else if (name == 'btn_climit') {
            edt_limit.string = '0';
        } else if (name == 'btn_close') {
            edit.active = false;
        } else if (name == 'btn_ok') {
            let member = edit.member;
            let limit = parseInt(edt_limit.string);
            let self = this;

            if (limit == null || limit < 0) {
                cc.vv.alert.show('活力值必须小于或者等于0');
                edt_limit.string = '0';
                return;
            }

            limit = 0 - limit;

            let data = {
                user_id : member.id,
                club_id : this.node.club_id,
                score : parseInt(edt_score.string) || 0,
                limit : limit
            };

            cc.vv.pclient.request_apis('setup_club_member', data, ret=>{
                if (!ret || ret.errcode != 0)
                    return;

                edit.active = false;
                self.refresh();
            });
        }
    },

    onBtnHistoryClicked: function(event) {
        let member = event.target.parent.member;
        let history = cc.find('Canvas/club_history');

        let data = {
            user_id : member.id,
            club_id : this.node.club_id
        };

        cc.vv.historyParam = data;
        history.active = true;
    },

    refresh: function() {
        let self = this;
        let data = {
            club_id : this.node.club_id
        };

        cc.vv.pclient.request_apis('list_club_members', data, ret=>{
            if (!ret || ret.errcode != 0)
                return;

            self.showItems(ret.data);
        });
    },

    getItem: function(index) {
        let content = cc.find('items/view/content', this.node);

        if (content.childrenCount > index)
            return content.children[index];

        let node = cc.instantiate(this._temp);

        content.addChild(node);
        return node;
    },

    shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            let lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

    showItems: function(data) {
        let content = cc.find('items/view/content', this.node);

        for (let i = 0; i < data.length; i++) {
            let member = data[i];
            let item = this.getItem(i);
            let name = item.getChildByName('name').getComponent(cc.Label);
            let id = item.getChildByName('id').getComponent(cc.Label);
            let score = item.getChildByName('score').getComponent(cc.Label);
            let limit = item.getChildByName('limit').getComponent(cc.Label);
            let head = cc.find('icon/head', item).getComponent('ImageLoader');

            name.string = member.name.slice(0, 5);
            id.string = member.id;
            score.string = member.score;
            limit.string = member.limit;
            head.setLogo(member.id, member.logo);

            item.member = member;
        }

        this.shrinkContent(content, data.length);
    },
});

