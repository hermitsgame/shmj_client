
cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    onLoad: function () {
        let top = this.node.getChildByName('top');
        let btn_back = top.getChildByName('btn_back');
        let btn_edit = top.getChildByName('btn_edit');
        let addClickEvent = cc.vv.utils.addClickEvent;

        addClickEvent(btn_back, this.node, 'ClubDetail', 'onBtnClose');
        addClickEvent(btn_edit, this.node, 'ClubDetail', 'onBtnEdit');

        let btn_mail = cc.find('club/btn_mail', this.node);

        addClickEvent(btn_mail, this.node, 'ClubDetail', 'onBtnMessage');

        let content = cc.find('items/view/content', this.node);
        let btn_next = content.children[1].getChildByName('btn_next');
        let btn_share = content.children[3].getChildByName('btn_share');

        addClickEvent(btn_next, this.node, 'ClubDetail', 'onBtnMembers');
        addClickEvent(btn_share, this.node, 'ClubDetail', 'onBtnShare');

        let btn_exit = cc.find('bottom/btn_exit', this.node);

        addClickEvent(btn_exit, this.node, 'ClubDetail', 'onBtnExit');
    },

    onEnable: function() {
        this.setButton();
        this.refresh();
    },

    onBtnClose: function() {
        this.node.active = false;

        let pp = this.node.parent_page;
        if (pp)
            pp.refresh();
    },

    onBtnEdit: function() {
        let set_club = cc.find('Canvas/set_club');

        set_club.clubInfo = this.node.clubInfo;
        set_club.parent_page = this;
        set_club.active = true;
    },

    onBtnMessage: function() {
        let message = cc.find('Canvas/club_message');

        message.club_id = this.node.club_id;
        message.active = true;
    },

    onBtnMembers: function() {
        let rank = cc.find('Canvas/rank');
        let set  = cc.find('Canvas/set_member');
        let is_admin = this.node.is_admin;

        let member = is_admin ? set : rank;

        member.club_id = this.node.club_id;
        member.active = true;
    },

    onBtnShare: function() {
        let club_id = this.node.club_id;
        let share = cc.find('Canvas/share');

        share.club_id = club_id;
        share.active = true;
    },

    afterExit: function() {
        let club_list = cc.find('Canvas/club_list').getComponent('ClubList');

        club_list.refresh();
    },

    doExit: function() {
        let club_id = this.node.club_id;
        let self = this;
        let data = {
            club_id : club_id
        };

        cc.vv.pclient.request_apis('leave_or_delete_club', data, ret=>{
            if (!ret)
                return;

            if (ret.errcode != 0) {
                console.log('leave_or_delete_club ret=');
                console.log(ret)
                return;
            }

            self.node.active = false;
            self.afterExit();
        });
    },

    onBtnExit: function() {
        let self = this;
        cc.vv.alert.show('确定退出俱乐部吗？', ()=>{
            self.doExit();
        }, true);
    },

    setButton: function() {
        let top = this.node.getChildByName('top');
        let btn_edit = top.getChildByName('btn_edit');
        let btn_mail = cc.find('club/btn_mail', this.node);
        let is_admin = this.node.is_admin;

        btn_edit.active = is_admin;
        btn_mail.active = is_admin;
    },

    show: function(data) {
        let club = this.node.getChildByName('club');
        let name = club.getChildByName('name').getComponent(cc.Label);
        let headcount = club.getChildByName('headcount').getComponent(cc.Label);
        let head = cc.find('icon/head', club);

        name.string = data.name;
        headcount.string = data.member_num + ' / ' + data.max_member_num;
        cc.vv.utils.loadImage(data.logo, head, true);

        let content = cc.find('items/view/content', this.node);
        let creator = content.children[0];
        let desc = content.children[2].getChildByName('desc').getComponent(cc.Label);
        let id = content.children[3].getChildByName('id').getComponent(cc.Label);

        desc.string = data.desc;
        id.string = data.id;

        let chead = cc.find('icon/head', creator).getComponent('ImageLoader');
        let cname = creator.getChildByName('name').getComponent(cc.Label);
        let owner = data.owner;

        chead.setLogo(owner.id, owner.logo);
        cname.string = owner.name;

        let create_time = cc.find('bottom/create_time', this.node).getComponent(cc.Label);
        let create_at = new Date(data.create_time * 1000);

        create_time.string = '创建于' + create_at.toLocaleDateString();

        this.node.clubInfo = data;
    },

    refresh: function() {
        let club_id = this.node.club_id;
        let self = this;
        let data = {
            club_id : club_id
        };

        cc.vv.pclient.request_apis('get_club_detail', data, ret=>{
            if (!ret || ret.errcode != 0)
                return;

            self.show(ret.data);
        });
    },
});

