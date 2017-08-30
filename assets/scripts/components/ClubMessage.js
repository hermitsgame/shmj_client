
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];

		cc.vv.utils.addClickEvent(item, this.node, 'ClubMessage', 'onBtnApproveClicked');

		this._temp = item;
		content.removeChild(item, false);
    },

	onEnable: function() {
		this.refresh();
    },

	onBtnBackClicked: function() {
		this.node.active = false;
	},

	onBtnApproveClicked: function(event) {
		var self = this;
		var item = event.target.parent;

		var data = {
			id : item.msg_id,
			sign : 'approved',
			score : 20,
			limit : -5000
		};

		cc.vv.pclient.request_apis('sign_club_message', data, ret=>{
			if (!ret || ret.errcode != 0)
				return;

			self.refresh();
		});
    },

	refresh: function() {
		var self = this;

		var data = {
			club_id : cc.vv.userMgr.club_id
		};

		cc.vv.pclient.request_apis('list_club_message', data, function(ret) {
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
			var msg = data[i];
			var item = this.getItem(i);
			var name = item.getChildByName('name').getComponent(cc.Label);
			var id = item.getChildByName('id').getComponent(cc.Label);
			var time = item.getChildByName('time').getComponent(cc.Label);
			var message = item.getChildByName('message').getComponent(cc.Label);
			var btn_approve = item.getChildByName('btn_approve');
			var approved = item.getChildByName('approved');

			name.string = new Buffer(msg.name, 'base64').toString();
			id.string = msg.user_id;
			time.string = cc.vv.utils.dateFormat(msg.uptime * 1000);

			var type = msg.type;
			var sign = msg.sign;
			var status = '';

			var msgs = {
				join : '加入了俱乐部',
				leave : '离开了俱乐部',
				apply : '申请加入俱乐部'
			};

			message.string = msgs[type];

			btn_approve.active = (type == 'apply') && (sign == 'wait');
			approved.active = (type == 'apply') && (sign != 'wait');
			if (sign == 'approved')
				status = '已通过';
			else if (sign == 'rejected')
				status = '已拒绝';

			approved.getComponent(cc.Label).string = status;

			item.msg_id = msg.id;
		}

		this.shrinkContent(content, data.length);
    },
});

