
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];

		cc.vv.utils.addClickEvent(item, this.node, 'ClubList', 'onBtnClubClicked');

		this._temp = item;
		content.removeChild(item, false);

		var top = this.node.getChildByName('top');
		var btn_back = top.getChildByName('btn_back');
		var btn_add = top.getChildByName('btn_add');

		cc.vv.utils.addClickEvent(btn_back, this.node, 'ClubList', 'onBtnClose');
		cc.vv.utils.addClickEvent(btn_add, this.node, 'ClubList', 'onBtnAdd');
    },

	onEnable : function() {
		this.refresh();
    },

	onBtnClubClicked: function(event) {
		var item = event.target;
		var club_detail = cc.find('Canvas/club_detail');

		club_detail.club_id = item.club_id;
		club_detail.is_admin = item.is_admin;
		club_detail.parent_page = this;

		club_detail.active = true;
    },

	onBtnClose : function() {
		this.node.active = false;
    },

	onBtnAdd : function() {
		var club_apply = cc.find('Canvas/club_apply');

		club_apply.active = true;
    },

	refresh: function() {
		var self = this;

		cc.vv.pclient.request_apis('list_clubs', {}, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.showClubs(ret.data);
		});
    },

	getClubItem: function(index) {
		var content = cc.find('items/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        var node = cc.instantiate(this._temp);

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
		var content = cc.find('items/view/content', this.node);

		for (var i = 0; i < clubs.length; i++) {
			var club = clubs[i];
			var item = this.getClubItem(i);
			var name = item.getChildByName('name').getComponent(cc.Label);
            var id = item.getChildByName('id').getComponent(cc.Label);
			var head = cc.find('icon/head', item);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var headcount = item.getChildByName('headcount').getComponent(cc.Label);

			name.string = club.name;
            id.string = 'ID:' + club.id;
			desc.string = club.desc;
			headcount.string = club.member_num + ' / ' + club.max_member_num;

			cc.vv.utils.loadImage(club.logo, head);

			item.club_id = club.id;
			item.is_admin = club.is_admin;
		}

		this.shrinkContent(content, clubs.length);
    },
});

