# AweSDK for WebGL

Import the following three dynamic libraries into the project
- `awesdk-1.0.0.tgz`
- `awesdk-core-1.0.0.tgz`
- `awesdk-databridge-1.0.0.tgz`

## Environment Setup
Create a `Setup` method. The method will create a `Context` object, initialize the SDK environment, and apply the license information. 
- Import the necessary namespaces. For example.

```javascript
import { Color, Context, Vector3 } from 'awesdk-core'
import { IDataBridge, DataExchanger } from "awesdk-databridge";
import { LicenseManager, HumanTimeSlice, Gender, ErrorReporter, BaseInfo, CameraTimeSlice, Timeline, TTSData, Transaction, SceneManager, Human } from 'awesdk'
```

- Create a context and setup the environment. As follows.

```javascript
function setup() {
    const context = new Context();
    Environment.setup(context);
}
```

## Setup the data bridge

The SDK uses sockets to communicate data, so we need to setup a socket data bridge.

```javascript
class MyDataBridge extends IDataBridge {
    constructor(context) {
        super(context);
        this.mContext = context;
    }

    sendData(data) {
        //  SendMessageToUnity, this method is JS to Unity communicate data.
        window.MyUnityInstance.Module.SendMessageToUnity(data);
    }
}

function setupDataBridge(context) {
    const exchanger = DataExchanger.getInstance(context);
    exchanger.setDataBridge(new MyDataBridge(context));
    //  ReceiveMessage, this method is Unity to JS communicate data.
    window.MyUnityInstance.Module.ReceiveMessage((msg) => {
        exchanger.didReceiveMessage(msg);
    });
}
```

## Setup License

Developers need to apply for `AppKey` and `AppSecret` in the open platform and set them to the SDK before they can use the functions of the SDK.

```javascript
function setupLicense() {
    const licenseManager = LicenseManager.getInstance(context);
    //  Please replace the AppKey and AppSecret.
    licenseManager.appKey = `{YourAppKey}`;
    licenseManager.appSecret = `{YourAppSecret}`;
}
```

**Note: Developers need to replace the `[YourAppKey]` and `[YourAppSecret]` in the sample code with the `AppKey` and `AppSecret` values that have been applied**. 

## Setup resource paths

The SDK relies on resources such as animations, dresses, etc., so we need to setup cache paths and resource paths so that the SDK can load resources and control caching.

```javascript
function setupResources() {
    const resourceManager = ResourceManager.getInstance(context);
    //  Set the cache directory.
    resourceManager.setCacheDirectory(Config.cachePath);
    //  Add a resource directory, you can add more than one.
    resourceManager.addResourceDirectory(Config.resourcePath);
}
```
Developers need to extract the downloaded resource package to the resource path provided above by themselves.

## Load Human

Once the above environment is running, we call the interface `LoadHuman(context)` for loading a human in the last step. 

```javascript
function loadHuman(context) {
    // Quickly build a human using information such as gender, face mapping and face target。
    const gender = Gender.Female;
    const faceTarget = "xiaojing/face.target";
    const faceMapping = "xiaojing/face.jpg";
    const baseInfo = new BaseInfo(gender, faceTarget, faceMapping);
    const human = new Human(context, baseInfo);

    // Set target parameters for the human.
    human.setTarget("20003", 1);
    human.setTarget("23002", 0.5);
    human.setTarget("20101", 0.4769);
    human.setTarget("20102", -0.3075);
    human.setTarget("20502", -0.3522);
    human.setTarget("23202", 0.4769);
    human.setTarget("23503", -0.8489);

    // Wear hair, outfits, shoes, etc.
    human.wearHair("cloth/nv_tf_128");
    human.wearOutfits("cloth/nv_up_06", "cloth/nv_tz_117_down");
    human.wearShoes("cloth/nv_shoes_98");

    // Play an animation.
    human.playAnimation("anim/HP_Share");

    // Add the human to the scene.
    const scene = SceneManager.getInstance(context).getCurrentScene();
    scene.addElement(human);
}
```

**Noted that resources such as face mapping, face target, hairs, dresses, animation, etc. should be placed under the resource path in advance**.

Run the program and you will see a digital human in the browser.

------------------

## NOTICE
MetaMakerDeveloper 发布的代码或数字资产（数字人、服装、动作、表情等）以及试用数字人小镜、大黑都属于黑镜科技公司。如需商用，请添加以下二维码联系，谢谢！

For the codes, digital assets (including but not limited to digital human, clothing, animations, expressions, etc.) and trial digital human (e.g. xiaojing, dahei, etc.) released by MetaMakerDeveloper are all belong to Heijing Technology Company. For commercial use, please scan the following QR code to contact us, thank you!

![20220826-094251](https://user-images.githubusercontent.com/110818144/186798509-1deb2c8a-27ce-4d41-9a89-ac2541fc1825.jpg)
