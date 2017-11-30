
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        let node = this.node;
        let maima = cc.find('game/maima', node);
        let mas = maima.getChildByName('mas');
        let addEvent = cc.vv.utils.addClickEvent;

        for (let i = 0; i < mas.childrenCount; i++) {
            addEvent(mas.children[i], node, 'Maima', 'onBtnClick', '' + i);
        }

        this.initEventHandler();
    },

    initEventHandler: function() {
        let node = this.node;
        let self = this;
        let game = cc.vv.gameNetMgr;

        node.on('game_wait_maima', data=>{
            console.log('showWait');
            console.log(data.detail);
            self.showWait(data.detail);
        });

        node.on('game_maima', data=>{
            console.log('showResult');
            console.log(data.detail);
            self.showResult(data.detail);
        });

        node.on('game_sync', data=>{
            let maima = game.maima;

            console.log('Maima game_sync');
            console.log(maima);

            if (maima == null)
                return;

            if (maima.selected == null)
                self.showWait(maima);
            else
                self.showResult(maima);
        });
    },

    onBtnClick: function(event, data) {
        let id = parseInt(data);
        let net = cc.vv.net;

        console.log('maima clicked, id=' + id);

        net.send('maima', id);
    },

    showWait: function(data) {
        let game = cc.vv.gameNetMgr;
        let seatindex = game.seatIndex;
        let act = seatindex == data.seatindex;
        let num = data.mas.length;
        let maima = cc.find('game/maima', this.node);
        let mas = maima.getChildByName('mas');
        let title = maima.getChildByName('title').getComponent(cc.Label);
        let score = maima.getChildByName('score');

        title.string = act ? '请选择飞苍蝇' : '请等待飞苍蝇';
        score.active = false;

        for (let i = 0; i < mas.childrenCount && i < num; i++) {
            let board = mas.children[i];
            let tile = board.getChildByName('tile');
            let sprite = board.getComponent('SpriteMgr');
            let btn = board.getComponent(cc.Button);

            sprite.setIndex(0);
            tile.active = false;

            btn.interactable = act;
            board.active = true;
        }

        for (let i = num ; i < mas.childrenCount; i++) {
            let board = mas.children[i];
            board.active = false;
        }

        maima.active = true;
    },

    showResult: function(data) {
        let game = cc.vv.gameNetMgr;
        let seatindex = game.seatIndex;
        let act = false;
        let id = data.selected;
        let num = data.mas.length;
        let maima = cc.find('game/maima', this.node);
        let mas = maima.getChildByName('mas');
        let score = maima.getChildByName('score');

        let mjid = data.mas[id];
        let add = data.scores[id];

        for (let i = 0; i < mas.childrenCount && i < num; i++) {
            let board = mas.children[i];
            let tile = board.getChildByName('tile');
            let sprite = board.getComponent('SpriteMgr');
            let btn = board.getComponent(cc.Button);

            sprite.setIndex(0);
            tile.active = false;
            btn.interactable = act;
        }

        for (let i = num ; i < mas.childrenCount; i++) {
            let board = mas.children[i];
            board.active = false;
        }

        maima.active = true;

        let ma = mas.children[id];
        let sp = cc.vv.mahjongmgr.getTileSprite2D(mjid);
        let tile = ma.getChildByName('tile');
        let tilesp = tile.getComponent(cc.Sprite);
        let anim = ma.getComponent(cc.Animation);

        anim.once('finished', ()=>{
            tilesp.spriteFrame = sp;
            tile.active = true;

            score.getComponent(cc.Label).string = '/' + add;
            score.active = true;
        
            setTimeout(()=>{
                maima.active = false;
            }, 3000);
        });

        anim.play('maima1');
    }
});

