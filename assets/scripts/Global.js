var Global = cc.Class({
    extends: cc.Component,
    statics: {
        isstarted:false,
        netinited:false,
        userguid:0,
        nickname:"",
        money:0,
        lv:0,
        roomId:0,
        const_code : {
            OK: 0,
            FAIL: 500,

            ENTRY: {
                FA_TOKEN_INVALID: 	1001,
                FA_TOKEN_EXPIRE: 	1002,
                FA_USER_NOT_EXIST: 	1003
            },

            GATE: {
                FA_NO_SERVER_AVAILABLE: 2001
            }
        }
    },
});