
cc.Class({
    extends: cc.Component,

    properties: {
        _chatRoot:null,
        
        _quickChatInfo:null,
        _btnChat:null,
    },

    onLoad: function() {
        if (cc.vv == null)
            return;

        cc.vv.chat = this;

        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = !cc.vv.replayMgr.isReplay();
        cc.vv.utils.addClickEvent(this._btnChat, this.node, 'Chat', 'onBtnChatClicked');

        var root = this.node.getChildByName("chat");

        root.active = false;
        this._chatRoot = root;

        var bg = root.getChildByName("bg");

        cc.vv.utils.addClickEvent(bg, this.node, 'Chat', 'onBgClicked');

        var content = cc.find("quick/view/content", root);
        var temp = content.getChildByName("item");

        cc.vv.utils.addClickEvent(temp, this.node, 'Chat', 'onQuickChatItemClicked');

        content.removeChild(temp, false);

        var qc = [
            { content: '打快一点呀！', sound: '1.mp3' },
            { content: '快点撒，我等到花儿都谢了！', sound: '2.mp3' },
            { content: '牌太好了，打哪张呢？', sound: '3.mp3' },
            { content: '不要乱催', sound: '4.mp3' },
            { content: '别吵啦！', sound: '5.mp3' },
            { content: '三缺一，我来的正好', sound: '6.mp3' },
            { content: '被你这个老麻将盯上', sound: '7.mp3' },
            { content: '见鬼了，这烂牌', sound: '8.mp3' },
            { content: '喔天，打错牌了', sound: '9.mp3' },
            { content: '风头不好，明天再约', sound: '10.mp3' },
            { content: '输完回家睡觉', sound: '11.mp3' },
        ];

        for (var i = 0; i < qc.length; i++) {
            var info = qc[i];
            var item = cc.instantiate(temp);

            item.idx = i;

            var lblInfo = item.getChildByName("msg").getComponent(cc.Label);
            lblInfo.string = info.content;

            content.addChild(item);
        }

        this._quickChatInfo = qc;

        var emoji = cc.find('emoji/view/content', root);

        for (var i = 0; i < emoji.childrenCount; i++) {
            var item = emoji.children[i];

            item.idx = i;

            cc.vv.utils.addClickEvent(item, this.node, 'Chat', 'onEmojiItemClicked');
        }

        var btnSend = root.getChildByName('btn_send');

        cc.vv.utils.addClickEvent(btnSend, this.node, 'Chat', 'onBtnChatSend');

        var self = this;
        root.on('rb-updated', function(event) {
            var id = event.detail.id;
            self.chooseTag(id);
        });
    },

    chooseTag: function(id) {
        var root = this._chatRoot;
        var tags = [ 'quick', 'emoji' ];

        for (var i = 0; i < tags.length; i++) {
            var item = root.getChildByName(tags[i]);

            item.active = id == i;
        }
    },
	
    getQuickChatInfo: function(index) {
        return this._quickChatInfo[index];
    },
    
    onBtnChatClicked: function() {
        var root = this._chatRoot;

        root.active = true

        var act = cc.moveBy(0.3, -400, 0);

        root.runAction(act);

        var menu = this.node.getChildByName('btn_menu');

        menu.runAction(cc.fadeOut(0.3));
    },

    hide : function() {
        var root = this._chatRoot;

        var act = cc.sequence(cc.moveBy(0.3, 400, 0), cc.callFunc(()=>{
            root.active = false;
        }));

        root.runAction(act);

        var menu = this.node.getChildByName('btn_menu');

        menu.runAction(cc.fadeIn(0.3));
    },

    onBgClicked : function(){
        this.hide();
    },

    onQuickChatItemClicked: function(event) {
        var idx = event.target.idx;
        console.log('quick_chat: ' + idx);
        cc.vv.net.send("quick_chat", { id : idx });

        this.hide();
    },

    onEmojiItemClicked : function(event) {
        var idx = event.target.idx;

        console.log('emoji: ' + idx);
        cc.vv.net.send("emoji", { id : idx });

        this.hide();
    },

    onBtnChatSend: function() {
        var root = this._chatRoot;
        var btnSend = root.getChildByName('btn_send');
        var edt_chat = root.getChildByName('edt_chat').getComponent(cc.EditBox);
        var msg = edt_chat.string;

        if (msg == '')
            return;

        edt_chat.string = '';
        cc.vv.net.send('chat', { msg : msg });

        this.hide();
    }
});

