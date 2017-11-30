
cc.Class({
    extends: cc.Component,

    properties: {
        _temp : null
    },

    onLoad: function() {
        let content = cc.find('items/view/content', this.node);
        let item = content.children[0];
        let addEvent = cc.vv.utils.addClickEvent;

        addEvent(item, this.node, 'ClubList', 'onBtnClubClicked');

        this._temp = item;
        content.removeChild(item, false);

        let top = this.node.getChildByName('top');
        let btn_back = top.getChildByName('btn_back');
        let btn_add = top.getChildByName('btn_add');

        addEvent(btn_back, this.node, 'ClubList', 'onBtnClose');
        addEvent(btn_add, this.node, 'ClubList', 'onBtnAdd');
    },

    onEnable : function() {
        this.refresh();
    },

    onBtnClubClicked: function(event) {
        let item = event.target;
        let club_detail = cc.find('Canvas/club_detail');

        club_detail.club_id = item.club_id;
        club_detail.is_admin = item.is_admin;
        club_detail.parent_page = this;

        club_detail.active = true;
    },

    onBtnClose : function() {
        this.node.active = false;
    },

    onBtnAdd : function() {
        let club_apply = cc.find('Canvas/club_apply');

        club_apply.active = true;
    },

    refresh: function() {
        let self = this;

        cc.vv.pclient.request_apis('list_clubs', {}, ret=>{
            if (!ret || ret.errcode != 0)
                return;

            self.showClubs(ret.data);
        });
    },

    getClubItem: function(index) {
        let content = cc.find('items/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        let node = cc.instantiate(this._temp);

        content.addChild(node);
        return node;
    },

	shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

    showClubs: function(clubs) {
        let content = cc.find('items/view/content', this.node);

        for (let i = 0; i < clubs.length; i++) {
            let club = clubs[i];
            let item = this.getClubItem(i);
            let name = item.getChildByName('name').getComponent(cc.Label);
            let id = item.getChildByName('id').getComponent(cc.Label);
            let head = cc.find('icon/head', item);
		    let desc = item.getChildByName('desc').getComponent(cc.Label);
            let headcount = item.getChildByName('headcount').getComponent(cc.Label);
            let admin = item.getChildByName('admin');

            name.string = club.name;
            id.string = 'ID:' + club.id;
            desc.string = club.desc;
            headcount.string = club.member_num + ' / ' + club.max_member_num;
            admin.active = club.is_admin;

            item.color = club.is_admin ? new cc.Color(66, 66, 66, 255) : new cc.Color(14, 15, 17, 255);

            console.log('showClubs: ' + club.logo);
            cc.vv.utils.loadImage(club.logo, head);

            item.club_id = club.id;
            item.is_admin = club.is_admin;
        }

        this.shrinkContent(content, clubs.length);
    },
});

