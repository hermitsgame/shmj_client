
cc.Class({
    extends: cc.Component,

    properties: {
		_tempClub : null,
    },

    onLoad: function() {
		var content = cc.find('clubs/view/content', this.node);
		var item = content.children[0];

		cc.vv.utils.addClickEvent(item, this.node, 'Clubs', 'onBtnClubClicked');

		this._tempClub = item;
		content.removeChild(item, false);

		var top = this.node.getChildByName('top');
		var btn_add = top.getChildByName('btn_add');

		cc.vv.utils.addClickEvent(btn_add, this.node, 'Clubs', 'onBtnAdd');

        var popup = this.node.getChildByName('popup');
        var btn_join = popup.getChildByName('btn_join');
        var btn_create = popup.getChildByName('btn_create');

        cc.vv.utils.addClickEvent(btn_join, this.node, 'Clubs', 'onBtnJoin');
        cc.vv.utils.addClickEvent(btn_create, this.node, 'Clubs', 'onBtnCreate');
        
        let root = cc.find('Canvas');
        let self = this;
        root.on('sys_message_updated', data=>{
            console.log('got sys_message_updated');
            if (self.node.active)
                self.refresh();
        });
    },

	onEnable: function() {
		this.refresh();
    },

	onBtnAdd : function() {
        var popup = this.node.getChildByName('popup');

        popup.active = !popup.active;
    },

    onBtnJoin : function() {
        var join_club = cc.find('Canvas/join_club');
        var popup = this.node.getChildByName('popup');

		join_club.active = true;
        popup.active = false;
    },

    onBtnCreate : function() {
        var create_club = cc.find('Canvas/create_club');
        var popup = this.node.getChildByName('popup');

        create_club.parent_page = this;
		create_club.active = true;
        popup.active = false;
    },

	onBtnClubClicked: function(event) {
		var item = event.target;
		var userMgr = cc.vv.userMgr;
		var is_admin = item.is_admin;

		userMgr.club_id = item.club_id;
		userMgr.is_admin = is_admin;

		var lobby = is_admin ? 'admin' : 'lobby';
		var next = cc.find('Canvas/' + lobby);

		next.club_id = item.club_id;
		next.active = true;
    },

	refresh: function() {
		var self = this;

        console.log('Clubs refresh');

		cc.vv.pclient.request_apis('list_clubs', {}, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.showClubs(ret.data);
		});
    },

	getClubItem: function(index) {
		var content = cc.find('clubs/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        var node = cc.instantiate(this._tempClub);

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
		var content = cc.find('clubs/view/content', this.node);

		for (var i = 0; i < clubs.length; i++) {
			var club = clubs[i];
			var item = this.getClubItem(i);
			var name = item.getChildByName('name').getComponent(cc.Label);
            var id = item.getChildByName('id').getComponent(cc.Label);
			var head = cc.find('icon/head', item);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var headcount = item.getChildByName('headcount').getComponent(cc.Label);
			let admin = item.getChildByName('admin');

			name.string = club.name;
            id.string = 'ID:' + club.id;
			desc.string = club.desc;
			headcount.string = club.member_num + ' / ' + club.max_member_num;
            admin.active = club.is_admin;

            item.color = club.is_admin ? new cc.Color(66, 66, 66, 255) : new cc.Color(14, 15, 17, 255);

			cc.vv.utils.loadImage(club.logo, head);

			item.club_id = club.id;
			item.is_admin = club.is_admin;
		}

		this.shrinkContent(content, clubs.length);
    },
});

