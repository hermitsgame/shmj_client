package com.rentai.island;

import java.io.File;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.WindowManager;
import android.util.Log;

import com.tencent.mm.opensdk.modelmsg.WXImageObject;
import com.tencent.mm.opensdk.modelmsg.WXMediaMessage;
import com.tencent.mm.opensdk.modelmsg.WXWebpageObject;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.modelmsg.SendMessageToWX;
import com.tencent.mm.opensdk.modelpay.PayReq;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

import org.json.JSONObject;
import com.rentai.island.Constants;

public class WXAPI {
	public static IWXAPI api;
	public static Activity instance;
	public static boolean isLogin = false;
	public static String out_trade_no = "";
	public static void Init(Activity context){
		WXAPI.instance = context;
		api = WXAPIFactory.createWXAPI(context, Constants.APP_ID, true);
		Log.d("cocos", "createWXAPI");
        api.registerApp(Constants.APP_ID);
        context.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
	}
	
	private static String buildTransaction(final String type) {
	    return (type == null) ? String.valueOf(System.currentTimeMillis()) : type + System.currentTimeMillis();
	}
	
	public static void Login(){
		isLogin = true;
		final SendAuth.Req req = new SendAuth.Req();
		req.scope = "snsapi_userinfo";
		req.state = "carjob_wx_login";

		final IWXAPI _api = api;

		instance.runOnUiThread(new Runnable() {
			@Override
			public void run() {
				_api.sendReq(req);
			}
		});
		
		//instance.finish();
	}

	public static void Pay(String token, int id) {
		final IWXAPI _api = api;
		final int _id = id;
		final String _token = token;
		final Activity _instance = instance;

		new Thread() {
			@Override
			public void run() {
				try {
					String url = "http://ip.rt155.com:9000/pay_wechat/prepay";
					Log.d("cocos", " before httpGet");

					JSONObject data = new JSONObject();
					data.put("os", "Android");
					data.put("goods_id", _id);
					data.put("token", _token);

					byte[] buf = Util.httpPost(url, data.toString());

					Log.d("cocos buf: ", new String(buf));

					if (buf == null || buf.length == 0) {
						Log.d("cocos PAY_GET", "buf null");
						return;
					}

					String content = new String(buf);
					Log.e("cocos pay params:", content);
					JSONObject json = new JSONObject(content); 

					if (json == null || json.has("retcode")) {
						Log.d("cocos json:", json != null ? json.getString("retmsg") : "");
						return;
					}

					final PayReq req = new PayReq();
					req.appId			= json.getString("appid");
					req.partnerId		= json.getString("partnerid");
					req.prepayId		= json.getString("prepayid");
					req.nonceStr		= json.getString("noncestr");
					req.timeStamp		= json.getString("timestamp");
					req.packageValue	= json.getString("package");
					req.sign			= json.getString("sign");

					out_trade_no = json.getString("out_trade_no");

					_instance.runOnUiThread(new Runnable() {
						@Override
						public void run() {
							_api.sendReq(req);
						}
					});
		 		} catch(Exception e) {
					Log.e("cocos exception", "" + e.getMessage());
		 		}
			}
		}.start();
	}
	
	public static void Share(String url,String title,String desc, boolean timeline) {
		try {
			isLogin = false;
			WXWebpageObject webpage = new WXWebpageObject();
			webpage.webpageUrl = url;
			WXMediaMessage msg = new WXMediaMessage(webpage);
			msg.title = title;
			msg.description = desc;
			//msg.thumbData = Util.bmpToByteArray(thumbBmp, true);
			
			final SendMessageToWX.Req req = new SendMessageToWX.Req();
			req.transaction = buildTransaction("webpage");
			req.message = msg;
			req.scene = timeline ? SendMessageToWX.Req.WXSceneTimeline : SendMessageToWX.Req.WXSceneSession;

			final IWXAPI _api = api;

			instance.runOnUiThread(new Runnable() {
				@Override
				public void run() {
					_api.sendReq(req);
				}
			});
		}
		catch(Exception e){
			e.printStackTrace();
		}
	}
	
	public static void ShareIMG(String path,int width,int height, boolean timeline) {
		try {
			isLogin = false;
			File file = new File(path);
			if (!file.exists()) {
				return;
			}
			Bitmap bmp = BitmapFactory.decodeFile(path);
			
			WXImageObject imgObj = new WXImageObject(bmp);
			//imgObj.setImagePath(path);
			
			WXMediaMessage msg = new WXMediaMessage();
			msg.mediaObject = imgObj;
			
			
			Bitmap thumbBmp = Bitmap.createScaledBitmap(bmp, width, height, true);
			bmp.recycle();
			msg.thumbData = Util.bmpToByteArray(thumbBmp, true);
			
			final SendMessageToWX.Req req = new SendMessageToWX.Req();
			req.transaction = buildTransaction("img");
			req.message = msg;
			req.scene = timeline ? SendMessageToWX.Req.WXSceneTimeline : SendMessageToWX.Req.WXSceneSession;

			final IWXAPI _api = api;

			instance.runOnUiThread(new Runnable() {
				@Override
				public void run() {
					_api.sendReq(req);
				}
			});
		}
		catch(Exception e){
			e.printStackTrace();
		}
	}

        public static void changeOrientation(int orientation) {
            switch (orientation)
            {
            case 0:
                WXAPI.instance.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                break;
            case 1:
                WXAPI.instance.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                break;
            default:
                break;
            }
        }
}
