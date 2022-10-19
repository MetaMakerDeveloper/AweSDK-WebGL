import { Color, Context, Vector3 } from 'awesdk-core'
import { LicenseManager, HumanTimeSlice, ErrorReporter, CameraTimeSlice, Timeline, TTSData, Transaction, SceneManager } from 'awesdk'
import * as CryptoJS from 'crypto-js'
import { AweSDK } from './libs/AweSDK'
import { NetWorkHelper } from './libs/NetworkHelper'
import { ResourceHelper } from './libs/ResourceHelper'
import { HumanHelper } from './libs/HumanHelper'

const wrapper = document.getElementById("unity-container");
wrapper.style.width = '960px'
wrapper.style.height = '640px'
const { width, height } = wrapper.getBoundingClientRect();
let aweSDK = new AweSDK();
aweSDK.setMountingNodes({
    container: "#unity-container",
    canvas: "#unity-canvas",
    loadingBar: "#unity-loading-bar",
    progressBarFull: "#unity-progress-bar-full",
    fullscreenButton: "#unity-fullscreen-button",
    warningBanner: "#unity-warning",
});
aweSDK.setViewportRect(100, 100, width, height);
//  设置canvas背景颜色
aweSDK.setBackgroundColor('#00000000');
aweSDK.load(loadFinished);

let context;
let myHuman;
async function loadFinished() {
    context = new Context();
    aweSDK.setup(context)
    //  设置场景背景颜色，参数为: rgba，取值范围: 0~1
    //aweSDK.setSceneBackgroundColor(0, 0, 0, 0);

    //  设置AppKey、AppSecret
    const licenseManager = LicenseManager.getInstance(context);
    licenseManager.appKey = `6b2760796632410d8b9f2505e4928b18`;
    licenseManager.appSecret = `f2879a80b30b489b8cd4c88f063fdb3f`;
    //  也可以将AppKey和AppSecret计算Token的操作放在服务器，将计算结果通过下面代码设置到SDK中，达到隐藏AppKey和AppSecret目的
    // licenseManager.auth = `服务器计算结果`;

    //  监听引擎抛出的异常
    ErrorReporter.getInstance(context).listen((msg) => {
        console.error('error reporter :', msg);
    })

    //  下载动作资源
    const animationResult = await ResourceHelper.getInstance(context).loadAnimations([
        'anim/BaseAnim/daiji_nan_huxi_M0',
        'anim/BaseAnim/Anim_daiji_F01'
    ]);
    if (!animationResult)
        console.error('动画资源下载失败');

    //  创建场景
    // const scene = new Scene(context);
    const scene = SceneManager.getInstance(context).switchScene('first');

    //  开启事务
    Transaction.getInstance(context).start();

    //  根据ID，请求MetaMakerStudio上数字人形象
    //  默认角色小静（女）id:92998
    //  默认角色大黑（男）id:92997
    const human = await HumanHelper.getInstance(context).createHumanById('92998');
    if (human == null) {
        console.log('加载人物失败');
        return;
    }
    scene.addElement(human);
    myHuman = human;

    const data = await structTTSData(`今天天气不错,挺风和日丽的`);
    const duration = data.duration;
    if (data.ttsData != null) {
        //  添加人物时间片，设置TTS属性，该属性中duration字段的值应与TTS音频时长一致.
        const humanSlice = new HumanTimeSlice(human);
        humanSlice.setTTS(data.ttsData);
        humanSlice.setDuration(duration);
        humanSlice.setStartTime(0);
        scene.getTimeline().addTimeSlice(humanSlice);
        humanSlice.onInactive(() => {
            console.log("onInactive......... human");
            humanSlice.onInactive(null);
            scene.getTimeline().removeTimeSlice(humanSlice);
        })
    }

    //  添加人物时间片，设置动画属性
    const slice = new HumanTimeSlice(human);
    slice.setStartTime(0);
    slice.setDuration(duration);
    slice.setAnimation(`anim/BaseAnim/Anim_daiji_F01`);
    scene.getTimeline().addTimeSlice(slice);

    //  添加镜头时间片
    scene.getCamera().setPosition(new Vector3(0, 0.5, 8));
    const cameraSlice = new CameraTimeSlice(scene.getCamera())
    cameraSlice.setStartTime(0);
    cameraSlice.setDuration(duration);
    cameraSlice.setPosition(new Vector3(0, 0.5, 8), new Vector3(0, 0.8, 3));
    cameraSlice.onActive((timeOffset) => {
        console.log("onActive.....", timeOffset);
    });
    cameraSlice.onInactive(() => {
        console.log("onInactive......... camera");
        cameraSlice.onInactive(null);
        scene.getTimeline().removeTimeSlice(cameraSlice);
    });
    scene.getTimeline().addTimeSlice(cameraSlice);

    //  提交事务
    Transaction.getInstance(context).commit(() => {
        //  事务执行结束，开始播放
        scene.getTimeline().setLoop(Number.MAX_VALUE);
        scene.getTimeline().play();
    })

    // const animDuration = await ResourceManager.getInstance(context).requestAnimationDuration(`anim/anim_220415_F36`);
    // console.log('animation duration : ', animDuration);
}

async function structTTSData(text) {
    const params = {
        text: text,
        tts_args: `{"voice_name":"智能客服_静静","speed":50,"volume":50}`,
        audio_type: 'wav',
        storage_type: 'cloud'
    }
    const result = await NetWorkHelper.Request(`http://open.metamaker.cn/api/openmm/v1/text_to_anim`, params, LicenseManager.getInstance(context).genAuthString());
    console.log('tts result :', result);
    if (result.err_code == 0) {
        const duration = result.ret.audio_info.audio_duration;
        const id = CryptoJS.enc.Hex.stringify(CryptoJS.MD5(`${params.text}${params.tts_args}${params.audio_type}`));
        const audioUrl = result.ret.audio;
        const audioPath = `/idbfs/resource/${id}.wav`;
        const expressionUrl = result.ret.expression_anim;
        const expressionPath = `/idbfs/resource/${id}_expression.anim`;
        const teethUrl = result.ret.teeth_anim;
        const teethPath = `/idbfs/resource/${id}_teeth.anim`;
        const ttsResources = {}
        ttsResources[audioUrl] = audioPath;
        ttsResources[expressionUrl] = expressionPath;
        ttsResources[teethUrl] = teethPath;
        const ttsResourcesResult = await NetWorkHelper.DownloadFiles(ttsResources);
        if (!ttsResourcesResult)
            console.error('TTS资源下载失败');

        const ttsData = new TTSData();
        ttsData.id = id;
        ttsData.volume = 1;
        ttsData.playMouthAnimation = true;
        ttsData.playFaceAnimation = true;
        ttsData.playAudio = true;
        return { ttsData, duration };
    }
    return null;
}

let interruptTTSData;
(function () {
    addInput('changeHuman', '数字人ID');
    addButton('更换人物', async () => {
        var value = '';
        const nodes = document.getElementsByName('changeHuman');
        if (nodes.length > 0) {
            value = nodes[0].value;
        }
        if (value == null || value == undefined || value.length <= 0 || isNaN(value)) {
            console.log('change human : ', value);
            alert('请输入有效的数字人ID！');
            return;
        }

        await HumanHelper.getInstance(context).refreshHumanById(value);
    });

    //  TTS播放时,点击按钮打断正在播放的内容,打断播放结束后,继续播放原TTS内容
    addButton('打断TTS', async () => {
        //  建议将打断的数据提前准备好,减少打断响应的延迟.注:此处为打断功能演示代码,未提前准备数据
        if (interruptTTSData == null) {
            interruptTTSData = await structTTSData('我们下午没有课,心情也挺好的');
        }
        const data = interruptTTSData;
        const humanSlice = new HumanTimeSlice(myHuman);
        humanSlice.setTTS(data.ttsData);
        humanSlice.setDuration(data.duration);
        humanSlice.setStartTime(0);
        const scene = SceneManager.getInstance(context).getCurrentScene();
        scene.getTimeline().interrupt(humanSlice);
    });

    addButton('保存场景数据', () => {
        const result = SceneManager.getInstance(context).saveData();
        alert(result);
    });

    addButton('重置场景', () => {
        SceneManager.getInstance(context).reset();
    });

    addButton('加载数据', () => {
        const data = '{"first":{"reference":{"Object:0x0000000000000004":{"id":"Object:0x0000000000000004","class":"Camera","data":{"properties":{"position":"Vector3|(0,0.5,8)","rotation":"Vector3|(0,180,0)"},"children":[],"attributes":{}}},"Object:0x0000000000000005":{"id":"Object:0x0000000000000005","class":"Human","data":{"properties":{"gender":"female","face_texture":"tmp/52440327cd9d2ad049e417399caaa951f39b7cfb.jpg","face_target":"tmp/ee1af3ae10dba71a0a5292db52018a5f14350a03.target","body_texture":"","position":"Vector3|(0,0,0)","dress":["cloth/nv_neiyi_03_down","cloth/nv_neiyi_03_up","cloth/nv_tf_159","cloth/nv_shoes_78","cloth/nv_down_02_02","cloth/nv_up_07_01_02"]},"children":[],"attributes":{"wear_items":{"hair":"cloth/nv_tf_159","shoes":"cloth/nv_shoes_78"},"outfits":["cloth/nv_down_02_02","cloth/nv_up_07_01_02"],"targets":{},"underwear":["cloth/nv_neiyi_03_down","cloth/nv_neiyi_03_up"]}}},"Object:0x0000000000000003":{"id":"Object:0x0000000000000003","class":"RootElement","data":{"properties":{},"children":["Object:0x0000000000000004","Object:0x0000000000000005"],"attributes":{}}},"Object:0x0000000000000006":{"id":"Object:0x0000000000000006","class":"HumanTimeSlice","data":{"start_time":"Float|0","duration":"Float|10","enabled":"Bool|true","tags":[],"element":"Object:0x0000000000000005","properties":{"animation":"anim/BaseAnim/Anim_daiji_F01"}}},"Object:0x0000000000000008":{"id":"Object:0x0000000000000008","class":"HumanTimeSlice","data":{"start_time":"Float|0","duration":"Float|10","enabled":"Bool|true","tags":[],"element":"Object:0x0000000000000005","properties":{"tts":{"tts_id":"acd298cfe16db07b8b6c7434229b8612","tts_volume":"Float|1","tts_play_mouth_anim":"Bool|true","tts_play_face_anim":"Bool|true","tts_play_audio":"Bool|true"}}}},"Object:0x0000000000000002":{"id":"Object:0x0000000000000002","class":"Timeline","data":{"time_slices":["Object:0x0000000000000006","Object:0x0000000000000008"]}}},"id":"Object:0x0000000000000001","class":"Scene","data":{"root":"Object:0x0000000000000003","timeline":"Object:0x0000000000000002","camera":"Object:0x0000000000000004"}}}';
        const result = SceneManager.getInstance(context).loadData("domain", data);
        const scene = SceneManager.getInstance(context).switchScene('first');
        scene.getTimeline().setLoop(Number.MAX_VALUE);
        scene.getTimeline().play();
    });

    addButton('释放引擎', () => {
        aweSDK.unload(context);
        ResourceHelper.resetInstance();
        myHuman = null;
        context = null;
        aweSDK = null;
    });

    addButton('重新加载引擎', () => {
        aweSDK = new AweSDK();
        aweSDK.setMountingNodes({
            container: "#unity-container",
            canvas: "#unity-canvas",
            loadingBar: "#unity-loading-bar",
            progressBarFull: "#unity-progress-bar-full",
            fullscreenButton: "#unity-fullscreen-button",
            warningBanner: "#unity-warning",
        });
        aweSDK.setViewportRect(100, 100, width, height);
        aweSDK.setBackgroundColor('#FF000000')
        aweSDK.load(loadFinished);
    });
})()

function addButton(name, callback) {
    var btn = document.createElement("BUTTON");
    btn.onclick = callback
    var t = document.createTextNode(name);
    btn.appendChild(t);
    btn.setAttribute('style', 'margin-left: 10px; margin-right: 10px');
    document.body.appendChild(btn)
}

function addInput(name, placeholder) {
    var input = document.createElement("input");
    input.setAttribute('name', name);
    input.setAttribute('placeholder', placeholder);
    input.setAttribute('style', 'width: 60px');
    document.body.appendChild(input);
}