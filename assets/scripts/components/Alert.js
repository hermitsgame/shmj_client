
cc.Class({
    extends: cc.Component,

    properties: {
        _alert:null,
        _btnOK:null,
        _btnCancel:null,
        _content:null,
        _onok:null,
    },

    onLoad: function() {
        if (cc.vv == null) {
            return;
        }

		var alert = cc.find("Canvas/alert");
        this._alert = alert;

        this._content = cc.find("body/content", alert).getComponent(cc.Label);
        this._btnOK = cc.find("body/btns/btn_ok", alert);
        this._btnCancel = cc.find("body/btns/btn_cancel", alert);

        cc.vv.utils.addClickEvent(this._btnOK, this.node, "Alert", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._btnCancel, this.node, "Alert", "onBtnClicked");

        this._alert.active = false;
        cc.vv.alert = this;
    },

    onBtnClicked: function(event) {
        cc.vv.audioMgr.playSFX('Sound/Alert_Close.mp3');

        if (event.target.name == "btn_ok") {
            if (this._onok)
                this._onok();
        }

        this._onok = null;
		cc.vv.utils.showDialog(this._alert, 'body', false);
    },

    show: function(content, onok, needcancel) {
        cc.vv.audioMgr.playSFX('Sound/Alert_Open.mp3');

        this._alert.active = true;
        this._onok = onok;
        this._content.string = content;

		this._btnCancel.active = !!needcancel;

		cc.vv.utils.showDialog(this._alert, 'body', true);
    },

    onDestory:function() {
        if (cc.vv)
            cc.vv.alert = null;
    }
});

