
cc.Class({
    extends: cc.Component,

    properties: {
        _lastTouchTime: null,
        _voice: null,
        _notice: null,
        _bar: null,
        MAX_TIME: 15000,

		_state: -1,
    },

    onLoad: function() {
        let voice = cc.find("Canvas/voice");
		this._voice = voice;

        voice.active = false;

        let bar = this._bar = voice.getChildByName('bar');
        this._notice = voice.getChildByName('notice').getComponent(cc.Label);

        bar.old_width = bar.width;

        this.initTouchEvent();
    },

    initTouchEvent() {
        let btn = cc.find('Canvas/btn_voice');
        let self = this;
        let type = cc.Node.EventType;

        btn.on(type.TOUCH_START, event=>{
            console.log('TOUCH_START');
            self.enterState(0);
        });

        btn.on(type.TOUCH_MOVE, event=>{
            console.log('TOUCH_MOVE');

            let target = event.getCurrentTarget();
            let touches = event.getTouches();
            let locationInNode = target.convertTouchToNodeSpaceAR(touches[0]);

            let s = target.getContentSize();
            let rect = cc.rect(0 - s.width / 2, 0 - s.height / 2, s.width, s.height);

            if (cc.rectContainsPoint(rect, locationInNode))
                self.enterState(2);
            else
                self.enterState(1);
        });

        btn.on(type.TOUCH_END, event=>{
            console.log('TOUCH_END');
            self.enterState(4);
        });

        btn.on(type.TOUCH_CANCEL, event=>{
            console.log('TOUCH_CANCEL');
            self.enterState(3);
        });

        btn.active = !cc.vv.replayMgr.isReplay();
    },

	enterState: function(state) {
		let notice = this._notice;
		let bar = this._bar;
        let voice = this._voice;

        console.log('enterState: ' + state);

		switch (state) {
			case 0:  // touch start
				cc.vv.voiceMgr.prepare("record.amr");
                this._lastTouchTime = Date.now();

                bar.width = 0;
				notice.string = '请按住说话';
                voice.active = true;
				break;
			case 1:  // touch move - out of button
    			console.log('1');
				if (this._lastTouchTime != null)
					notice.string = '松开手指，取消发送';

				break;
			case 2: // touch move - in button
    			console.log('2');
				if (this._lastTouchTime != null)
					notice.string = '请按住说话';

				break;
			case 3:  // touch cancel
    			console.log('3');
				if (this._lastTouchTime != null) {
					cc.vv.voiceMgr.cancel();
					this._lastTouchTime = null;
					voice.active = false;
				}
				break;
			case 4:  // touch end
			    console.log('4');
				if (this._lastTouchTime != null) {
					if (Date.now() - this._lastTouchTime < 1000) {
						cc.vv.voiceMgr.cancel();
                        voice.active = true;
						bar.width = 0;
						notice.string = '录制时间太短';
						
						setTimeout(()=>{
						    voice.active = false;
						}, 1000);
					} else {
						this.onVoiceOK();
					}

					this._lastTouchTime = null;
				}
				
				break;
			default:
				break;
		}
    },

    onVoiceOK: function() {
        if (this._lastTouchTime != null) {
            cc.vv.voiceMgr.release();
            let time = Date.now() - this._lastTouchTime;
            let msg = cc.vv.voiceMgr.getVoiceData("record.amr");
            cc.vv.net.send("voice_msg", { msg: msg, time: time });
        }

        this._voice.active = false;
    },
    
    onBtnOKClicked:function(){
        this._voice.active = false;
    },

    update: function(dt) {
    	let now = Date.now();
        
        if (this._lastTouchTime != null) {
            let time = now - this._lastTouchTime;
            if (time >= this.MAX_TIME) {
                this.onVoiceOK();
                this._lastTouchTime = null;
            } else {
                let bar = this._bar;
                bar.width = (time / this.MAX_TIME) * bar.old_width;
            }
        }
    },
});

