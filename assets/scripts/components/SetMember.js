
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];
		var btn_edit = item.getChildByName('btn_edit');
		var btn_history = item.getChildByName('btn_history');

		cc.vv.utils.addClickEvent(btn_edit, this.node, 'SetMember', 'onBtnEditClicked');
		cc.vv.utils.addClickEvent(btn_history, this.node, 'SetMember', 'onBtnHistoryClicked');

		this._temp = item;
		content.removeChild(item, false);

		var edit = this.node.getChildByName('edit');
		var btn_cscore = edit.getChildByName('btn_cscore');
		var btn_climit = edit.getChildByName('btn_climit');
		var btn_close = edit.getChildByName('btn_close');
		var btn_ok = edit.getChildByName('btn_ok');

		cc.vv.utils.addClickEvent(btn_cscore, this.node, 'SetMember', 'onBtnEditWinClicked');
		cc.vv.utils.addClickEvent(btn_climit, this.node, 'SetMember', 'onBtnEditWinClicked');
		cc.vv.utils.addClickEvent(btn_close, this.node, 'SetMember', 'onBtnEditWinClicked');
		cc.vv.utils.addClickEvent(btn_ok, this.node, 'SetMember', 'onBtnEditWinClicked');

		var btnClose = cc.find('top/btn_back', this.node);
		cc.vv.utils.addClickEvent(btnClose, this.node, 'SetMember', 'onBtnClose');
    },

	onEnable: function() {
		this.refresh();
    },

	onBtnClose: function() {
		this.node.active = false;
	},

	onBtnEditClicked: function(event) {
		var member = event.target.parent.member;
		var edit = this.node.getChildByName('edit');

		var edt_score = edit.getChildByName('edt_score').getComponent(cc.EditBox);
		var edt_limit = edit.getChildByName('edt_limit').getComponent(cc.EditBox);

		edit.member = member;
		edt_score.string = member.score;
		edt_limit.string = member.limit;

		edit.active = true;
    },

	onBtnEditWinClicked: function(event) {
		var name = event.target.name;
		var edit = this.node.getChildByName('edit');
		var edt_score = edit.getChildByName('edt_score').getComponent(cc.EditBox);
		var edt_limit = edit.getChildByName('edt_limit').getComponent(cc.EditBox);

		if (name == 'btn_cscore') {
			edt_score.string = '0';
		} else if (name == 'btn_climit') {
			edt_limit.string = '0';
		} else if (name == 'btn_close') {
			edit.active = false;
		} else if (name == 'btn_ok') {
			var member = edit.member;

			var data = {
				user_id : member.id,
				club_id : this.node.club_id,
				score : parseInt(edt_score.string) || 0,
				limit : parseInt(edt_limit.string) || 0
			};

			var self = this;

			cc.vv.pclient.request_apis('setup_club_member', data, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

				edit.active = false;
				self.refresh();
			});
		}
    },

	onBtnHistoryClicked: function(event) {
		var member = event.target.parent.member;
		var history = cc.find('Canvas/club_history');

		var data = {
			user_id : member.id,
			club_id : this.node.club_id
		};

		cc.vv.historyParam = data;
		history.active = true;
    },

	refresh: function() {
		var self = this;

		var data = {
			club_id : this.node.club_id
		};

		cc.vv.pclient.request_apis('list_club_members', data, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.showItems(ret.data);
		});
    },

	getItem: function(index) {
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

	showItems: function(data) {
		var content = cc.find('items/view/content', this.node);

		for (var i = 0; i < data.length; i++) {
			var member = data[i];
			var item = this.getItem(i);
			var name = item.getChildByName('name').getComponent(cc.Label);
			var id = item.getChildByName('id').getComponent(cc.Label);
			var score = item.getChildByName('score').getComponent(cc.Label);
			var limit = item.getChildByName('limit').getComponent(cc.Label);
			var head = cc.find('icon/head', item).getComponent('ImageLoader');

			name.string = member.name;
			id.string = member.id;
			score.string = member.score;
			limit.string = member.limit;
			head.setLogo(member.id, member.logo);

			item.member = member;
		}

		this.shrinkContent(content, data.length);
    },
});

