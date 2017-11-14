
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
        let addClickEvent = cc.vv.utils.addClickEvent;

        addClickEvent(btn_edit, this.node, 'SetMember', 'onBtnEditClicked');
        addClickEvent(btn_history, this.node, 'SetMember', 'onBtnHistoryClicked');

        this._temp = item;
        content.removeChild(item, false);

        let edit = this.node.getChildByName('edit');
        let btn_cscore = edit.getChildByName('btn_cscore');
        let btn_climit = edit.getChildByName('btn_climit');
        let btn_close = edit.getChildByName('btn_close');
        let btn_ok = edit.getChildByName('btn_ok');

        addClickEvent(btn_cscore, this.node, 'SetMember', 'onBtnEditWinClicked');
        addClickEvent(btn_climit, this.node, 'SetMember', 'onBtnEditWinClicked');
        addClickEvent(btn_close, this.node, 'SetMember', 'onBtnEditWinClicked');
        addClickEvent(btn_ok, this.node, 'SetMember', 'onBtnEditWinClicked');

        let btnClose = cc.find('top/btn_back', this.node);
        addClickEvent(btnClose, this.node, 'SetMember', 'onBtnClose');
    },

    onEnable: function() {
        this.refresh();
    },

    onBtnClose: function() {
        this.node.active = false;
    },

    onBtnEditClicked: function(event) {
        let member = event.target.parent.member;
        let edit = this.node.getChildByName('edit');
        let edt_score = edit.getChildByName('edt_score').getComponent(cc.EditBox);
        let edt_limit = edit.getChildByName('edt_limit').getComponent(cc.EditBox);

        edit.member = member;
        edt_score.string = member.score;
        edt_limit.string = '' + (0 - member.limit);
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
                cc.vv.alert.show('额度必须小于或者等于0');
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

