
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
    },

	start: function() {
		this.refresh();
    },

	onBtnClubClicked: function(event) {
		var item = event.target;
		var userMgr = cc.vv.userMgr;
		var is_admin = item.is_admin;

		userMgr.club_id = item.club_id;
		userMgr.is_admin = is_admin;

		var lobby = is_admin ? 'admin' : 'lobby';
		var next = cc.find('Canvas/' + lobby);

		next.active = true;
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
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var headcount = item.getChildByName('headcount').getComponent(cc.Label);

			name.string = club.name;
			desc.string = club.desc;
			headcount.string = club.member_num + ' / ' + club.max_member_num;

			item.club_id = club.id;
			item.is_admin = club.is_admin;
		}

		this.shrinkContent(content, clubs.length);
    },
});

