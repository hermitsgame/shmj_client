
cc.Class({
    extends: cc.Component,

    properties: {
		_tempRoom : null,

		_timer : -1,
		_roomid : null,
    },

    onLoad: function() {
		let content = cc.find('rooms/view/content', this.node);
		let item = content.children[0];
		let addEvent = cc.vv.utils.addClickEvent;
		let btn_prepare = item.getChildByName('btn_prepare');
		let btn_leave = item.getChildByName('btn_leave');
		let seats = item.getChildByName('table');

		for (let i = 0; i < seats.childrenCount; i++) {
			let seat = seats.children[i];

			addEvent(seat, this.node, 'Lobby', 'onBtnSeatClicked');
		}

		addEvent(btn_prepare, this.node, 'Lobby', 'onBtnPrepareClicked');
		addEvent(btn_leave, this.node, 'Lobby', 'onBtnLeaveClicked');

		this._tempRoom = item;
		content.removeChild(item, false);

		let btnClose = cc.find('top/btn_back', this.node);
		addEvent(btnClose, this.node, 'Lobby', 'onBtnClose');

		let btnRank = cc.find('entrys/btn_rank', this.node);
		addEvent(btnRank, this.node, 'Lobby', 'onBtnRankClicked');

        let btnHistory = cc.find('entrys/btn_history', this.node);
        addEvent(btnHistory, this.node, 'Lobby', 'onBtnHistoryClicked');

		let btnCard = cc.find('entrys/btn_card', this.node);
		addEvent(btnCard, this.node, 'Lobby', 'onBtnCardClicked');

		let btnInvite = cc.find('entrys/btn_invite', this.node);
		addEvent(btnInvite, this.node, 'Lobby', 'onBtnInviteClicked');

		this.initEventHandler();
    },

	initEventHandler: function() {
		var node = cc.find('Canvas');
		var lobby = this.node;
		var self = this;

		node.on('club_room_updated', function(data) {
			var room = data.detail;

			if (!lobby.active)
				return;

			self.room_updated(room);
		});

		node.on('club_room_removed', function(data) {
			var room = data.detail;

			if (!lobby.active)
				return;

			self.room_removed(room);
		});
    },

	room_updated: function(data) {
		var content = cc.find('rooms/view/content', this.node);
		var item = null;
		var room = null;
		var found = false;

		for (var i = 0; i < content.childrenCount; i++) {
			item = content.children[i];
			room = item.room;

			if (room.id != data.id)
				continue;

			found = true;
			break;
		}

		if (!found)
			item = this.getRoomItem(content.childrenCount);

		if (this._roomid == data.id)
			this._roomid = null;

		this.updateRoom(item, data);
    },

	room_removed: function(data) {
		var content = cc.find('rooms/view/content', this.node);
		var item = null;
		var room = null;
		var found = false;

		if (this._roomid == data.id)
			this._roomid = null;

		for (var i = 0; i < content.childrenCount; i++) {
			item = content.children[i];
			room = item.room;

			if (room.id != data.id)
				continue;

			found = true;
			break;
		}

		if (found)
			content.removeChild(item);
    },

	onEnable: function() {
		//this._timer = 0;

		this.refresh();

		let self = this;
		let club_id = this.node.club_id;
		let data = {
			club_id : club_id
		};
		
		console.log('join club channel');
		
		cc.vv.pclient.request_apis('join_club_channel', data, ret=>{
			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			cc.vv.club_channel = club_id;
		});
    },

	exit: function() {
		this._timer = -1;

		let club_id = this.node.club_id;
		let data = {
			club_id : club_id
		};

        console.log('leave club channel');

		cc.vv.pclient.request_apis('leave_club_channel', data, ret=>{
			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			cc.vv.club_channel = null;
		});
    },

	join_room: function(room, seatindex) {
		var self = this;

		var data = {
			roomid : room.id,
			room_tag : room.room_tag,
			name : cc.vv.userMgr.userName,
			seatindex : seatindex
		};

		cc.vv.userMgr.enterRoom(room.room_tag);

/*
		cc.vv.pclient.request_apis('join_club_room', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			self.refresh();
		});
*/
    },

	leave_room: function(room) {
		var self = this;

		var data = {
			roomid : room.id,
			room_tag : room.room_tag
		};

		cc.vv.pclient.request_apis('leave_club_room', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			self.refresh();
		});
    },

	prepare: function(room) {
		var self = this;

		var data = {
			roomid : room.id,
			room_tag : room.room_tag
		};

		cc.vv.pclient.request_apis('prepare_club_room', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			self.refresh();
		});
    },

	onBtnClose: function() {
		this.node.active = false;
		this.exit();
    },

	onBtnRankClicked: function() {
		var rank = cc.find('Canvas/rank');

		rank.club_id = this.node.club_id;
		rank.active = true;
    },

    onBtnHistoryClicked: function() {
		let history = cc.find('Canvas/club_history');

		cc.vv.historyParam = {
			club_id : this.node.club_id
		};

		history.active = true;
    },

	onBtnCardClicked: function() {
        let club_id = this.node.club_id;
        let share = cc.find('Canvas/share');

        share.club_id = club_id;
        share.active = true;
    },

	onBtnInviteClicked: function() {

    },

	onBtnSeatClicked: function(event) {
		var seat = event.target;
		var room = seat.room;
		var player = seat.player;

		if (this._roomid != null)
			return;

		this.join_room(room, player.seatindex);
    },

	onBtnPrepareClicked: function(event) {
		var item = event.target.parent;
		var room = item.room;

		this.prepare(room);
    },

	onBtnLeaveClicked: function(event) {
		var item = event.target.parent;
		var room = item.room;

		this.leave_room(room);
    },

	refresh: function() {
		var self = this;
		var club_id = this.node.club_id;

		cc.vv.pclient.request_apis('list_club_rooms', { club_id : club_id }, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self._roomid = null;

			self.showRooms(ret.data);
		});
    },

	getRoomItem: function(index) {
		var content = cc.find('rooms/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        var node = cc.instantiate(this._tempRoom);

        content.addChild(node);
        return node;
    },

	shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

	updateRoom: function(item, room) {
		var uid = cc.vv.userMgr.userId;
		var players = room.players;
		var desc = item.getChildByName('desc').getComponent(cc.Label);
		var seats = item.getChildByName('table');
		var btn_prepare = item.getChildByName('btn_prepare');
		var btn_leave = item.getChildByName('btn_leave');
		var progress = item.getChildByName('progress').getComponent(cc.Label);
		var found = false;

		for (var j = 0; j < players.length; j++) {
			var seat = seats.children[j];
			var p = players[j];
			var name = seat.getChildByName('name');
			var head = cc.find('icon/head', seat);
			var ready = seat.getChildByName('ready');
			var empty = p.id == 0;

			seat.player = p;
			seat.room = room;

			name.active = !empty;
			ready.active = !empty && p.ready;
			head.active = !empty;
			seat.getComponent(cc.Button).interactable = empty;
			if (empty)
				continue;

			name.getComponent(cc.Label).string = p.name;
			head.getComponent('ImageLoader').setUserID(p.id);

			if (uid == p.id) {
				found = true;
				this._roomid = room.id;
				btn_prepare.active = !p.ready;
				btn_leave.active = true;
			}
		}

		if (!found) {
			btn_prepare.active = false;
			btn_leave.active = false;
		}
		
		var info = room.base_info;

		desc.string = info.huafen + '/' + info.huafen + (info.maima ? '带苍蝇' : '不带苍蝇') + info.maxGames + '局';

		progress.string = room.num_of_turns + ' / ' + info.maxGames;
		item.room = room;
    },

	showRooms: function(data) {
		var content = cc.find('rooms/view/content', this.node);

		for (var i = 0; i < data.length; i++) {
			var room = data[i];
			var item = this.getRoomItem(i);

			this.updateRoom(item, room);
		}

		this.shrinkContent(content, data.length);
    },

	update: function(dt) {
		if (this._timer < 0)
			return;

		this._timer += dt;

		var time = Math.floor(this._timer);

		if (time >= 3) {
			this._timer = 0;
			this.refresh();
		}
    },
});

