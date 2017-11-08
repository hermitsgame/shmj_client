
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
        let addClickEvent = cc.vv.utils.addClickEvent;

        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = !cc.vv.replayMgr.isReplay();
        addClickEvent(this._btnChat, this.node, 'Chat', 'onBtnChatClicked');

        let root = this.node.getChildByName("chat");

        root.active = false;
        this._chatRoot = root;

        let bg = root.getChildByName("mask");

        addClickEvent(bg, this.node, 'Chat', 'onBgClicked');

        let content = cc.find("quick/view/content", root);
        let temp = content.getChildByName("item");

        addClickEvent(temp, this.node, 'Chat', 'onQuickChatItemClicked');

        content.removeChild(temp, false);

        let qc = [
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

        for (let i = 0; i < qc.length; i++) {
            let info = qc[i];
            let item = cc.instantiate(temp);

            item.idx = i;

            let lblInfo = item.getChildByName("msg").getComponent(cc.Label);
            lblInfo.string = info.content;

            content.addChild(item);

            if (i == qc.length - 1) {
                let line = item.getChildByName('line');
                line.active = false;
            }
        }

        this._quickChatInfo = qc;

        let emoji = cc.find('emoji/view/content', root);

        for (let i = 0; i < emoji.childrenCount; i++) {
            let item = emoji.children[i];
            
            if (item.name == 'grid')
                continue;

            item.idx = i;

            addClickEvent(item, this.node, 'Chat', 'onEmojiItemClicked');
        }

        let btnSend = root.getChildByName('btn_send');

        addClickEvent(btnSend, this.node, 'Chat', 'onBtnChatSend');

        let self = this;
        root.on('rb-updated', event=>{
            self.chooseTag(event.detail.id);
        });
    },

    chooseTag: function(id) {
        let root = this._chatRoot;
        let tags = [ 'quick', 'emoji' ];

        for (let i = 0; i < tags.length; i++) {
            let item = root.getChildByName(tags[i]);

            item.active = id == i;
        }
    },
	
    getQuickChatInfo: function(index) {
        return this._quickChatInfo[index];
    },
    
    onBtnChatClicked: function() {
        let root = this._chatRoot;

        root.active = true
    },

    hide : function() {
        let root = this._chatRoot;

        root.active = false;
    },

    onBgClicked : function(){
        this.hide();
    },

    onQuickChatItemClicked: function(event) {
        let idx = event.target.idx;
        console.log('quick_chat: ' + idx);
        cc.vv.net.send("quick_chat", { id : idx });

        this.hide();
    },

    onEmojiItemClicked : function(event) {
        let idx = event.target.idx;

        console.log('emoji: ' + idx);
        cc.vv.net.send("emoji", { id : idx });

        this.hide();
    },

    onBtnChatSend: function() {
        let root = this._chatRoot;
        let btnSend = root.getChildByName('btn_send');
        let edt_chat = root.getChildByName('edt_chat').getComponent(cc.EditBox);
        let msg = edt_chat.string;

        if (msg == '')
            return;

        edt_chat.string = '';
        cc.vv.net.send('chat', { msg : msg });

        this.hide();
    }
});

