
cc.Class({
    extends: cc.Component,

    properties: {
        _gamenum: null,
        _maxfan: null,
        _flowers: 0,
        _maima: null,
        _allpairs: null,
		slider: cc.Slider,
    },

    onLoad: function() {
        this._gamenum = [];

		let content = cc.find('body/items/view/content', this.node);

		let gn = content.getChildByName('game_num');
        for (let i = 0; i < gn.childrenCount; i++) {
            let n = gn.children[i].getComponent("RadioButton");
            if (n != null)
                this._gamenum.push(n);
        }

        this._maxfan = [];
		let mf = content.getChildByName('maxfan');
        for (let i = 0; i < mf.childrenCount; i++) {
            let n = mf.children[i].getComponent("RadioButton");
            if (n != null)
                this._maxfan.push(n);
        }

		this._maima = cc.find('wanfa/horse', content);
		this._allpairs = cc.find('wanfa/allpairs', content);

		let score = this.slider;
		score.node.on('slide', this.onScoreChanged, this);

        let addEvent = cc.vv.utils.addClickEvent;
		let btnClose = cc.find('top/btn_back', this.node);
		addEvent(btnClose, this.node, 'EditRoom', 'onBtnClose');

        let btnSubmit = cc.find('bottom/btn_submit', this.node);
        addEvent(btnSubmit, this.node, 'EditRoom', 'onBtnSubmit');
	},

    onEnable: function() {
        this.refresh();
    },

    refresh: function() {
        let self = this;
        let room = this.node.room;
        let info = room.base_info;
        let club_id = this.node.club_id;

		let gamenums = [ 4, 8, 16 ];
        for (let i = 0; i < self._gamenum.length; i++)
            self._gamenum[i].check(gamenums[i] == info.maxGames);

        let maxfans = [ 2, 3, 4, 100 ];
        for (let i = 0; i < self._maxfan.length; i++)
            self._maxfan[i].check(maxfans[i] == info.maxFan);

		let maima = this._maima.getComponent('CheckBox');
        maima.setChecked(info.maima);

		let allpairs = this._allpairs.getComponent('CheckBox');
        allpairs.setChecked(info.qidui);

        let content = cc.find('body/items/view/content', this.node);
        let score = cc.find('base/score', content);
        let slide = score.getComponent(cc.Slider);
		let fill = score.getChildByName('body').getComponent(cc.Sprite);
        let flower = cc.find('base/flower', content).getComponent(cc.Label);
        let range = [1, 5, 10, 20, 30, 50, 100, 200, 300];
        let id = range.indexOf(info.huafen);

        flower.string = range[id];
        this._flowers = range[id];
        slide.progress = id / (range.length - 1);
		fill.fillRange = slide.progress;
    },

	onScoreChanged: function(event) {
		let slide = event.detail;
		let content = cc.find('body/items/view/content', this.node);
		let fill = cc.find('base/score/body', content).getComponent(cc.Sprite);
		let flower = cc.find('base/flower', content).getComponent(cc.Label);
		let range = [1, 5, 10, 20, 30, 50, 100, 200, 300];
		let id = Math.round(slide.progress * (range.length - 1));

		flower.string = range[id];
		this._flowers = range[id];

		fill.fillRange = slide.progress;
	},

    close: function() {
        this.node.active = false;
    },

    onBtnClose: function() {
        cc.vv.audioMgr.playButtonClicked();

        this.close();
    },

    onBtnSubmit: function() {
        cc.vv.audioMgr.playButtonClicked();

		this.node.active = false;
        this.editRoom();
    },

    editRoom: function() {
        let self = this;

        let gamenum = 0;
		let gamenums = [ 4, 8, 16 ];
        for (let i = 0; i < self._gamenum.length; ++i) {
            if (self._gamenum[i].checked) {
                gamenum = gamenums[i];
                break;
            }
        }

        let maxfan = 0;
        let maxfans = [ 2, 3, 4, 100 ];
        for (var i = 0; i < self._maxfan.length; ++i) {
            if (self._maxfan[i].checked) {
                maxfan = maxfans[i];
                break;
            }
        }

		let flowers = this._flowers;
		let maima = this._maima.getComponent('CheckBox').checked;
		let allpairs = this._allpairs.getComponent('CheckBox').checked;

        let conf = {
            type: 'shmj',
            gamenum: gamenum,
            maxfan: maxfan,
            huafen: flowers,
            playernum: 4,
            maima: maima,
            qidui: allpairs
        };

        let club_id = this.node.club_id;
        let room = this.node.room;
		let pc = cc.vv.pclient;

        let data = {
            roomid : room.room_tag,
            club_id : this.node.club_id,
            conf : conf
        };

        let node = self.node;

        pc.request_connector('edit_room', data, ret=>{
            if (ret.errcode !== 0) {
                console.log('edit room failed: ' + ret.errmsg);
                return;
            }

            self.close();
            node.parent_page.refresh();
        });
    }
});

