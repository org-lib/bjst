import { Scene, Engine, FreeCamera, Vector3, Color4, MeshBuilder, Light, HemisphericLight, SceneLoader, TargetCamera, Nullable, Mesh, AbstractMesh, TransformNode, GlowLayer } from "@babylonjs/core";
import { Assets } from "../Assets";
import { AdvancedDynamicTexture, Image, Rectangle } from "@babylonjs/gui";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { Ship } from "../Ship";

/*
这段代码实现了一个Diorama类，用于创建一个太空场景。主要的成员包括：

- _scene: Babylon.js场景对象。
- _camera: 相机对象，用于渲染场景。
- _cameraDummy: 辅助相机对象，用于渲染GUI。
- _localTime: 本地时间，用于控制相机移动。
- _start, _end: 相机移动的起点和终点。
- _image: GUI中的矩形对象。
- _enabled: 是否启用Diorama。
- _ship: 太空船模型对象。
在构造函数中，首先创建了相机对象和辅助相机对象，并将场景的背景色设置为黑色。然后通过传入的 assets 参数创建了太空船模型，并对其进行了一些调整，如缩放和关闭护盾。
最后添加了一个回调函数，用于控制相机移动（onBeforeRenderObservable）。
_createGUI()方法用于创建GUI中的矩形对象，并将其添加到AdvancedDynamicTexture中。_destroyGUI()方法用于销毁GUI中的矩形对象。
setEnable()方法用于启用或禁用Diorama。如果启用了Diorama，则将相机设置为活动相机，并启用太空船模型和GUI。如果禁用了Diorama，则将相机设置为默认相机，并禁用太空船模型和GUI。
*/
export class Diorama {
    private _scene: Scene;
    private _camera: TargetCamera;
    private _cameraDummy: TargetCamera;
    private _localTime: number = -10000;
    private _start: Vector3 = new Vector3();
    private _end: Vector3 = new Vector3();
    private _image: Nullable<Rectangle> = null;
    private _enabled: boolean = false;
    private _ship: Nullable<AbstractMesh> = null;;

    /*
    这段代码是一个构造函数，它创建了一个相机和一个星空场景，并将相机添加到场景中。除此之外，它还对 assets 中的一些元素进行处理。
    具体来说，这段代码包含以下操作：
    1. 创建一个 FreeCamera 对象，并设置其位置和目标点；
    2. 创建另一个 FreeCamera 对象，命名为 _cameraDummy, 位置在原点，用于后面的渲染处理；
    3. 将 _cameraDummy 的 layerMask 设置为 0x10000000，表示仅在第31层渲染该相机的内容；
    4. 设置场景的背景颜色为黑色；
    5. 将 _camera 设置为活动相机，并将 _camera 和 _cameraDummy 都设置为活动相机，以便于后续渲染；
    6. 如果 assets 中存在 valkyrie 对象，则克隆它并对其进行处理。处理包括缩放、禁用防护罩、启动发动机和荧光效果等；
    7. 如果 assets 中存在 starfield 对象，则设置它的可视性为1，即可见；
    8. 注册一个 onBeforeRenderObservable 事件，在每一帧渲染前执行自定义的函数，进行相机移动、图片淡入淡出等其他逻辑。
    使用时，需要提供一个 scene（Scene）、assets（Assets）、engine（Engine）和 glowLayer（GlowLayer）四个参数，其中 scene 表示要显示的场景对象，assets 表示该场景中需要用到的资源，engine 表示使用的渲染引擎，glowLayer 表示用于产生荧光效果的 GlowLayer 对象。最后调用该构造函数即可创建相机和星空场景。
    */
    constructor(scene: Scene, assets: Assets, engine: Engine, glowLayer: GlowLayer) {
        this._scene = scene;
        this._camera = new FreeCamera("camera1", new Vector3(0, 10, 0), this._scene);
        this._camera.setTarget(new Vector3(0, 0, 0));
        this._cameraDummy = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        this._cameraDummy.layerMask = 0x10000000;//图层掩码使用 32 位的二进制数来表示。每一位（bit）对应一个图层。如果某一位的值为 1，则表示相机会渲染该图层；如果某一位的值为 0，则表示相机不会渲染该图层。
        scene.clearColor = new Color4(0, 0, 0, 1);
        scene.activeCamera = this._camera;
        scene.activeCameras = [this._camera, this._cameraDummy];
        var _this = this;

        if (assets.valkyrie) {
            this._ship = assets.valkyrie.clone("valkyrieDiorana", null);
            if (this._ship) {
                this._ship.scaling.scaleInPlace(100);
                this._ship.getChildTransformNodes(false).forEach((m: TransformNode) => {
                    if (m.name.endsWith("valkyrieShield_mesh")) {
                        m.setEnabled(false);
                    }
                });
                Ship.HandleThrustersShield(assets, null, this._ship, true, 0, glowLayer);
            }
        }
        if (assets.starfield) {
            assets.starfield.visibility = 1;
        }
        this._scene.onBeforeRenderObservable.add(() => {/*用于添加一个回调函数，在每次渲染之前执行。在这段代码中，回调函数用于控制相机的移动，实现了太空场景的动态效果。
            每次渲染之前，回调函数会更新相机的位置和方向，使得相机看起来像是在太空中自由移动。*/
            if (!this._enabled) {
                return;
            }

            this._localTime += this._scene.getEngine().getDeltaTime();//将时间增加一个deltaTime，deltaTime是上一帧和当前帧之间的时间差。
            if (this._localTime > 4000) {//如果经过的时间超过了4000毫秒，就会重新计算相机的起点和终点位置，并将时间重置为0。
                const ng = Math.random() * Math.PI * 2;//1. 生成一个随机的角度（ng），并计算出对应的起始位置（_start）。
                this._start.set(Math.cos(ng), Math.random() - 0.5, Math.sin(ng));
                this._start.y = Math.max(Math.abs(this._start.y), 0.2) * Math.sign(this._start.y);

                this._camera.setTarget(new Vector3(0, 0, 0));
                this._end.copyFrom(this._start);
                this._end.x += Math.random() * 0.1 - 0.05;
                this._end.y += Math.random() * 0.1 - 0.05;
                this._end.z += Math.random() * 0.1 - 0.05;
                this._start.scaleInPlace(14 + Math.random() * 4);
                this._end.scaleInPlace(14 + Math.random() * 4);
                this._localTime = 0;
            }
            /*
            这些随机数的含义是用来控制相机的起点和终点位置的。14 + Math.random() * 4 表示相机的起点和终点位置在一个以原点为中心的球体上，
            半径在 14 到 18 之间随机分布，而 Math.random() * 0.1 - 0.05 则表示对相机的终点位置进行微小的随机扰动，使得相机运动的轨迹更加自然。
            */

            const t = this._localTime / 4000;//计算当前的时间比例，即经过的时间除以总时间。
            if (this._image) {
                if (t < 0.25) {
                    this._image.alpha = 1 - t * 4;
                }
                else if (t > 0.75) {
                    this._image.alpha = (t - 0.75) * 4;
                }
            }
            /*
            Vector3.LerpToRef(from, to, amount, result) 是 Babylon.js 中的一个函数，它用于计算从一个向量（from）到另一个向量（to）之间插值。这个函数会将结果存储在 result 向量中。
            其中，参数 amount 表示插值因子，取值范围为 0.0 到 1.0，表示从 from 向量开始的百分比距离到 to 向量的位置。当 amount = 0.0 时，结果等于 from 向量；当 amount = 1.0 时，结果等于 to 向量。
            通过调整 amount 的取值可以获得两个向量之间任意位置的插值结果。例如，当 amount = 0.5 时，结果为两个向量的中点坐标。
            使用该函数可以实现平滑地移动或过渡对象在场景中的位置、旋转和缩放等变换效果。
            */
            Vector3.LerpToRef(this._start, this._end, t, this._camera.position);
            this._camera.setTarget(new Vector3(0, 0, 0));
        });
    }
    /*
    这段代码是构造函数，用于初始化场景中的相机、星空背景和飞船模型，并为场景添加一个 `onBeforeRenderObservable` 观察者函数，在每帧渲染前更新相机位置和旋转角度。
    具体逐行解释如下：
    - `constructor(scene: Scene, assets: Assets, engine: Engine, glowLayer: GlowLayer) { ... }`: 构造函数，接受四个参数：`scene` 表示场景对象；`assets` 表示资源对象；`engine` 表示引擎对象；`glowLayer` 表示辉光层对象。
    - `this._scene = scene;`: 将传入的 `scene` 对象保存到 `_scene` 属性中。
    - `this._camera = new FreeCamera("camera1", new Vector3(0, 10, 0), this._scene);`: 创建一个自由摄像机对象，并将其保存到 `_camera` 属性中。
    - `this._camera.setTarget(new Vector3(0, 0, 0));`: 将相机的视点目标设置为原点。
    - `this._cameraDummy = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);`: 创建一个名称为 "camera1" 的自由摄像机对象，并将其保存到 `_cameraDummy` 属性中。
    - `this._cameraDummy.layerMask = 0x10000000;`: 将 `_cameraDummy` 控制的图层掩码设置为 0x10000000。
    - `scene.clearColor = new Color4(0, 0, 0, 1);`: 将场景的背景色设置为黑色和不透明度为 1。
    - `scene.activeCamera = this._camera;`: 将 `_camera` 设为场景的当前活动相机。
    - `scene.activeCameras = [this._camera, this._cameraDummy];`: 将 `_camera` 和 `_cameraDummy` 设置为场景的当前活动相机数组。
    - `if (assets.valkyrie) { ... }`: 如果资源对象中有名为 "valkyrie" 的模型，则执行 if 语句块中的代码。
    - `this._ship = assets.valkyrie.clone("valkyrieDiorana", null);`: 克隆名为 "valkyrie" 的模型，并将其保存到 `_ship` 属性中。
    - `if (this._ship) {...}`: 如果 `_ship` 属性存在，则执行 if 语句块中的代码。
    - `this._ship.scaling.scaleInPlace(100);`: 将 `_ship` 模型缩放 100 倍。
    - `this._ship.getChildTransformNodes(false).forEach((m: TransformNode) => {...});`: 遍历 `_ship` 模型中的所有子树节点，并对其中的每个节点执行指定的函数。
    - `if (m.name.endsWith("valkyrieShield_mesh")) {...}`: 如果节点名称以 "valkyrieShield_mesh" 结尾，则执行 if 语句块中的代码。
    - `m.setEnabled(false);`: 将节点的启用状态设置为 false。
    - `Ship.HandleThrustersShield(assets, null, this._ship, true, 0, glowLayer);`: 调用 `Ship.HandleThrustersShield` 函数，为模型添加推进器和护盾。
    - `if (assets.starfield) { assets.starfield.visibility = 1; }`: 如果资源对象中有名为 "starfield" 的模型，则将其可见性设置为 1。
    - `this._scene.onBeforeRenderObservable.add(()=>{ ... });`: 向 `_scene` 对象的 `onBeforeRenderObservable` 观察者数组添加一个函数，在渲染每帧前更新相机位置和旋转角度。
    - `if (!this._enabled) { return; }`: 如果 `this._enabled` 属性不存在或为 false，则直接返回。
    - `this._localTime += this._scene.getEngine().getDeltaTime();`: 将 `_localTime` 属性增加当前场景引擎的帧间隔时间。
    - `if (this._localTime > 4000) {...}`: 如果 `_localTime` 属性超过 4000 毫秒，则执行 if 语句块中的代码。
    - `const ng = Math.random() * Math.PI * 2;`: 生成随机数并赋值给变量 `ng`。
    - `this._start.set(Math.cos(ng), Math.random() - 0.5, Math.sin(ng));`: 将 `_start` 向量设置为以 `ng` 为参数的极坐标的笛卡尔坐标表示。
    - `this._start.y = Math.max(Math.abs(this._start.y), 0.2) * Math.sign(this._start.y);`: 将 `_start` 向量的 y 分量限制在 [-0.5, 0.5] 之间。
    - `this._camera.setTarget(new Vector3(0, 0, 0));`: 将相机的视点目标设置为原点。
    - `this._end.copyFrom(this._start);`: 将 `_start` 向量的值复制到 `_end` 向量中。
    - `this._end.x += Math.random() * 0.1 - 0.05;`: 将 `_end` 向量的 x 分量增加一个 [-0.025, 0.025] 的随机值。
    - `this._end.y += Math.random() * 0.1 - 0.05;`: 将 `_end` 向量的 y 分量增加一个 [-0.025, 0.025] 的
    */

    /*
    这段代码是一个私有方法，用于在 AdvancedDynamicTexture 上创建 GUI 控件。
    
    具体来说，它完成以下操作：
    1. 创建一个名为 _image 的矩形控件；
    2. 将 _image 的背景颜色设置为黑色，文本颜色设置为透明；
    3. 将 _image 的高度和宽度都设置为1，即默认大小；
    4. 将 _image 设置为可见状态，并将透明度设置为1；
    5. 将 _image 添加到 adt（AdvancedDynamicTexture）中，即在屏幕上显示；
    6. 在控制台输出 "gui created"。
    使用时需要提供一个 AdvancedDynamicTexture 对象 adt，并调用该私有方法来创建 GUI 控件。其中，矩形控件的具体样式和属性可以根据实际需求进行修改。
    */
    private _createGUI(adt: AdvancedDynamicTexture) {
        this._image = new Rectangle("img");
        this._image.background = "black";
        this._image.color = "transparent";
        this._image.height = 1;
        this._image.width = 1;
        this._image.isVisible = true;
        this._image.alpha = 1;
        adt.addControl(this._image);
        console.log("gui created\n");
    }

    private _destroyGUI() {
        if (this._image) {
            this._image.dispose();
            console.log("gui destroyed\n");
        }
    }

    public setEnable(adt: Nullable<AdvancedDynamicTexture> = null) {
        const enabled = adt != null;
        if (this._enabled != enabled) {
            this._enabled = enabled;
            this._localTime = 10000;

            if (enabled) {
                this._scene.activeCamera = this._camera;
                this._scene.activeCameras = [this._camera, this._cameraDummy];
                this._ship?.setEnabled(true);
                this._createGUI(adt);
            } else {
                this._destroyGUI();
                this._ship?.setEnabled(false);
            }
        }
    }
}