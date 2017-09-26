
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        var btn_ok = this.node.getChildByName('btn_ok');
        var btn_close = this.node.getChildByName('btn_close');

        cc.vv.utils.addClickEvent(btn_ok, this.node, 'Transfer', 'onBtnOK');
        cc.vv.utils.addClickEvent(btn_close, this.node, 'Transfer', 'onBtnClose');
    },

    onEnable: function() {
		this.reset();
    },

    close: function() {
		cc.vv.utils.showDialog(this.node, 'body', false);
    },

    onBtnClose: function() {
        cc.vv.audioMgr.playButtonClicked();
        this.close();
    },

    onBtnOK: function() {
        var currency = this.node.getChildByName('currency');
        var score = currency.getChildByName('score').getComponent('RadioButton');
        var gem = currency.getChildByName('gem').getComponent('RadioButton');
        var num = this.node.getChildByName('edt_num').getComponent(cc.EditBox);

        if (num.string == '')
            return;

        var cnt = parseInt(num.string);

        if (cnt < 0) {
            this.reset();
            return;
        }

        if (score.checked) {
            this.transferScore(cnt);
        } else if (gem.checked) {
            this.transferGem(cnt);
        }
    },

    transferScore : function(cnt) {
        var self = this;

        var data = {
            user_id : this.node.user_id,
            club_id : this.node.club_id,
            score : cnt
        };

        cc.vv.pclient.request_apis('transfer_score', data, ret=>{
            if (ret.errcode == 0) {
                cc.vv.alert.show('打赏成功', ()=>{
                    self.node.parent_page.refresh();
                    self.close();
                });
            } else
                cc.vv.alert.show('打赏失败，' + ret.errmsg);
        });
    },

    transferGem : function(cnt) {
        var self = this;

        var data = {
            uid : this.node.user_id,
            gem : cnt
        };

        cc.vv.pclient.request_apis('transfer_gem', data, ret=>{
            if (ret.errcode == 0) {
                cc.vv.alert.show('打赏成功', ()=>{
                    self.close();
                });
            } else
                cc.vv.alert.show('打赏失败，' + ret.errmsg);
        });
    },

    reset : function() {
        var num = this.node.getChildByName('edt_num').getComponent(cc.EditBox);

        num.string = '';
    }
});


