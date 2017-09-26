
cc.Class({
    extends: cc.Component,
    properties: {
        _isShow: false,
    },

    onLoad: function () {
        if(cc.vv == null)
            return null;

        cc.vv.wc = this;
        this.node.active = this._isShow;
    },

    show: function(noticeID) {
        this._isShow = true;

        if (this.node) {
            this.node.active = true;
        } else {
			console.log('wc node null');
			return;
        }

        var notice = this.node.getChildByName('notice');
        var progress = this.node.getChildByName('progress');
        var spriteMgr = notice.getComponent('SpriteMgr');

        var showNotice = (typeof(noticeID) != 'string' && noticeID >= 0);

        notice.active = showNotice;

        if (showNotice)
            spriteMgr.setIndex(noticeID);
    },

    hide:function() {
        this._isShow = false;

        if (this.node)
            this.node.active = false;
    }
});

