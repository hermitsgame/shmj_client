
cc.Class({
    extends: cc.Component,

    properties: {
		_tempRoom : null,

		_timer : -1,
    },

    onLoad: function() {
		let content = cc.find('rooms/view/content', this.node);
		let item = content.children[0];
		let addEvent = cc.vv.utils.addClickEvent;
		let btn_edit = item.getChildByName('btn_edit');
		let btn_destroy = item.getChildByName('btn_destroy');
        let btn_play = item.getChildByName('btn_play');
		let seats = item.getChildByName('seats');

		for (let i = 0; i < seats.childrenCount; i++) {
			let seat = seats.children[i];
            let btn_kick = seat.getChildByName('btn_kick');

			addEvent(btn_kick, this.node, 'Admin', 'onBtnKickClicked');
		}

		addEvent(btn_edit, this.node, 'Admin', 'onBtnEditClicked');
		addEvent(btn_destroy, this.node, 'Admin', 'onBtnDestroyClicked');
        addEvent(btn_play, this.node, 'Admin', 'onBtnPlayClicked');

		this._tempRoom = item;
		content.removeChild(item, false);

        let top = this.node.getChildByName('top');
		let btnClose = top.getChildByName('btn_back');
        let btnEdit = top.getChildByName('btn_edit');

        addEvent(btnClose, this.node, 'Admin', 'onBtnClose');
        addEvent(btnEdit, this.node, 'Admin', 'onBtnEdit');

        let btn_create = cc.find('bottom/btn_create', this.node);

        addEvent(btn_create, this.node, 'Admin', 'onBtnCreate');

		this.initEventHandler();
		
		this.updateMessageCnt();
    },

    initEventHandler: function() {
        let node = cc.find('Canvas');
        let lobby = this.node;
        let self = this;

        node.on('club_room_updated', data=>{
            let room = data.detail;

            if (!lobby.active)
                return;

            self.room_updated(room);
        });

        node.on('club_room_removed', data=>{
            let room = data.detail;

            if (!lobby.active)
                return;

            self.room_removed(room);
        });
        
        let root = cc.find('Canvas');
        
        root.on('club_message_notify', data=>{
            let detail = data.detail;
            
            console.log('club_message_notify admin got');
            
            if (detail.club_id == self.node.club_id)
                self.updateMessageCnt();
        });
    },

    updateMessageCnt: function() {
        let msg_num = cc.find('entrys/btn_message/msg_num', this.node);
        let tile = msg_num.getChildByName('tile').getComponent(cc.Label);
        let self = this
        
        if (!this.node.active)
            return;
        
        let data = {
            club_id : this.node.club_id
        };

        cc.vv.pclient.request_apis('get_club_message_cnt', data, ret=>{
            if (ret.errcode != 0) {
                console.log('get_club_message_cnt ret=' + ret.errcode);
                return;
            }
            
            let cnt = ret.data.cnt;

            msg_num.active = cnt > 0;
            tile.string = cnt;
        });
    },

    room_updated: function(data) {
        let content = cc.find('rooms/view/content', this.node);
        let item = null;
        let room = null;
        let found = false;

        for (let i = 0; i < content.childrenCount; i++) {
            item = content.children[i];
            room = item.room;

            if (room.id != data.id)
                continue;

            found = true;
            break;
        }

        if (!found)
            item = this.getRoomItem(content.childrenCount);

        this.updateRoom(item, data);
    },

    room_removed: function(data) {
        let content = cc.find('rooms/view/content', this.node);
        let item = null;
        let room = null;
        let found = false;

        for (let i = 0; i < content.childrenCount; i++) {
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
        this.refresh();

		let self = this;
		let club_id = this.node.club_id;
		let data = {
			club_id : club_id
		};
		
		cc.vv.pclient.request_apis('join_club_channel', data, ret=>{
			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			cc.vv.club_channel = club_id;
		});
    },

	onDisable: function() {
		this._timer = -1;

		let club_id = this.node.club_id;
		let data = {
			club_id : club_id
		};

		cc.vv.pclient.request_apis('leave_club_channel', data, ret=>{
			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			cc.vv.club_channel = null;
		});
    },

	onBtnClose: function() {
        this.node.active = false;
    },

    onBtnEdit: function() {
        let set_club = cc.find('Canvas/set_club');
        let self = this;
        let pc = cc.vv.pclient;
        let data = {
            club_id : this.node.club_id
        };

        pc.request_apis('get_club_detail', data, ret=>{
            if (ret.errcode != 0)
                return;

            set_club.clubInfo = ret.data;
            set_club.active = true;
        });
    },

	onBtnHistoryClicked: function(event) {
		var history = cc.find('Canvas/club_history');

		cc.vv.historyParam = {
			club_id : this.node.club_id
		};

		history.active = true;
    },

	onBtnMemberClicked: function(event) {
		var member = cc.find('Canvas/set_member');

		console.log('onBtnMemberClicked');

		member.club_id = this.node.club_id;
		member.active = true;
    },

	onBtnMessangeClicked: function(event) {
		var message = cc.find('Canvas/club_message');

		message.club_id = this.node.club_id;
		message.parent_page = this;
		message.active = true;
    },

    onBtnCreate: function() {
        cc.vv.audioMgr.playButtonClicked();

        var create_room = cc.find('Canvas/create_room');

        create_room.club_id = this.node.club_id;
        create_room.active = true;
    },

    onBtnKickClicked: function(event) {
        console.log('onBtnKickClicked');

		var self = this;
		var seat = event.target.parent;

		var data = {
			uid : seat.player.id,
			room_tag : seat.room.room_tag,
			roomid : seat.room.id
		};

		cc.vv.pclient.request_connector('kick', data, function(ret) {
			if (!ret || ret.errcode != 0) {
				console.log('kick fail');
    			return;
    		}

			self.refresh();
		});
    },

    onBtnEditClicked: function(event) {
        console.log('onBtnEditClicked');

        let edit = cc.find('Canvas/edit_room');
        let room = event.target.parent.room;

        edit.club_id = this.node.club_id;
        edit.room = room;
        edit.parent_page = this;
        edit.active = true;
    },

    doDestroy: function(item) {
		let self = this;
		let room = item.room;
		let data = {
			roomid : room.id,
			room_tag : room.room_tag,
			club_id : this.node.club_id
		};

		cc.vv.pclient.request_apis('destroy_club_room', data, ret=>{
			if (!ret || ret.errcode != 0) {
				console.log('destroy fail');
    			return;
    		}

			self.refresh();
		});
    },

    onBtnDestroyClicked: function(event) {
        let self = this;
        let item = event.target.parent;

        console.log('onBtnDestroyClicked');

        cc.vv.alert.show('确定解散房间吗?', ()=>{
            self.doDestroy(item);
        }, true);
    },

    onBtnPlayClicked: function(event) {
        console.log('onBtnPlayClicked');

		var item = event.target.parent;
		var room = item.room;
        var pc = cc.vv.pclient;
		var self = this;

        if (room.status == 'idle') {
			if (room.readys != 4) {
				cc.vv.alert.show('玩家没有全部准备');
				return;
        	}

            var data = {
    			room_tag : room.room_tag
    		};

			console.log('start room');

    		pc.request_connector('start_room', data, function(ret) {
    			if (!ret || ret.errcode != 0) {
					console.log('start room fail');
    				return;
    			}

    			self.refresh();
    	    });
        } else {
        	var data = {
				room_tag : room.room_tag
        	};

			console.log('stop room');

			pc.request_connector('stop_room', data, function(ret) {
				if (!ret || ret.errcode != 0) {
					console.log('stop room fail');
    				return;
				}

				console.log('stop ok');

				self.refresh();
			});
        }
    },
    
	onDisable: function() {
		this._timer = -1;
    },

	refresh: function() {
		var self = this;
		var club_id = this.node.club_id;

		cc.vv.pclient.request_apis('list_club_rooms', { club_id : club_id }, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

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

	updateRoom: function(room, data) {
		var players = data.players;
		var desc = room.getChildByName('desc').getComponent(cc.Label);
        var btn_edit = room.getChildByName('btn_edit');
    	var btn_destroy = room.getChildByName('btn_destroy');
        var btn_play = room.getChildByName('btn_play');
		var status = room.getChildByName('status').getComponent(cc.Label);
		var seats = room.getChildByName('seats');
		var progress = room.getChildByName('progress').getComponent(cc.Label);
		var roomid = room.getChildByName('roomid').getComponent(cc.Label);

		var readys = 0;
		var nplayer = 0;
		var idle = data.status == 'idle';

		for (var j = 0; j < players.length; j++) {
			var seat = seats.children[j];
			var p = players[j];
			var name = seat.getChildByName('name');
            var id = seat.getChildByName('id');
			var head = seat.getChildByName('head');
            var btnKick = seat.getChildByName('btn_kick');
			var ready = seat.getChildByName('ready');
			var empty = p.id == 0;

			name.active = !empty;
            id.active = !empty;
			ready.active = !empty && p.ready;
			head.active = !empty;
            btnKick.active = !empty && idle;

			if (empty)
				continue;

			if (p.ready)
    	        readys += 1;

			nplayer += 1;

            seat.player = p;
			seat.room = data;

			name.getComponent(cc.Label).string = p.name;
			id.getComponent(cc.Label).string = p.id;
			head.getComponent('ImageLoader').setUserID(p.id);
		}

        let info = data.base_info;

        desc.string = info.huafen + '/' + info.huafen + ' ' + (info.maima ? '带苍蝇' : '') + (info.qidui ? '七对' : '') + info.maxGames + '局';
		progress.string = data.num_of_turns + ' / ' + info.maxGames;
		roomid.string = 'ID:' + data.id;

        data.readys = readys;
		room.room = data;

		btn_play.getComponent('SpriteMgr').setIndex(idle ? 0 : 1);
		status.string = idle ? '开始' : '游戏中';
		btn_edit.active = idle && nplayer == 0;
		btn_destroy.active = idle && nplayer == 0;
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

