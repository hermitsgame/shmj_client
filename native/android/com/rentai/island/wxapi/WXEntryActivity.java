package com.rentai.island.wxapi;


import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
import org.cocos2dx.lib.Cocos2dxHelper;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.modelmsg.ShowMessageFromWX;
import com.tencent.mm.opensdk.modelmsg.WXAppExtendObject;
import com.tencent.mm.opensdk.modelmsg.WXMediaMessage;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;
import com.rentai.island.Constants;
import com.rentai.island.WXAPI;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler{
	
	// IWXAPI �ǵ�����app��΢��ͨ�ŵ�openapi�ӿ�
    private IWXAPI _api;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //setContentView(R.layout.plugin_entry);
    	_api = WXAPIFactory.createWXAPI(this, Constants.APP_ID, false);
        _api.handleIntent(getIntent(), this);
		Log.d("cocos", "onCreate WXEntryActivity");
    }

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		
		setIntent(intent);
        _api.handleIntent(intent, this);
	}

	// ΢�ŷ������󵽵�����Ӧ��ʱ����ص����÷���
	@Override
	public void onReq(BaseReq req) {
		/*
		switch (req.getType()) {
		case ConstantsAPI.COMMAND_GETMESSAGE_FROM_WX:
			//goToGetMsg();		
			break;
		case ConstantsAPI.COMMAND_SHOWMESSAGE_FROM_WX:
			//goToShowMsg((ShowMessageFromWX.Req) req);
			break;
		default:
			break;
		}
		*/
	}

	// ������Ӧ�÷��͵�΢�ŵ�����������Ӧ�������ص����÷���
	@Override
	public void onResp(BaseResp resp) {
		int result = 0;
		Log.d("cocos", "onResp");
		switch (resp.errCode) {
		case BaseResp.ErrCode.ERR_OK:
			if(WXAPI.isLogin){
				final SendAuth.Resp authResp = (SendAuth.Resp)resp;
				if(authResp != null && authResp.code != null){
					Cocos2dxHelper.runOnGLThread(new Runnable() {
						@Override
						public void run() {
							Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onLoginResp('"+ authResp.code +"')");
						}
					});
				} else {
					Cocos2dxHelper.runOnGLThread(new Runnable() {
						@Override
						public void run() {
							Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onLoginResp()");
						}
					});
				}
			} else {
				Cocos2dxHelper.runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onShareResp(0)");
					}
				});
			}

			break;
		case BaseResp.ErrCode.ERR_USER_CANCEL:
			result = 2;//R.string.errcode_cancel;
			//break;
		case BaseResp.ErrCode.ERR_AUTH_DENIED:
			result = 3;//R.string.errcode_deny;
			//break;
		default:
			result = 4;//R.string.errcode_unknown;
			//break;
			if (WXAPI.isLogin) {
				Cocos2dxHelper.runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onLoginResp()");
					}
				});
			} else {
				Cocos2dxHelper.runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onShareResp(" + result + ")");
					}
				});
			}
		}

		this.finish();
		
		//Toast.makeText(this, result, Toast.LENGTH_LONG).show();
	}
}