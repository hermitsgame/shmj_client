
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];
        var btn_transfer = item.getChildByName('btn_transfer');

        cc.vv.utils.addClickEvent(btn_transfer, this.node, 'Rank', 'onBtnTransfer');

		this._temp = item;
		content.removeChild(item, false);

		var btnClose = cc.find('top/btn_back', this.node);
		cc.vv.utils.addClickEvent(btnClose, this.node, 'Rank', 'onBtnClose');
    },

	onEnable: function() {
		this.refresh();
    },

	onBtnClose: function() {
		this.node.active = false;
	},

    onBtnTransfer: function(event) {
        var member = event.target.parent.member;
        var transfer = cc.find('Canvas/transfer');

        transfer.parent_page = this;

        transfer.club_id = this.node.club_id;
        transfer.user_id = member.id;
        transfer.active = true;
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
			var head = cc.find('icon/head', item).getComponent('ImageLoader');
            var transfer = item.getChildByName('btn_transfer');

			name.string = member.name;
			id.string = member.id;
			score.string = member.score;
			head.setLogo(member.id, member.logo);
            transfer.active = member.id != cc.vv.userMgr.userId;

			item.member = member;
		}

		this.shrinkContent(content, data.length);
    },
});

