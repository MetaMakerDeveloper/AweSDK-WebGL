import { IDataBridge, DataExchanger } from "awesdk-databridge";
import { Environment } from "awesdk";

function unityShowBanner(context, msg, type) {
    function updateBannerVisibility() {
        context.warningBanner.style.display = context.warningBanner.children.length ? "block" : "none";
    }
    var div = document.createElement("div");
    div.innerHTML = msg;
    context.warningBanner.appendChild(div);
    if (type == "error") div.style = "background: red; padding: 10px;";
    else {
        if (type == "warning") div.style = "background: yellow; padding: 10px;";
        setTimeout(function () {
            context.warningBanner.removeChild(div);
            updateBannerVisibility();
        }, 5000);
    }
    updateBannerVisibility();
}
var buildUrl = "./data";
var loaderUrl = buildUrl + "/buildWebGL.loader.js";
var config = {
    dataUrl: buildUrl + "/buildWebGL.data",
    frameworkUrl: buildUrl + "/buildWebGL.framework.js",
    codeUrl: buildUrl + "/buildWebGL.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "avatarworks",
    productName: "QuickmovStudio",
    productVersion: "2022-05-06 10:57:33",
};

function checkBrowserCompatibility(context) {
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        var meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content =
            "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes";
        document.getElementsByTagName("head")[0].appendChild(meta);
        context.container.className = "unity-mobile";

        context.canvas.style.width = window.innerWidth + "px";
        context.canvas.style.height = window.innerHeight + "px";

        unityShowBanner(context, "WebGL builds are not supported on mobile devices.");
    } else {
        context.canvas.style.width = "1280px";
        context.canvas.style.height = "720px";
    }
    context.loadingBar.style.display = "block";
}

class MyDataBridge extends IDataBridge {
    constructor(context) {
        super(context);
        this.mContext = context;
    }

    sendData(data) {
        window.MyUnityInstance.Module.SendMessageToUnity(data);
    }
}

export class AweSDK {
    constructor() {
        this.loadState = `not-started`;
    }

    setMountingNodes(config) {
        const defaultNodes = {
            container: "#unity-container",
            // canvas: "#unity-canvas",
            loadingBar: "#unity-loading-bar",
            progressBarFull: "#unity-progress-bar-full",
            fullscreenButton: "#unity-fullscreen-button",
            warningBanner: "#unity-warning",
            ...config,
        };

        this.container = document.querySelector(defaultNodes.container);
        // this.canvas = document.querySelector(defaultNodes.canvas);
        this.loadingBar = document.querySelector(defaultNodes.loadingBar);
        this.progressBarFull = document.querySelector(defaultNodes.progressBarFull);
        this.fullscreenButton = document.querySelector(defaultNodes.fullscreenButton);
        this.warningBanner = document.querySelector(defaultNodes.warningBanner);

        this.canvas = document.createElement("canvas");
        this.canvas.id = "unity-canvas";
        this.container.appendChild(this.canvas);
        checkBrowserCompatibility(this);
    }

    setViewportRect(x, y, width, height) {
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.canvas.style.left = `${x}px`;
        this.canvas.style.top = `${y}px`;
    }

    setBackgroundColor(color) {
        this.canvas.style.background = color;
    }

    setSceneBackgroundColor(...color) {
        window.MyUnityInstance.Module['glClearColor'] = [...color];
    }

    load(callback) {
        if (this.loadState != "not-started") throw new Error("已经加载过Unity引擎，请勿重复加载");
        this.loadState = "loading";
        var script = document.createElement("script");
        script.src = loaderUrl;

        window.MyUnityInstance = null;
        script.onload = () => {
            createUnityInstance(this.canvas, config, (progress) => {
                this.progressBarFull.style.width = 100 * progress + "%";
            })
                .then((unityInstance) => {
                    if (unityInstance == null) {
                        this.loadState = "not-started";
                        callback(false);
                        return;
                    }
                    window.MyUnityInstance = unityInstance;
                    // this.loadingBar.style.display = "none";
                    this.fullscreenButton.onclick = () => {
                        unityInstance.SetFullscreen(1);
                    };

                    window.MyUnityInstance.Module.ReceiveSignal((signal) => {
                        if (signal == "onStart") {
                            this.loadState = "finish";
                            callback(true);
                        }
                    });
                })
                .catch((message) => {
                    alert(message);
                });
        };
        document.body.appendChild(script);
    }

    unload(context) {
        Environment.tearDown(context);
        AweSDK.getUnityObject().Quit().then(() => {
            this.container.removeChild(this.canvas);
        });
        window.MyUnityInstance = null;
    }

    setup(context) {
        Environment.setup(context);
        const exchanger = DataExchanger.getInstance(context);
        exchanger.setDataBridge(new MyDataBridge(context));

        window.MyUnityInstance.Module.ReceiveMessage((msg) => {
            exchanger.didReceiveMessage(msg);
        });

        // const diffTime = 30;
        // let lastTime = Date.now();
        // let nowTime = 0;
        // (function frameCallback() {
        //     nowTime = Date.now();
        //     const dTime = nowTime - lastTime;
        //     if (dTime > diffTime) {
        //         context.update(dTime / 1000);
        //         lastTime = nowTime;
        //     }
        //     requestAnimationFrame(frameCallback);
        // })();
    }
    
    getLoadState() {
        return this.loadState;
    }

    static getUnityObject() {
        return window.MyUnityInstance;
    }
}
