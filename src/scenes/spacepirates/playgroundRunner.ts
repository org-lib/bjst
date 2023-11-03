import { Engine, MorphTargetManager, NativeEngine, WebGPUEngine, DefaultLoadingScreen } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { CreatePlaygroundScene } from "./Playground/playground";
import { Main } from "./Playground/States/Main";
import { Parameters } from "./Playground/Parameters";
import { GuiFramework } from "./Playground/GuiFramework";

export const useWebGPU = false;
export var useNative = false;
declare var _native: any;

export interface InitializeBabylonAppOptions {
    canvas: HTMLCanvasElement;
    assetsHostUrl?: string;
    /*
    加上问号表示为可选属性；定义接口（ InitializeBabylonAppOptions ）时设置的属性不是必须要在使用该接口的对象中实现的，而是可选的，如果是叹号!，则为必选项
    */
}

export async function initializeBabylonApp(options: InitializeBabylonAppOptions) {

    Parameters.initialize();

    useNative = !!_native;

    // 判断是否使用 native 引擎，如果使用，则设置 assetsHostUrl 为 "app://"
    if (useNative) {
        console.log("--options.assetsHostUrl=" + options.assetsHostUrl);
        options.assetsHostUrl = "app://";
    } else {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        // 如果未提供 assetsHostUrl 参数，则将其设置为当前URL，并根据URL参数设置
        // Parameters.starfieldHeavyShader 的值。
        options.assetsHostUrl = window.location.href.split('?')[0];
        if (!options.assetsHostUrl) {
            options.assetsHostUrl = "";
        }
        Parameters.starfieldHeavyShader = urlParams.get("heavyStarfield")! === "yes";
    }
    if (options.assetsHostUrl) {
        console.log("Assets host URL: " + options.assetsHostUrl!);
    } else {
        console.log("No assets host URL provided");
    }

    // 如果不使用 native 引擎，则创建画布并设置默认尺寸
    if (!useNative) {
        console.log("--options.canvas=" + options.canvas);
        if (!options.canvas) {
            console.log("--!options.canvas=" + options.canvas);
            document.body.style.width = "100%";
            document.body.style.height = "100%";
            document.body.style.margin = "0";
            document.body.style.padding = "0";
            const div = document.createElement("div");
            div.style.width = "100%";
            div.style.height = "100%";
            document.body.appendChild(div);

            const canvas = document.createElement("canvas");
            canvas.id = "renderCanvas";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.display = "block";
            canvas.oncontextmenu = () => false;
            div.appendChild(canvas);
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            options.canvas = canvas;
        }
    } else {
        (options as any).canvas = {};
        MorphTargetManager.EnableTextureStorage = false;//纹理存储的优化功能
    }

    const canvas = options.canvas;


    let engine: Engine | WebGPUEngine | NativeEngine;
    if (useNative) {
        console.log("--useNative.NativeEngine()");
        engine = new NativeEngine();
    } else if (useWebGPU) {
        console.log("--useWebGPU.WebGPUEngine()");
        engine = new WebGPUEngine(canvas, {
            deviceDescriptor: {
                requiredFeatures: [
                    "depth-clip-control",
                    "depth32float-stencil8",
                    "texture-compression-bc",
                    "texture-compression-etc2",
                    "texture-compression-astc",
                    "timestamp-query",
                    "indirect-first-instance",
                ],
            },
        });
        await (engine as WebGPUEngine).initAsync();
        /*
        设置引擎的兼容模式。当设置为false时，引擎将在WebGPU上以最佳性能运行。
        如果设置为true，则引擎将尝试使用WebGL或Canvas2D等旧技术来支持不支持WebGPU的设备，但可能会牺牲性能。
        默认值为true。在这种情况下，该行代码意味着禁用兼容模式并启用最佳性能。
        */
        engine.compatibilityMode = false;
    } else {
        console.log("--badOS.iPad-iPhone");
        const badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);
        engine = new Engine(canvas, !badOS);
    }

    // 在window上定义对象 engine
    // 更多解释参考：https://developer.mozilla.org/zh-CN/docs/Web/API/Window
    // window 对象表示一个包含 DOM 文档的窗口
    /*
    这行代码的作用是将变量engine赋值给全局对象window的属性，即将engine变量变为全局变量。
    其中，as any是类型断言，将window对象的类型强制转换为any类型，以避免编译器报错。
    这样做的目的是为了在其他地方也可以方便地使用engine变量，而不需要在每个需要使用它的地方都进行引用或传递参数。
    在使用时，可以直接通过engine来访问和操作它。
    */
    (window as any).engine = engine;

    // 创建场景，更新屏幕比例，启动渲染循环，并在窗口大小改变时调整画布和引擎大小。叹号!放在后边表示 不传参数或者传入undefined 时会报错
    const scene = CreatePlaygroundScene(engine, options.assetsHostUrl!, canvas);

    //隐藏logo渲染
    var loadingScreen = new DefaultLoadingScreen(canvas);
    engine.hideLoadingUI();
    engine.loadingScreen = loadingScreen
    DefaultLoadingScreen.DefaultLogoUrl = "/src/assets/vue.svg"
    //隐藏logo渲染 end
    GuiFramework.updateScreenRatio(engine);
    engine.runRenderLoop(() => {
        scene.render();
    });
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize();
        GuiFramework.updateScreenRatio(engine);
    });
}

