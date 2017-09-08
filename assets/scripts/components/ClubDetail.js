
cc.Class({
    extends: cc.Component,

    properties: {
		
    },

    onLoad: function () {
		var top = this.node.getChildByName('top');
		var btn_back = top.getChildByName('btn_back');
		var btn_edit = top.getChildByName('btn_edit');

		cc.vv.utils.addClickEvent(btn_back, this.node, 'ClubDetail', 'onBtnClose');
		cc.vv.utils.addClickEvent(btn_edit, this.node, 'ClubDetail', 'onBtnEdit');

		var btn_mail = cc.find('club/btn_mail', this.node);

		cc.vv.utils.addClickEvent(btn_mail, this.node, 'ClubDetail', 'onBtnMessage');

		var content = cc.find('items/view/content', this.node);
		var btn_next = content.children[1].getChildByName('btn_next');
		var btn_share = content.children[3].getChildByName('btn_share');

		cc.vv.utils.addClickEvent(btn_next, this.node, 'ClubDetail', 'onBtnMembers');
		cc.vv.utils.addClickEvent(btn_share, this.node, 'ClubDetail', 'onBtnShare');

		var btn_exit = cc.find('bottom/btn_exit', this.node);

		cc.vv.utils.addClickEvent(btn_exit, this.node, 'ClubDetail', 'onBtnExit');
    },

	onEnable: function() {
		this.setButton();
		this.refresh();
    },

	onBtnClose: function() {
		this.node.active = false;
    },

	onBtnEdit: function() {
        var set_club = cc.find('Canvas/set_club');

        set_club.clubInfo = this.node.clubInfo;
        set_club.parent_page = this;
        set_club.active = true;
    },

	onBtnMessage: function() {
		var message = cc.find('Canvas/club_message');

		message.club_id = this.node.club_id;
		message.active = true;
    },

	onBtnMembers: function() {
		var rank = cc.find('Canvas/rank');
		var set  = cc.find('Canvas/set_member');
		var is_admin = this.node.is_admin;

		var member = is_admin ? set : rank;

		member.club_id = this.node.club_id;
		member.active = true;
    },

	afterExit: function() {
		var club_list = cc.find('Canvas/club_list').getComponent('ClubList');

		club_list.refresh();
    },

	onBtnExit: function() {
		var club_id = this.node.club_id;
		var self = this;

		var data = {
			club_id : club_id
		};

		cc.vv.pclient.request_apis('leave_or_delete_club', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(ret.errmsg);
			}

			self.node.active = false;
			self.afterExit();
		});
		
    },

	setButton: function() {
		var top = this.node.getChildByName('top');
		var btn_edit = top.getChildByName('btn_edit');
		var btn_mail = cc.find('club/btn_mail', this.node);
		var is_admin = this.node.is_admin;

		btn_edit.active = is_admin;
		btn_mail.active = is_admin;
    },

	show: function(data) {
		var club = this.node.getChildByName('club');
		var name = club.getChildByName('name').getComponent(cc.Label);
		var headcount = club.getChildByName('headcount').getComponent(cc.Label);
		var head = cc.find('icon/head', club);

		name.string = data.name;
		headcount.string = data.member_num + ' / ' + data.max_member_num;
		cc.vv.utils.loadImage(data.logo, head);

		var content = cc.find('items/view/content', this.node);
		var creator = content.children[0];
		var desc = content.children[2].getChildByName('desc').getComponent(cc.Label);
		var id = content.children[3].getChildByName('id').getComponent(cc.Label);

		desc.string = data.desc;
		id.string = data.id;

		var chead = cc.find('icon/head', creator).getComponent('ImageLoader');
		var cname = creator.getChildByName('name').getComponent(cc.Label);
		var owner = data.owner;

		chead.setLogo(owner.id, owner.logo);
		cname.string = owner.name;

		var create_time = cc.find('bottom/create_time', this.node).getComponent(cc.Label);
		var create_at = new Date(data.create_time * 1000);

		create_time.string = '创建于' + create_at.toLocaleDateString();

		this.node.clubInfo = data;
    },

	refresh: function() {
		var club_id = this.node.club_id;
		var self = this;

		var data = {
			club_id : club_id
		};

		cc.vv.pclient.request_apis('get_club_detail', data, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.show(ret.data);
		});
    },
});

