package com.rentai.island;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import org.cocos2dx.lib.Cocos2dxHelper;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

public class Image {
	public static Activity instance;
	public static Image mInstance = null;
	public static String mPath = null;
	public static void Init(Activity context) {
		Image.instance = context;
	}

	public static Image getInstance() {
		if (null == mInstance) {
			mInstance = new Image();
		}

		return mInstance;
	}

	private static final int CAMERA_CODE = 1;
	private static final int GALLERY_CODE = 2;
	private static final int CROP_CODE = 3;

	/**
	 * 拍照选择图片
	 */
	private void chooseFromCamera() {
		//构建隐式Intent
		Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		//调用系统相机
		instance.startActivityForResult(intent, CAMERA_CODE);
	}

	/**
	 * 从相册选择图片
	 */
	private static void chooseFromGallery() {
		Intent intent = new Intent(Intent.ACTION_PICK);
		//设置选择类型为图片类型
		intent.setDataAndType(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image/*");
		//打开图片选择
		instance.startActivityForResult(intent, GALLERY_CODE);
	}

	public static void pickImage(String path) {
		mPath = path;
		chooseFromGallery();
	}

	private void pushResult(int ret) {
		final int _ret = ret;
		Cocos2dxHelper.runOnGLThread(new Runnable() {
			@Override
			public void run() {
				Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onPickResp(" + _ret + ")");
			}
		});
	}

	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		switch (requestCode) {
			case CAMERA_CODE:
				//用户点击了取消
				if(data == null){
					pushResult(1);
					return;
				}else{
					Bundle extras = data.getExtras();
					if (extras != null){
						//获得拍的照片
						Bitmap bm = extras.getParcelable("data");
						//将Bitmap转化为uri
						Uri uri = saveBitmap(bm, "temp", "avater.jpg");
						//启动图像裁剪
						startImageZoom(uri);
					}
				}
				break;
			case GALLERY_CODE:
				if (data == null){
					pushResult(1);
					return;
				}else{
					//用户从图库选择图片后会返回所选图片的Uri
					Uri uri;
					//获取到用户所选图片的Uri
					uri = data.getData();
					//返回的Uri为content类型的Uri,不能进行复制等操作,需要转换为文件Uri
					//uri = convertUri(uri);
					startImageZoom(uri);
				}
				break;
			case CROP_CODE:
				if (data == null){
					pushResult(2);
					return;
				}else{
					Bundle extras = data.getExtras();
					if (extras != null){
						//获取到裁剪后的图像
						Bitmap bm = extras.getParcelable("data");
						Log.e("cocos", "get crop bm");
						saveBitmap(bm, "temp", "icon.jpg");
						bm.recycle();
						pushResult(0);
					}
				}
				break;
			default:
				break;
		}
	}

	/**
	 * 将content类型的Uri转化为文件类型的Uri
	 * @param uri
	 * @return
	 */
	private Uri convertUri(Uri uri){
		InputStream is;
		try {
			//Uri ----> InputStream
			is = instance.getContentResolver().openInputStream(uri);
			//InputStream ----> Bitmap
			Bitmap bm = BitmapFactory.decodeStream(is);
			//关闭流
			is.close();
			Uri ret =  saveBitmap(bm, "temp", "avater.jpg");
			bm.recycle();
			return ret;
		} catch (FileNotFoundException e) {
			e.printStackTrace();
			return null;
		} catch (IOException e) {
			e.printStackTrace();
			return null;
		}
	}

	/**
	 * 将Bitmap写入SD卡中的一个文件中,并返回写入文件的Uri
	 * @param bm
	 * @param dirPath
	 * @return
	 */
	private Uri saveBitmap(Bitmap bm, String dirPath, String filename) {
		//新建文件夹用于存放裁剪后的图片
		//File tmpDir = new File(Environment.getExternalStorageDirectory() + "/" + dirPath);
		File tmpDir = new File(mPath);
		if (!tmpDir.exists()){
			tmpDir.mkdir();
		}

		//新建文件存储裁剪后的图片
		File img = new File(tmpDir.getAbsolutePath() + "/" + filename);
		Log.e("cocos", "saveImage: " + tmpDir.getAbsolutePath() + "/" + filename);
		try {
			//打开文件输出流
			FileOutputStream fos = new FileOutputStream(img);
			//将bitmap压缩后写入输出流(参数依次为图片格式、图片质量和输出流)
			bm.compress(Bitmap.CompressFormat.JPEG, 85, fos);
			//刷新输出流
			fos.flush();
			//关闭输出流
			fos.close();
			//返回File类型的Uri
			return Uri.fromFile(img);
		} catch (FileNotFoundException e) {
			e.printStackTrace();
			return null;
		} catch (IOException e) {
			e.printStackTrace();
			return null;
		}
	}

	/**
	 * 通过Uri传递图像信息以供裁剪
	 * @param uri
	 */
	private void startImageZoom(Uri uri){
		//构建隐式Intent来启动裁剪程序
		Intent intent = new Intent("com.android.camera.action.CROP");
		//设置数据uri和类型为图片类型
		intent.setDataAndType(uri, "image/*");
		//显示View为可裁剪的
		intent.putExtra("crop", true);
		//裁剪的宽高的比例为1:1
		intent.putExtra("aspectX", 1);
		intent.putExtra("aspectY", 1);
		//输出图片的宽高均为150
		intent.putExtra("outputX", 128);
		intent.putExtra("outputY", 128);
		//裁剪之后的数据是通过Intent返回
		intent.putExtra("return-data", true);
		instance.startActivityForResult(intent, CROP_CODE);
	}
}
