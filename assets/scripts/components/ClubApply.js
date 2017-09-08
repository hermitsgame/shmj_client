
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];
		var btn_apply = item.getChildByName('btn_apply');

		cc.vv.utils.addClickEvent(btn_apply, this.node, 'ClubApply', 'onBtnApplyClicked');

		this._temp = item;
		content.removeChild(item, false);

		var top = this.node.getChildByName('top');
		var btn_back = top.getChildByName('btn_back');

		cc.vv.utils.addClickEvent(btn_back, this.node, 'ClubApply', 'onBtnClose');
    },

	onEnable : function() {
		this.refresh();
    },

	onBtnApplyClicked: function(event) {
		var item = event.target.parent;

		var data = {
			club_id : item.club_id
		};

		cc.vv.pclient.request_apis('apply_join_club', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(ret.errmsg);
				return;
			}

			cc.vv.alert.show('已成功申请，请等待管理员审核');
		});
    },

	onBtnClose : function() {
		this.node.active = false;
    },

	refresh: function() {
		var self = this;

		cc.vv.pclient.request_apis('list_other_clubs', {}, function(ret) {
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
			var head = cc.find('icon/head', item);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var headcount = item.getChildByName('headcount').getComponent(cc.Label);

			name.string = club.name;
			desc.string = club.desc;
			headcount.string = club.member_num + ' / ' + club.max_member_num;

			cc.vv.utils.loadImage(club.logo, head);

			item.club_id = club.id;
		}

		this.shrinkContent(content, clubs.length);
    },
});

