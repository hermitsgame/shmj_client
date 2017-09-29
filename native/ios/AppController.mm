/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#import <UIKit/UIKit.h>
#import "cocos2d.h"

#import "AppController.h"
#import "AppDelegate.h"
#import "RootViewController.h"
#import "platform/ios/CCEAGLView-ios.h"
#import "VoiceSDK.h"
#import "IAPShare.h"


@implementation AppController

#pragma mark -
#pragma mark Application lifecycle

// cocos2d application instance
static AppDelegate s_sharedApplication;
static bool __isWxLogin = false;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    
    // Override point for customization after application launch.
    
    // Add the view controller's view to the window and display.
    window = [[UIWindow alloc] initWithFrame: [[UIScreen mainScreen] bounds]];
    CCEAGLView *eaglView = [CCEAGLView viewWithFrame: [window bounds]
                                         pixelFormat: kEAGLColorFormatRGBA8
                                         depthFormat: GL_DEPTH24_STENCIL8_OES
                                  preserveBackbuffer: NO
                                          sharegroup: nil
                                       multiSampling: NO
                                     numberOfSamples: 0 ];
    
    [eaglView setMultipleTouchEnabled:YES];
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    // Use RootViewController manage CCEAGLView
    viewController = [[RootViewController alloc] initWithNibName:nil bundle:nil];
    viewController.wantsFullScreenLayout = YES;
    viewController.view = eaglView;
    
    // Set RootViewController to window
    if ( [[UIDevice currentDevice].systemVersion floatValue] < 6.0)
    {
        // warning: addSubView doesn't work on iOS6
        [window addSubview: viewController.view];
    }
    else
    {
        // use this method on ios6
        [window setRootViewController:viewController];
    }
    
    [window makeKeyAndVisible];
    
    [[UIApplication sharedApplication] setStatusBarHidden: YES];
    
    // IMPORTANT: Setting the GLView should be done after creating the RootViewController
    cocos2d::GLView *glview = cocos2d::GLViewImpl::createWithEAGLView(eaglView);
    cocos2d::Director::getInstance()->setOpenGLView(glview);
    
    cocos2d::Application::getInstance()->run();
    
    //向微信注册
    [WXApi registerApp:@"wx202a4edf0d54c822" withDescription:@"island"];
    return YES;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary*)options{
    [WXApi handleOpenURL:url delegate:self];

    return YES;
}


- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    cocos2d::Director::getInstance()->pause();
}

+(void) share:(NSString*)url shareTitle:(NSString*)title shareDesc:(NSString*)desc timeLine:(BOOL)tl
{
    NSLog(@"wx share timeline=%d", tl);
    WXMediaMessage *message = [WXMediaMessage message];
    message.title = title;
    message.description = desc;
    [message setThumbImage:[UIImage imageNamed:@"Icon-29.png"]];
    
    WXWebpageObject *ext = [WXWebpageObject object];
    ext.webpageUrl = url;
    
    message.mediaObject = ext;
    
    SendMessageToWXReq* req = [[[SendMessageToWXReq alloc] init] autorelease];
    
    req.message = message;
    req.bText = NO;
    req.scene = tl ? WXSceneTimeline : WXSceneSession;
    
    __isWxLogin = false;
    [WXApi sendReq:req];
}

+(void) shareIMG:(NSString*)filePath width:(int)width height:(int)height timeLine:(BOOL)tl
{
    
    WXMediaMessage *message = [WXMediaMessage message];
    [message setThumbImage:[UIImage imageNamed:@"Icon-29.png"]];
    
    WXImageObject *ext = [WXImageObject object];
    ext.imageData = [NSData dataWithContentsOfFile:filePath];
    message.mediaObject = ext;

    SendMessageToWXReq* req = [[[SendMessageToWXReq alloc] init] autorelease];
    
    req.message = message;
    req.bText = NO;
    req.scene = tl ? WXSceneTimeline : WXSceneSession;
    
    __isWxLogin = false;
    [WXApi sendReq:req];
}

+(void)login
{
    __isWxLogin = true;
    //构造SendAuthReq结构体
    SendAuthReq* req =[[[SendAuthReq alloc ] init ] autorelease ];
    req.scope = @"snsapi_userinfo" ;
    req.state = @"123" ;
    //第三方向微信终端发送一个SendAuthReq消息结构
    [WXApi sendReq:req];
}

#include "ScriptingCore.h"
-(void) onResp:(BaseResp*)resp{
    NSLog(@"wx resp data code:%d  str:%@",resp.errCode,resp.errStr);
    if (__isWxLogin) {
        __isWxLogin = false;
        SendAuthResp *aresp = (SendAuthResp *)resp;
        if (aresp.errCode== 0) {
            NSString *code = aresp.code;
            char tmp[255]= {0};
            const char* tcode = [code UTF8String];
            sprintf(tmp, "cc.vv.anysdkMgr.onLoginResp('%s')",tcode);
            ScriptingCore::getInstance()->evalString(tmp);
        }else{
            ScriptingCore::getInstance()->evalString("cc.vv.anysdkMgr.onLoginResp()");
        }
    }else{
        char tmp[255]= {0};
        sprintf(tmp, "cc.vv.anysdkMgr.onShareResp('%d')", resp.errCode);
        ScriptingCore::getInstance()->evalString(tmp);
    }
    __isWxLogin = false;
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    cocos2d::Director::getInstance()->resume();
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    cocos2d::Application::getInstance()->applicationDidEnterBackground();
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    cocos2d::Application::getInstance()->applicationWillEnterForeground();
}

- (void)applicationWillTerminate:(UIApplication *)application {
    /*
     Called when the application is about to terminate.
     See also applicationDidEnterBackground:.
     */
}

+(BOOL) checkWechat {
    if ([WXApi isWXAppInstalled] && [WXApi isWXAppSupportApi]) {
        NSLog(@"wc ok");
        
        return true;
    }
    
    NSLog(@"wc fail");
    
    return false;
}

+(void) initIAP:(NSString *)products receipts:(NSString *)receipts {
    NSLog(@"initIAP");
    
    NSLog(@"receipt path: %@", receipts);
    
    if(![IAPShare sharedHelper].iap) {
        NSArray *array = [products componentsSeparatedByString:@","];
        NSSet* dataSet = [[NSSet alloc] initWithArray:array];
        
        NSLog(@"set: %@", dataSet);
        
        [IAPShare sharedHelper].iap = [[IAPHelper alloc] initWithProductIdentifiers:dataSet];
        [IAPShare sharedHelper].iap.receiptsPath = [NSString stringWithString:receipts];
    }
}

+(void) buyProduct:(NSString*)type
{
    NSLog(@"buyProduct %s", [type UTF8String]);
    
    [IAPShare sharedHelper].iap.production = YES;
    
    [[IAPShare sharedHelper].iap requestProductsWithCompletion:^(SKProductsRequest* request,SKProductsResponse* response)
     {
         if(response > 0 ) {
             SKProduct *p = nil;
             
             for (SKProduct *prd in [IAPShare sharedHelper].iap.products) {
                 if ([prd.productIdentifier isEqualToString:type]) {
                     p = prd;
                     break;
                 }
             }
             
             if (!p) {
                 NSLog(@"product %s not found", [type UTF8String]);
                 char tmp[256] = {0};
                 sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 5);
                 ScriptingCore::getInstance()->evalString(tmp);

                 return;
             }
             
             [[IAPShare sharedHelper].iap buyProduct:p onCompletion:^(SKPaymentTransaction* trans) {
                 if (trans.error)
                 {
                     NSLog(@"Fail %@",[trans.error localizedDescription]);
                     char tmp[256] = {0};
                     sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 2);
                     ScriptingCore::getInstance()->evalString(tmp);
                 } else if(trans.transactionState == SKPaymentTransactionStatePurchased) {
                     NSData *data = [NSData dataWithContentsOfURL:[[NSBundle mainBundle] appStoreReceiptURL]];

                     {
                         NSString *file = [[IAPShare sharedHelper].iap saveReceipt:data];
                         char tmp[256] = {0};
                         sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d, '%s.plist')", 0, [file UTF8String]);
                         ScriptingCore::getInstance()->evalString(tmp);
                         return;
                     }
                     
                     [[IAPShare sharedHelper].iap checkReceipt:data AndSharedSecret:nil  onCompletion:^(NSString *response, NSError *error) {
                         
                         NSDictionary* rec = [IAPShare toJSON:response];
                         
                         if([rec[@"status"] integerValue]==0)
                         {
                             
                             [[IAPShare sharedHelper].iap provideContentWithTransaction:trans];
                             NSLog(@"SUCCESS %@",response);
                             NSLog(@"Pruchases %@",[IAPShare sharedHelper].iap.purchasedProducts);
                             
                             char tmp[256] = {0};
                             sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 1);
                             ScriptingCore::getInstance()->evalString(tmp);
                         }
                         else if ([rec[@"status"] integerValue]==21007) {
                             [IAPShare sharedHelper].iap.production = NO;
                             [[IAPShare sharedHelper].iap checkReceipt:data AndSharedSecret:nil  onCompletion:^(NSString *response2, NSError *error2) {
                                
                                 NSDictionary* rec2 = [IAPShare toJSON:response2];
                                 if ([rec2[@"status"] integerValue]==0)
                                 {
                                     [[IAPShare sharedHelper].iap provideContentWithTransaction:trans];
                                     NSLog(@"SUCCESS %@",response2);
                                     NSLog(@"Pruchases %@",[IAPShare sharedHelper].iap.purchasedProducts);
                                     
                                     char tmp[256] = {0};
                                     sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 1);
                                     ScriptingCore::getInstance()->evalString(tmp);
                                     
                                 } else {
                                     NSLog(@"Fail");
                                     char tmp[256] = {0};
                                     sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 3);
                                     ScriptingCore::getInstance()->evalString(tmp);
                                 }
                             }];
                         }
                         else {
                             NSLog(@"Fail");
                             char tmp[256] = {0};
                             sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 4);
                             ScriptingCore::getInstance()->evalString(tmp);
                         }
                     }];
                 }
                 else if(trans.transactionState == SKPaymentTransactionStateFailed) {
                     NSLog(@"Fail");
                     char tmp[256] = {0};
                     sprintf(tmp, "cc.vv.anysdkMgr.onBuyIAPResp(%d)", 5);
                     ScriptingCore::getInstance()->evalString(tmp);
                 }
             }];//end of buy product
         }
     }];
}

#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    /*
     Free up as much memory as possible by purging cached data objects that can be recreated (or reloaded from disk) later.
     */
    cocos2d::Director::getInstance()->purgeCachedData();
}


- (void)dealloc {
    [super dealloc];
}


@end

