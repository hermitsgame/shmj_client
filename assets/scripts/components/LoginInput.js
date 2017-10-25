cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        var body = this.node.getChildByName('body');
        
        var btn_close = body.getChildByName('btn_close');
        var btn_submit = body.getChildByName('btn_submit');
        
        
        cc.vv.utils.addClickEvent(btn_close, this.node, "LoginInput", "onBtnClose");
        cc.vv.utils.addClickEvent(btn_submit, this.node, "LoginInput", "onBtnSubmit");
    },

    close : function() {
        cc.vv.audioMgr.playButtonClicked();
	    cc.vv.utils.showDialog(this.node, 'body', false);
    },
    
    onBtnClose: function() {
        this.close();
    },
    
    onBtnSubmit: function() {
        var body = this.node.getChildByName('body');
        var edtName = cc.find('name/edit', body).getComponent(cc.EditBox);
        var edtPasswd = cc.find('passwd/edit', body).getComponent(cc.EditBox);
        
        var users = [ 'test1', 'test2', 'test3', 'test4' ];
        var name = edtName.string;
        var passwd = edtPasswd.string;
        
        console.log('name=' + name);
        console.log('passwd=' + passwd);
        
        if (name == '' || passwd == '') {
            cc.vv.alert.show('账号密码不能为空');
            return;
        }
        
        var id = users.indexOf(name);
        if (id < 0) {
            cc.vv.alert.show('账号不存在，请重新输入', ()=>{
                edtName.string = '';
                edtPasswd.string = '';
            });
            return;
        }
        
        if (passwd != '123456') {
            cc.vv.alert.show('密码错误', ()=>{
                edtPasswd.string = '';
            });
            
            return;
        }
        
        cc.args = { account: name };
        
        this.close();
        cc.vv.userMgr.guestAuth();
    },
    
    onEnable: function() {
        this.reset();
    },
    
    reset: function() {
        var body = this.node.getChildByName('body');
        var name = cc.find('name/edit', body).getComponent(cc.EditBox);
        var passwd = cc.find('passwd/edit', body).getComponent(cc.EditBox);
        
        name.string = '';
        passwd.string = '';
    },
});



