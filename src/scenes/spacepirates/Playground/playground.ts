import { Scene, Vector3, Engine, FreeCamera, DirectionalLight, Color3, GlowLayer, ImageProcessingConfiguration, Color4, Nullable } from "@babylonjs/core";
import { Assets } from "./Assets";
import { States } from "./States/States";
import { State } from "./States/State";
import { GameState } from "./States/GameState";
import { GameSession } from "./States/GameSession";
import { Diorama } from "./States/Diorama";
import { Main } from "./States/Main";
import { Parameters } from './Parameters';

class Playground {
    /*
    总的来说，这段代码主要实现了以下功能：
    
    创建了一个Babylon.js场景对象；
    配置了场景颜色、深度模板自动清除、禁止指针拾取功能、添加方向光源进行照明、设置图像处理配置对象等；
    创建了一个自由相机并添加到场景中；
    创建了Assets对象用于加载资源并创建 GameState 和 Diorama 对象；
    返回场景对象。
    需要注意的是，该函数需要传递三个参数：引擎对象、资源的根URL、画布(canvas)元素。该函数创建了多个对象，并完成了很多细节性工作，是一个比较完整的场景初始化函数。
    */
    public static CreateScene(engine: Engine, assetsHostUrl: string, canvas: HTMLCanvasElement): Scene {

        // This creates a basic Babylon Scene object (non-mesh)
        // 创建一个基本的 Babylon 场景对象（非网格）
        var scene = new Scene(engine);

        //scene.autoClear = false;
        // 设置场景的背景颜色和深度模板自动清除
        scene.clearColor = new Color4(0, 0, 0, 1);
        scene.autoClearDepthAndStencil = false;

        // 禁止场景的指针拾取功能
        scene.skipPointerMovePicking = false;//表示启用指针移动拾取功能，即当鼠标移动时，场景中的物体会被拾取并触发相应的事件。
        scene.pointerUpPredicate = () => false;//表示禁用指针抬起事件，即当鼠标抬起时，不会触发任何事件。
        scene.pointerDownPredicate = () => false;//同理，禁用指针按下事件。
        scene.pointerMovePredicate = () => false;//禁用指针移动事件。
        scene.pointerMoveTrianglePredicate = () => false;//禁用指针移动三角形事件。

        // lighting
        // 添加方向光源来进行照明，设置漫反射颜色和亮度
        const dirLight = new DirectionalLight("dirLight", new Vector3(0.47, -0.19, -0.86), scene);
        // (漫反射)为对象提供基本的颜色
        dirLight.diffuse = Color3.FromInts(255, 251, 199);
        // 设置发光网格亮度
        dirLight.intensity = 1.5;

        // material image processing
        // 添加图像处理配置对象并设置曝光度，色调映射类型
        const imageProcessing = scene.imageProcessingConfiguration;
        imageProcessing.toneMappingEnabled = true;//启用色调映射，这是一种处理高动态范围图像的技术，可以将其转换为低动态范围图像以在标准显示器上显示。
        imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;//设置色调映射类型为ACES，这是一种广泛使用的色调映射算法，可以提供更好的色彩保真度和动态范围
        // 曝光度。曝光度越高，图像就越明亮，反之则越暗。这个属性可以用来调整图像的亮度
        imageProcessing.exposure = 2.0;

        // glow
        // 创建 GlowLayer 对象用于添加发光效果
        const glowLayer = new GlowLayer("glowLayer", scene);
        // 设置发光网格亮度
        glowLayer.intensity = 1.2;

        // This creates and positions a free camera (non-mesh)
        // 创建自由相机，并添加到场景中
        var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

        // 创建 Assets 对象，加载资源并创建 GameState 和 Diorama 对象
        new Assets(scene, assetsHostUrl, (assets) => {
            GameState.gameSession = new GameSession(assets, scene, canvas, glowLayer);
            Main.diorama = new Diorama(scene, assets, engine, glowLayer);
            States.photoMode.assets = assets;
            State.setCurrent(States.main);
            // jump directly in the game
            //State.setCurrent(States.gameState);
        },
            (assets) => {
                if (Main.playButton) {
                    Main.playButton.isVisible = true;
                }
            });
        return scene;
    }
}

export function CreatePlaygroundScene(engine: Engine, assetsHostUrl: string, canvas: HTMLCanvasElement): Scene {
    return Playground.CreateScene(engine, assetsHostUrl, canvas);
}
