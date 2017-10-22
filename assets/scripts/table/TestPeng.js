const TestTile = require('TestTile');
const Direction = require('Direction');

const Peng = cc.Class({
    name: 'Peng',

    properties: {
        tileTextures: [cc.SpriteFrame],
        tileText: cc.SpriteFrame,
        textPos: cc.Vec2,
        textStartSkew: cc.Vec2,
        skewStep: cc.Vec2,
        textScale: cc.Vec2,
        textScaleStep: 1,
        tileStep: cc.Vec2,
        
        gangStep: cc.Vec2,
    }
});

cc.Class({
    extends: cc.Component,

    properties: {
        test: false,
        direction: {
            type: Direction,
            default: 0
        },
        stacks: [Peng],
        textRotation: 0,
        zStep: 0,
        gap: cc.Vec2,
        tilePrefab: cc.Prefab,
        
        _nodes: []
    },
    
    getStack(id) {
        let nodes = [];
        
        for (let i = 0; i < 4; i++) {
            nodes.push(this._nodes[id * 4 + i]);
        }
        
        return nodes;
    },

    onLoad () {
        this.curPos = cc.p(0, 0);
        if (this.test) {
            this.initPeng();
        }
    },

    initPeng () {
        for (let i = 0; i < this.stacks.length; ++i) {
            this.initStack(i);
        }
    },

    initStack (index) {
        let stack = this.stacks[index];
        let zStep = this.zStep;
        let tileCount = stack.tileTextures.length;
        let tileM = null;
        let nodes = this._nodes;
        for (let i = 0; i < tileCount; ++i) {
            let tileN = cc.instantiate(this.tilePrefab);
            let tile = tileN.getComponent('TestTile');
            
            tileN.name = 'peng';
            this.node.addChild(tileN);
            tileN.position = this.curPos;
            tileN.setLocalZOrder(this.zStep * (i + index * tileCount));
            let curSkew = cc.pAdd(stack.textStartSkew, cc.pMult(stack.skewStep, i));
            tile.init(stack.tileTextures[i], stack.tileText, {
                scale: cc.pMult(stack.textScale, Math.pow(stack.textScaleStep, i)),
                skew: curSkew,
                position: cc.pMult(stack.textPos, Math.pow(stack.textScaleStep, i)),
                rotation: this.textRotation
            });
            
            nodes.push(tileN);
            
            if (1 == i) {
                tileM = cc.instantiate(this.tilePrefab);
                let tilem = tileM.getComponent('TestTile');

                tileM.name = 'gang';
                tileM.position = cc.pAdd(this.curPos, stack.gangStep);
                tileM.setLocalZOrder(zStep * ((index + (zStep > 0 ? 1 : 0)) * tileCount));
                tilem.init(stack.tileTextures[i], stack.tileText, {
                    scale: cc.pMult(stack.textScale, Math.pow(stack.textScaleStep, i)),
                    skew: curSkew,
                    position: cc.pMult(stack.textPos, Math.pow(stack.textScaleStep, i)),
                    rotation: this.textRotation
                });
            }
            
            this.curPos = cc.pAdd(this.curPos, cc.pMult(stack.tileStep, Math.pow(stack.textScaleStep, i)));
        }
        
        this.node.addChild(tileM);
        nodes.push(tileM);

        this.curPos = cc.pAdd(this.curPos, this.gap);
    }
});