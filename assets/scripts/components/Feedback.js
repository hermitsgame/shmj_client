
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
		this.initButtonHandler('btn_submit', 'onBtnSubmitClicked');
		this.initButtonHandler('top/btn_back', 'onBtnCloseClicked');
    },

	reset: function() {
	    var edt_content = this.node.getChildByName('edt_content').getComponent(cc.EditBox);

		edt_content.string = '';
    },

	initButtonHandler: function(path, cb) {
        var btn = cc.find(path, this.node);
        cc.vv.utils.addClickEvent(btn, this.node, 'Feedback', cb);
    },

	onBtnSubmitClicked: function(event) {
	    var edt_content = this.node.getChildByName('edt_content').getComponent(cc.EditBox);

		var content = edt_content.string;
		var errmsg = null;

		if (content == '') {
			errmsg = '请填写反馈内容';
		}

		if (errmsg) {
			cc.vv.alert.show(errmsg);
			return;
		}

		var self = this;

		cc.vv.userMgr.feedback(content, '123', '12345678901', ret=>{
		    var msg = '感谢您的反馈，我们会尽快处理!';

			if (!ret) {
				msg = '提交失败，请检查网络';
			}

			cc.vv.alert.show(msg, ()=>{
				self.close();
			});
		});
    },

	onBtnCloseClicked: function(event) {
    	cc.vv.audioMgr.playButtonClicked();
		this.close();
    },

	close: function() {
		cc.vv.utils.showDialog(this.node, 'body', false);
		this.reset();
    },
});

