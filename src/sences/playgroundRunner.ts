import { Engine, MorphTargetManager, NativeEngine, WebGPUEngine, DefaultLoadingScreen } from "@babylonjs/core";
import { CreatePlaygroundScene } from "./Playground/playground";

export const useWebGPU = false;
export var useNative = false;
declare var _native: any;

export interface InitializeBabylonAppOptions {
    canvas: HTMLCanvasElement;
    assetsHostUrl?: string;
}

export async function initializeBabylonApp(options: InitializeBabylonAppOptions) {

    useNative = !!_native;

    // 判断是否使用 native 引擎，如果使用，则设置 assetsHostUrl 为 "app://"
    if (useNative) {
        console.log("useNative--options.assetsHostUrl=" + options.assetsHostUrl);
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
    }
    if (options.assetsHostUrl) {
        console.log("Assets host URL: " + options.assetsHostUrl!);
    } else {
        console.log("No assets host URL provided");
    }

    // 如果不使用 native 引擎，则创建画布并设置默认尺寸
    if (!useNative) {
        console.log("!useNative--options.canvas=" + options.canvas);
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

    (window as any).engine = engine;

    const scene = CreatePlaygroundScene(engine, options.assetsHostUrl!, canvas);

    //隐藏logo渲染
    var loadingScreen = new DefaultLoadingScreen(canvas);
    engine.hideLoadingUI();
    engine.loadingScreen = loadingScreen
    DefaultLoadingScreen.DefaultLogoUrl = "/src/assets/vue.svg"
    //隐藏logo渲染 end
    engine.runRenderLoop(() => {
        scene.render();
    });
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.resize();
    });
}

