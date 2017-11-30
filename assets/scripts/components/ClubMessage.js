
cc.Class({
    extends: cc.Component,

    properties: {
        _temp : null
    },

    onLoad: function() {
        let content = cc.find('items/view/content', this.node);
        let item = content.children[0];
        let addEvent = cc.vv.utils.addClickEvent;

        this._temp = item;
        content.removeChild(item, false);

        let btnClose = cc.find('top/btn_back', this.node);
        addEvent(btnClose, this.node, 'ClubMessage', 'onBtnClose');
        
        let self = this;
        let node = this.node;
        let root = cc.find('Canvas');

        root.on('club_message_notify', data=>{
            let detail = data.detail;
            
            console.log('club_message_notify got');
            if (node.active && (detail.club_id == node.club_id))
                self.refresh();
        });
    },

    onEnable: function() {
        this.refresh();
    },

    onBtnClose: function() {
        this.node.active = false;
    },

    sign: function(id, status) {
        let self = this;
        let data = {
            id : id,
            sign : status,
            score : 0,
            limit : 0
        };

        cc.vv.pclient.request_apis('sign_club_message', data, ret=>{
            if (!ret || ret.errcode != 0)
                return;

            self.refresh();
        });
    },

    onBtnApproveClicked: function(event) {
        let item = event.target.parent;

        this.sign(item.msg_id, 'approved');
    },

    onBtnRejectClicked: function(event) {
        let item = event.target.parent;

        this.sign(item.msg_id, 'rejected');
    },

    refresh: function() {
        let self = this;

        let data = {
            club_id : this.node.club_id
        };

        cc.vv.pclient.request_apis('list_club_message', data, function(ret) {
            if (!ret || ret.errcode != 0)
                return;

            self.showItems(ret.data);
        });
    },

    getItem: function(index) {
        let content = cc.find('items/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        let node = cc.instantiate(this._temp);

        content.addChild(node);
        return node;
    },

    shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

    showItems: function(data) {
        let content = cc.find('items/view/content', this.node);

        data.sort((a, b)=>{
            let wait_a = a.type == 'apply' && a.sign == 'wait';
            let wait_b = b.type == 'apply' && b.sign == 'wait';

            if (wait_a == wait_b)
                return b.uptime - a.uptime;

            if (wait_a && !wait_b)
                return -1;
            else
                return 1;
        });

        for (let i = 0; i < data.length; i++) {
            let msg = data[i];
            let item = this.getItem(i);
            let name = item.getChildByName('name').getComponent(cc.Label);
            let id = item.getChildByName('id').getComponent(cc.Label);
            let time = item.getChildByName('time').getComponent(cc.Label);
            let message = item.getChildByName('message').getComponent(cc.Label);
            let head = cc.find('icon/head', item).getComponent('ImageLoader');
            let btn_approve = item.getChildByName('btn_approve');
            let btn_reject = item.getChildByName('btn_reject');
            let approved = item.getChildByName('approved');

            name.string = new Buffer(msg.name, 'base64').toString().slice(0, 5);
            id.string = msg.user_id;
            time.string = cc.vv.utils.dateFormat(msg.uptime * 1000);

            let type = msg.type;
            let sign = msg.sign;
            let status = '';

            let msgs = {
                join : '申请加入俱乐部',
                leave : '离开了俱乐部',
                apply : '申请加入俱乐部'
            };

            message.string = msgs[type];

            btn_approve.active = (type == 'apply') && (sign == 'wait');
            btn_reject.active = (type == 'apply') && (sign == 'wait');
            approved.active = (type == 'apply' || type == 'join');
            if (sign == 'approved')
                status = '已通过';
            else if (sign == 'rejected')
                status = '已拒绝';

            approved.getComponent(cc.Label).string = status;
            head.setLogo(msg.user_id, msg.logo);

            item.msg_id = msg.id;
        }

        this.shrinkContent(content, data.length);
    },
});

