
cc.Class({
    extends: cc.Component,

    properties: {
        _club: null
    },

    onLoad: function () {
        let node = this.node;
    
        let btnShareWc = node.getChildByName('btn_share_wc');
        let btnShareTl = node.getChildByName('btn_share_tl');
        let btnCancel = node.getChildByName('btn_cancel');
        let addClickEvent = cc.vv.utils.addClickEvent;

        addClickEvent(btnShareWc, node, 'Share', 'onShareWc');
        addClickEvent(btnShareTl, node, 'Share', 'onShareTl');
        addClickEvent(btnCancel, node, 'Share', 'onClose');
    },

    onEnable: function() {
        let self = this;
        let pc = cc.vv.pclient;
        let data = {
            club_id: this.node.club_id
        };
        
        this._club = null;

        pc.request_apis('get_club_detail', data, ret=>{
			if (!ret || ret.errcode != 0)
				return;

			self._club = ret.data;
		});
    },

    onShare: function(timeline) {
        let title = '<雀达麻友圈>';
        let club = this._club;
        
        if (!club)
            return;

        let content = club.name + '俱乐部(ID:' + club.id + ')邀请您加入' + '\n' + club.desc;

        cc.vv.anysdkMgr.share(title, content, timeline);
    },

    onShareWc: function() {
        this.onShare(false);
    },

    onShareTl: function() {
        this.onShare(true);
    },

    onClose: function() {
        this.node.active = false;
    },
});

