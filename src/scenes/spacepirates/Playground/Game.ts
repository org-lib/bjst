import { Vector3, Scene, Nullable, AbstractMesh, Quaternion, Observer, NodeMaterial, KeyboardInfo, KeyboardEventTypes, Camera, FreeCamera, TargetCamera, GlowLayer } from "@babylonjs/core";
import { ShipCamera } from "./ShipCamera";
import { InputManager } from "./Inputs/Input";
import { MissileManager, MAX_MISSILES } from "./Missile";
import { Ship, ShipManager } from "./Ship";
import { ShotManager } from "./Shot";
import { Assets } from "./Assets";
import { HUD } from './HUD';
import { States } from "./States/States";
import { State } from "./States/State";
import { Parameters } from './Parameters';
import { Recorder } from "./Recorder/Recorder";
import { ExplosionManager } from "./FX/Explosion";
import { SparksEffects } from "./FX/SparksEffect";
import { GamepadInput } from "./Inputs/GamepadInput";
import { TrailManager } from "./FX/Trail";
import { World } from "./World";

export class GameDefinition {
    public humanAllies: number = 0;
    public humanEnemies: number = 0;
    public aiAllies: number = 0;
    public aiEnemies: number = 0;
    public seed: number = 2022;
    public asteroidCount: number = 20;
    public asteroidRadius: number = 1000;
    public humanAlliesLife: number = 100;
    public humanEnemiesLife: number = 100;
    public aiAlliesLife: number = 50;
    public aiEnemiesLife: number = 10;
    public shotDamage: number = 1;
    public missileDamage: number = 20;
    public delayedEnd: number = 0;
    public enemyBoundaryRadius: number = 400;
    public humanBoundaryRadius: number = 800;
}
/*
该代码是使用Babylon.js框架编写的游戏引擎，主要包含以下模块：

1. ShipManager: 管理所有的飞船。创建、删除、更新状态等操作都由此模块负责。
2. MissileManager: 管理所有的导弹。包括导弹的创建和销毁、判断导弹是否击中目标等功能。
3. ShotManager: 管理所有的￥￥。与导弹管理器类似，包括￥￥的创建和销毁、判断￥￥是否击中目标等功能。
4. TrailManager: 管理所有的拖尾效果。
5. InputManager: 管理输入设备的事件，并将其传递给游戏逻辑处理模块。
6. ExplosionManager: 管理所有的爆炸效果。
7. SparksEffects: 管理火花特效的生成、更新、销毁等功能。
8. World: 管理游戏场景中地形和其他元素。
9. HUD: 游戏界面上显示的头顶信息。
10. Recorder: 用于记录游戏过程，并支持回放功能。
游戏引擎的主体是Game类。在构造函数中完成各个模块的初始化，通过 tick() 方法循环更新游戏状态，如控制飞船运动、发射￥￥、更新特效等操作。同时，也包含判断游戏胜利的逻辑。
使用时，需要通过构造函数传入相关参数，如资源文件、场景对象、画布、游戏定义等。然后调用 setTargetSpeed() 方法设置游戏速度倍率，进入游戏循环即可。可以通过 getShipManager() 方法获取飞船管理器等模块的实例，并根据需要调用相应的方法进行更多的控制。
*/
export class Game {
    private _shipManager: ShipManager;
    private _missileManager: MissileManager;
    private _shotManager: ShotManager;
    private _trailManager: TrailManager;
    private _scene: Scene;
    private _inputManager: InputManager;
    private _renderObserver: Nullable<Observer<Scene>> = null;
    private _HUD: Nullable<HUD>;
    private _speed: number = 1;
    private _targetSpeed: number = 1;
    private _recorder: Nullable<Recorder> = null;
    private _explosions: ExplosionManager;
    private _sparksEffects: SparksEffects;
    private _world: World;
    private _hotkeyObservable: Nullable<Observer<KeyboardInfo>> = null;
    private _cameraDummy: TargetCamera;
    public humanPlayerShips: Array<Ship> = new Array<Ship>();
    public activeCameras: Array<Camera> = new Array<Camera>();
    private _delayedEnd: number;
    //private _glowLayer: GlowLayer;

    /*
    这段代码是用 Typescript 语言编写的一个构造函数，它主要是用来初始化游戏对象的各个管理器及相应的参数。下面逐一进行讲解：
    
    1. 初始化场景 `scene` 变量并定义一个 `shootFrame` 变量。
    ```
    constructor(assets: Assets, scene: Scene, canvas: HTMLCanvasElement, gameDefinition: Nullable<GameDefinition>, glowLayer: GlowLayer) {
        this._scene = scene;
    
        var shootFrame = 0;
    ```
    
    2. 根据传入的游戏定义对象 `gameDefinition` ，如果未传入则默认创建一个新的 `GameDefinition` 对象，并指定参数值。然后初始化最大船只数 `MaxShips`。
    ```
    if (!gameDefinition) {
        gameDefinition = new GameDefinition();
        gameDefinition.humanAllies = 1;
        gameDefinition.humanEnemies = 0;
        gameDefinition.aiEnemies = Parameters.enemyCount;
        gameDefinition.aiAllies = Parameters.allyCount;
        console.log("Using default game definition");
    }
    
    const MaxShips = gameDefinition.humanAllies + gameDefinition.humanEnemies + gameDefinition.aiEnemies + gameDefinition.aiAllies;
    ```
    
    3. 分别实例化了 `ShotManager`、`TrailManager`、`MissileManager`、`ShipManager`、`InputManager`、`ExplosionManager`、`SparksEffects` 这几个游戏对象的管理器。
    ```
    this._shotManager = new ShotManager(assets, scene, glowLayer);
    this._trailManager = new TrailManager(scene, assets.trailMaterial ? assets.trailMaterial : new NodeMaterial("empty", scene), MaxShips + MAX_MISSILES);
    this._missileManager = new MissileManager(scene, this._trailManager);
    this._shipManager = new ShipManager(this._missileManager, this._shotManager, assets, this._trailManager, scene, MaxShips, gameDefinition, glowLayer);
    this._inputManager = new InputManager(scene, canvas);
    this._explosions = new ExplosionManager(scene, assets, glowLayer);
    this._sparksEffects = new SparksEffects(scene, assets);
    ```
    
    4. 如果启用了录制功能，则实例化 `Recorder` 对象并开启录制。
    ```
    if (Parameters.recorderActive) {
        this._recorder = new Recorder(this._shipManager, this._explosions, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, Parameters.recordFrameCount);
        this._recorder.setRecordActive(true);
    }
    ```
    
    5. 初始化人类玩家的视角，并将其加入活跃摄像机列表中。
    ```
    this.activeCameras = [];
    for (let i = 0; i < gameDefinition.humanAllies; i++) {
        const ship = this._shipManager.spawnShip(new Vector3(i * 50, 0, -500), Quaternion.Identity(), true, 0);
        if (ship) {
            const camera = new ShipCamera(ship, scene);
            ship.shipCamera = camera
            this.humanPlayerShips.push(ship);
            this.activeCameras.push(camera.getFreeCamera());
        }
    }
    ```
    
    6. 实例化 `World` 对象，并将其分配给当前场景。
    ```
    this._world = new World(assets, scene, gameDefinition, this.activeCameras[0], glowLayer);
    ```
    
    7. 初始化敌人玩家的视角，并将其加入活跃摄像机列表中。
    ```
    for (let i = 0; i < gameDefinition.humanEnemies; i++) {
        const ship = this._shipManager.spawnShip(new Vector3(i * 50, 0, 500), Quaternion.FromEulerAngles(0, Math.PI, 0), true, 1);
        if (ship) {
            const camera = new ShipCamera(ship, scene);
            ship.shipCamera = camera;
            this.humanPlayerShips.push(ship);
            this.activeCameras.push(camera.getFreeCamera());
        }
    }
    ```
    
    8. 创建一个虚拟摄像机，用于处理摄像机切换时的过渡效果，并加入活跃摄像机列表中。
    ```
    this._cameraDummy = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    this._cameraDummy.layerMask = 0x10000000;
    this.activeCameras.push(this._cameraDummy);
    ```
    
    9. 根据活跃摄像机数量进行相应的设置，并将场景的活跃摄像机设置为活跃摄像机列表。
    ```
    const divCamera = 1 / (this.activeCameras.length - 1);
    for (let i = 0; i < (this.activeCameras.length - 1); i++) {
        const camera = this.activeCameras[i];
        camera.viewport.x = i * divCamera;
        camera.viewport.width = divCamera;
    }
    scene.activeCameras = this.activeCameras;
    if (this.humanPlayerShips.length) {
        this._world.ship = this.humanPlayerShips[0];
    }
    ```
    
    10. 分别生成人类玩家和敌人玩家的飞船对象，加入到游戏场景中。
    ```
    for (let i = 1; i <= gameDefinition.aiAllies; i++) {
        this._shipManager.spawnShip(
            new Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50 - 500),
            Quaternion.FromEulerAngles(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
            false, 0);
    }
    
    for (let i = 1; i <= gameDefinition.aiEnemies; i++) {
        this._shipManager.spawnShip(
            new Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50 + 500),
            Quaternion.FromEulerAngles(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
            false, 1);
    }
    
    // remove asteroids too close to ships
    this._world.removeAsteroids(new Vector3(0, 0, -500), 50);
    this._world.removeAsteroids(new Vector3(0, 0, 500), 50);
    ```
    
    11. 初始化 `HUD` 管理器，并设置渲染处理函数以及一些其他处理函数。
    ```
    this._HUD = new HUD(this._shipManager, assets, scene, this.humanPlayerShips);
    
    scene.customLODSelector = (mesh: AbstractMesh, camera: Camera) => { return mesh; };
    scene.freezeMaterials();
    
    this._renderObserver = scene.onBeforeRenderObservable.add(() => {
        // ...
    });
    
    this._delayedEnd = gameDefinition.delayedEnd;
    ```
    */
    constructor(assets: Assets, scene: Scene, canvas: HTMLCanvasElement, gameDefinition: Nullable<GameDefinition>, glowLayer: GlowLayer) {
        this._scene = scene;

        var shootFrame = 0;

        if (!gameDefinition) {
            gameDefinition = new GameDefinition();
            gameDefinition.humanAllies = 1;
            gameDefinition.humanEnemies = 0;
            gameDefinition.aiEnemies = Parameters.enemyCount;
            gameDefinition.aiAllies = Parameters.allyCount;
            console.log("Using default game definition");
        }

        const MaxShips = gameDefinition.humanAllies + gameDefinition.humanEnemies + gameDefinition.aiEnemies + gameDefinition.aiAllies;
        this._shotManager = new ShotManager(assets, scene, glowLayer);
        this._trailManager = new TrailManager(scene, assets.trailMaterial ? assets.trailMaterial : new NodeMaterial("empty", scene), MaxShips + MAX_MISSILES);
        this._missileManager = new MissileManager(scene, this._trailManager);
        this._shipManager = new ShipManager(this._missileManager, this._shotManager, assets, this._trailManager, scene, MaxShips, gameDefinition, glowLayer);
        this._inputManager = new InputManager(scene, canvas);
        this._explosions = new ExplosionManager(scene, assets, glowLayer);
        this._sparksEffects = new SparksEffects(scene, assets);
        if (Parameters.recorderActive) {
            this._recorder = new Recorder(this._shipManager, this._explosions, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, Parameters.recordFrameCount);
            this._recorder.setRecordActive(true);
        }

        this.activeCameras = [];
        for (let i = 0; i < gameDefinition.humanAllies; i++) {
            const ship = this._shipManager.spawnShip(new Vector3(i * 50, 0, -500), Quaternion.Identity(), true, 0);
            if (ship) {
                const camera = new ShipCamera(ship, scene);
                ship.shipCamera = camera
                this.humanPlayerShips.push(ship);
                this.activeCameras.push(camera.getFreeCamera());
            }
        }

        this._world = new World(assets, scene, gameDefinition, this.activeCameras[0], glowLayer);

        for (let i = 0; i < gameDefinition.humanEnemies; i++) {
            const ship = this._shipManager.spawnShip(new Vector3(i * 50, 0, 500), Quaternion.FromEulerAngles(0, Math.PI, 0), true, 1);
            if (ship) {
                const camera = new ShipCamera(ship, scene);
                ship.shipCamera = camera;
                this.humanPlayerShips.push(ship);
                this.activeCameras.push(camera.getFreeCamera());
            }
        }

        this._cameraDummy = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        this._cameraDummy.layerMask = 0x10000000;
        this.activeCameras.push(this._cameraDummy);

        /*
        在Babylon.js中，camera.viewport 是一个表示相机视口（viewport）的对象。视口是一个定义在渲染目标上的矩形区域，用于显示相机所捕捉到的3D场景。
        视口的属性包括x、y、width 和 height ，它们的值范围都在0到1之间，表示相对于渲染目标的百分比尺寸。
        camera.viewport.x 表示视口左上角的X坐标，相对于渲染目标的宽度。例如，如果 camera.viewport.x 为0.5，那么视口将从渲染目标宽度的中点开始。
        camera.viewport.width 表示视口的宽度，相对于渲染目标的宽度。例如，如果 camera.viewport.width 为0.5，那么视口的宽度将占据渲染目标宽度的一半。
        上面的代码中，const divCamera = 1 / (this.activeCameras.length - 1); 计算了每个相机视口所占的宽度百分比。
        接下来的循环遍历 this.activeCameras 数组中的每个相机（除了最后一个），设置它们的 viewport.x 和 viewport.width 属性，使得这些相机的视口在渲染目标上水平排列，且总宽度为1。
        这样做的目的是将渲染目标分割为多个部分，每个部分显示一个相机捕捉到的场景，从而实现多视角或分屏效果。
        */
        // Cameras
        const divCamera = 1 / (this.activeCameras.length - 1);
        for (let i = 0; i < (this.activeCameras.length - 1); i++) {
            const camera = this.activeCameras[i];
            camera.viewport.x = i * divCamera;
            camera.viewport.width = divCamera;
        }
        scene.activeCameras = this.activeCameras;
        if (this.humanPlayerShips.length) {
            this._world.ship = this.humanPlayerShips[0];
        }

        /*
        这个算法用于生成在一个特定范围内的随机位置。具体来说，Math.random() * 100 - 50 会生成一个介于-50和50之间的随机数。Math.random() 函数返回一个0到1之间的随机小数，
        乘以100后得到一个0到100之间的随机数，再减去50使得范围变为-50到50。这样做的目的是在场景中创建一个以原点为中心的立方体区域，其边长为100，飞船将在这个区域内随机生成。
        上面的代码中，人类玩家飞船和敌人飞船的生成位置有一个不同之处：Math.random() * 100 - 50 - 500 和 Math.random() * 100 - 50 + 500。
        这两个表达式分别在Z轴上减去和加上500，使得人类玩家飞船和敌人飞船在Z轴上的位置有一定的距离。这样，人类玩家飞船会在一个以原点为中心的立方体区域内生成，而敌人飞船会在一个与之相距500单位长度的立方体区域内生成。
        总之，这个算法用于在游戏场景中生成随机位置，以便在这些位置上生成人类玩家飞船和敌人飞船。
        */
        for (let i = 1; i <= gameDefinition.aiAllies; i++) {
            this._shipManager.spawnShip(
                new Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50 - 500),
                Quaternion.FromEulerAngles(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
                false, 0);
        }

        /*
        Quaternion.FromEulerAngles(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2) 这段代码表示将随机生成的欧拉角转换为四元数。这个四元数表示飞船的初始旋转。
        欧拉角（Euler angles）是一种表示物体在3D空间中旋转的方法，通常分别表示绕X轴、Y轴和Z轴的旋转角度。
        在这段代码中，Math.random() * Math.PI * 2 用于生成0到2π（即0到360度）之间的随机角度值，分别表示绕X轴、Y轴和Z轴的旋转角度。
        四元数（Quaternion）是一种更为稳定、不易出现万向锁问题（gimbal lock）的3D旋转表示方法。Quaternion.FromEulerAngles 函数用于将欧拉角转换为四元数。
        在这段代码中，Quaternion.FromEulerAngles(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2) 用于根据随机生成的欧拉角创建一个四元数，这个四元数表示飞船的初始旋转。
        总之，这段代码用于根据随机生成的欧拉角创建一个四元数，以设置飞船对象的初始旋转。这样可以确保每个生成的飞船具有不同的初始朝向。
        */
        for (let i = 1; i <= gameDefinition.aiEnemies; i++) {
            this._shipManager.spawnShip(
                new Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50 + 500),
                Quaternion.FromEulerAngles(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
                false, 1);
        }

        // remove asteroids too close to ships
        this._world.removeAsteroids(new Vector3(0, 0, -500), 50);
        this._world.removeAsteroids(new Vector3(0, 0, 500), 50);

        this._HUD = new HUD(this._shipManager, assets, scene, this.humanPlayerShips);
        /* 
        LOD 解释：
        LOD全称是Level of Detail，也就是细节层级。
        LOD的全篇内容共分3篇，

        第一篇是对细节层级进行动态设置
        为什么会产生这个技术？根据官方教程的解释是因为在一个很大的场景中，需要进一步考虑性能问题。LOD就是一个很好的解决性能问题的方案，它根据物体与摄像机的距离来展示这个物体不同的mesh，从而使得物体较远是使用面数比较少的mesh，而距离近的时候使用面数多的mesh。

        例如：LOD Levels(LOD细节模型)是一个mesh，它定义unity渲染游戏物体的几何结构的精细程度。当游戏物体使用了LOD，unity会根据该游戏物体距离摄像机的远近，然后会使用合理的LOD细节模型取代该游戏物体进行显示。

        每个LOD细节模型都是独立存在的，并且每个LOD细节模型都有一个用于显示它们自己的Mesh Render组件。对于想要渲染精细度较低的LOD而言，你可以使用Billboard Asset，Billboard Asset是unity用来替代3D mesh显示的等价物。unity可以按要求显示和隐藏这些游戏物体，另外，LOD细节模型必须作为与之相关联的游戏物体的子物体
        应用：
        1 .允许带有对细节级别的集成支持
        2 .允许根据与查看者的距离或屏幕覆盖范围指定不同的网格
        3 .每个级别都是独立的，可以有自己的材料。通过将细节级别定义为null,可以禁用当前网格的渲染，当他被查看出超出指定的相机距离时。
        文档地址：
        https://doc.babylonjs.com/div...

        根据屏幕距离
        a .屏幕距离是指距离远近，越近细节展示越好，越远细节展示越粗糙；distance值越小，细节展示越好；distance值越大，细节展示越粗糙；
        b .knot00.addLODLevel(100, knot01);
        c.计算物体到相机的屏幕距离 mesh.getDistanceToCamera()

        根据屏幕范围
        a .通过屏幕覆盖率来限制来添加 LOD 级别。屏幕覆盖率计算为网格渲染的屏幕表面积与总屏幕表面积的 0 和 1 之间的比率
        b .这种方法与距离比较相比具有显着的优势，即与比例无关，因为从远距离渲染的大对象在屏幕上仍然可以很大
        c .knot00.useLODScreenCoverage = true;
        d .值必须介于 0 和 1 之间; distance值越大，细节展示越好；distance值越小，细节展示越粗糙；
        e .knot00.addLODLevel(0.1, knot01);

        LOD的第二篇是减面
        LOD的第三篇是爆炸网格
        此篇内容涉及较少


        */
        scene.customLODSelector = (mesh: AbstractMesh, camera: Camera) => { return mesh; };
        scene.freezeMaterials();
        //AbstractMesh.isInFrustum = function() { return true; };

        this._renderObserver = scene.onBeforeRenderObservable.add(() => {
            this._speed += (this._targetSpeed - this._speed) * 0.1;//更新 _speed 属性的值，以使其逐渐趋近于 _targetSpeed 的值。
            const deltaTime = scene.getEngine().getDeltaTime() * this._speed;//获取时间增量，即每帧渲染之间的时间差，乘上当前速度倍率 _speed。
            InputManager.deltaTime = deltaTime;//将时间增量传递给管理输入的 InputManager 对象。

            GamepadInput.gamepads.forEach(gp => gp.tick());//遍历游戏手柄输入 gamepads 数组，并对每个 gamepad 进行更新处理。

            shootFrame -= deltaTime;//更新射击倒计时，即距离下次能否发射子弹还需等待的时间。
            let canShoot = false;
            if (shootFrame <= 0) {//判断当前是否已经达到射击条件，若达到，则将 canShoot 设为 true，并重新计算下次射击的倒计时。
                canShoot = true;
                shootFrame = 130; // can shoot only every 130 ms
            }
            this._shipManager.tick(canShoot, InputManager.input, deltaTime, this._speed, this._sparksEffects, this._explosions, this._world, this._targetSpeed);//调用飞船管理器的 tick 方法，处理飞船移动、开火等操作。

            this.humanPlayerShips.forEach((ship) => {//遍历玩家当前拥有的飞船，并对每个飞船执行 Tick 方法，进行摄像机视角的更新。
                if (ship && ship.shipCamera) {
                    var wmat = ship.root.getWorldMatrix();
                    ship.shipCamera.Tick(ship, wmat, ship.speedRatio, this._speed);
                }
            });

            this._shotManager.tick(deltaTime, this._world);//调用子弹管理器的 tick 方法，更新子弹位置、判断是否击中敌人等操作。
            this._missileManager.tick(deltaTime, this._explosions, this._world);//调用导弹管理器的 tick 方法，更新导弹位置、判断是否击中敌人等操作。
            if (this._HUD) {
                this._HUD.tick(scene.getEngine(), this._speed, this.humanPlayerShips);//判断是否存在 HUD，若存在则调用其 tick 方法，更新场景中的头顶信息。
            }
            if (this._recorder) {
                this._recorder.tick();//判断是否存在录像机对象，若存在则调用其 tick 方法，记录当前帧的场景状态。
            }
            this._sparksEffects.tick(deltaTime);//调用火花特效管理器的 tick 方法，更新火花特效的状态。
            this._explosions.tick(deltaTime);//调用爆炸特效管理器的 tick 方法，更新爆炸特效的状态。
            if (this._targetSpeed === 1) {//判断当前速度倍率是否为 1，若是则调用拖尾特效管理器的 tick 方法，更新拖尾特效的状态。
                this._trailManager.tick(deltaTime);
            }

            // victory check
            this._checkVictory(scene.getEngine().getDeltaTime() / 1000);//调用 _checkVictory 方法，判断当前游戏是否胜利。
        });

        /*
        以上代码是 Babylon.js 中的一段代码，用于在场景渲染之前进行一些处理。下面逐行解释：
        1. `this._renderObserver = scene.onBeforeRenderObservable.add(() => {`: 注册在场景渲染之前的事件监听器，同时将监听器对象保存到 `_renderObserver` 属性中。
        2. `this._speed += (this._targetSpeed - this._speed) * 0.1;`: 更新 `_speed` 属性的值，以使其逐渐趋近于 `_targetSpeed` 的值。
        3. `const deltaTime = scene.getEngine().getDeltaTime() * this._speed;`: 获取时间增量，即每帧渲染之间的时间差，乘上当前速度倍率 `_speed`。
        4. `InputManager.deltaTime = deltaTime;`: 将时间增量传递给管理输入的 `InputManager` 对象。
        5. `GamepadInput.gamepads.forEach(gp => gp.tick());`: 遍历游戏手柄输入 `gamepads` 数组，并对每个 `gamepad` 进行更新处理。
        6. `shootFrame -= deltaTime;`: 更新射击倒计时，即距离下次能否发射子弹还需等待的时间。
        7. `let canShoot = false;`: 定义变量 `canShoot`，用于表示当前是否允许射击。
        8. `if (shootFrame <= 0) {...}`: 判断当前是否已经达到射击条件，若达到，则将 `canShoot` 设为 `true`，并重新计算下次射击的倒计时。
        9. `this._shipManager.tick(...);`: 调用飞船管理器的 `tick` 方法，处理飞船移动、开火等操作。
        10. `this.humanPlayerShips.forEach(...);`: 遍历玩家当前拥有的飞船，并对每个飞船执行 `Tick` 方法，进行摄像机视角的更新。
        11. `this._shotManager.tick(...);`: 调用子弹管理器的 `tick` 方法，更新子弹位置、判断是否击中敌人等操作。
        12. `this._missileManager.tick(...);`: 调用导弹管理器的 `tick` 方法，更新导弹位置、判断是否击中敌人等操作。
        13. `if (this._HUD) {...}`: 判断是否存在 HUD，若存在则调用其 `tick` 方法，更新场景中的头顶信息。
        14. `if (this._recorder) {...}`: 判断是否存在录像机对象，若存在则调用其 `tick` 方法，记录当前帧的场景状态。
        15. `this._sparksEffects.tick(deltaTime);`: 调用火花特效管理器的 `tick` 方法，更新火花特效的状态。
        16. `this._explosions.tick(deltaTime);`: 调用爆炸特效管理器的 `tick` 方法，更新爆炸特效的状态。
        17. `if (this._targetSpeed === 1) {...}`: 判断当前速度倍率是否为 1，若是则调用拖尾特效管理器的 `tick` 方法，更新拖尾特效的状态。
        18. `this._checkVictory(scene.getEngine().getDeltaTime() / 1000);`: 调用 `_checkVictory` 方法，判断当前游戏是否胜利。 
        */

        /* inspector
        this._hotkeyObservable = scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
              case KeyboardEventTypes.KEYDOWN:
                if (kbInfo.event.key == 'i') {
                    if (this._scene.debugLayer.isVisible()) {
                        this._scene.debugLayer.hide();
                    } else {
                        this._scene.debugLayer.show();
                    }
                }
                break;
            }
        });
        */

        this._delayedEnd = gameDefinition.delayedEnd;
    }
    public getShipManager(): ShipManager {
        return this._shipManager;
    }

    public setTargetSpeed(speed: number): void {
        this._targetSpeed = speed;
    }
    /*
        public getCamera(): Camera {
            return this._camera;
        }
    */
    public getRecorder(): Nullable<Recorder> {
        return this._recorder;
    }

    /*
    这是一段 Babylon.js 游戏开发框架中的代码，作用是检查游戏胜利的条件。下面对代码进行逐行分析：
    
    1. 声明了一个名为 `_checkVictory` 的函数，并传入了一个名为 `deltaTime` 的参数。
    ```
    private _checkVictory(deltaTime: number): void {
    ```
    
    2. 声明了两个变量：`enemyCount` 和 `player`，并初始化为 0 和 `null`。
    ```
    var enemyCount = 0;
    var player: Nullable<Ship> = null;
    ```
    
    3. 使用 `forEach` 方法遍历游戏中所有的飞船，根据其阵营属性（faction）是否为 1 来判断该飞船是否为敌方飞船，进而计算敌方飞船数量；同时，判断飞船是否为人类玩家的飞船，并将其赋值给 `player` 变量。
    ```
    this._shipManager.ships.forEach((ship, shipIndex) => {
        if (ship.isValid()) {
            if (ship.faction == 1) {
                enemyCount++;
            }
            if (ship.isHuman) {
                player = ship;
            }
        }
    });
    ```
    
    4. 进行胜负判断：如果没有玩家飞船，且延迟结束时间 `_delayedEnd` 已经过去，则将状态设置为死亡；如果没有敌方飞船，且延迟结束时间 `_delayedEnd` 已经过去，则将胜利状态设置为玩家的飞船，并将状态设置为胜利。
    ```
    if (!player) {
        if (this._delayedEnd <= 0) {
            if (this._HUD) {
                this._HUD.dispose();
                this._HUD = null;
            }
            State.setCurrent(States.dead);
        }
        this._delayedEnd -= deltaTime;
    }
    else if (!enemyCount) {
        if (this._delayedEnd <= 0) {
            States.victory.ship = player;
            if (this._HUD) {
                this._HUD.dispose();
                this._HUD = null;
            }
            State.setCurrent(States.victory);
        }
        this._delayedEnd -= deltaTime;
    }
    ```
    
    5. 函数结尾。
    ```
    }```
    */
    private _checkVictory(deltaTime: number): void {
        var enemyCount = 0;
        var player: Nullable<Ship> = null;
        this._shipManager.ships.forEach((ship, shipIndex) => {
            if (ship.isValid()) {
                if (ship.faction == 1) {
                    enemyCount++;
                }
                if (ship.isHuman) {
                    player = ship;
                }
            }
        });

        if (!player) {
            if (this._delayedEnd <= 0) {
                if (this._HUD) {
                    this._HUD.dispose();
                    this._HUD = null;
                }
                State.setCurrent(States.dead);
            }
            this._delayedEnd -= deltaTime;
        }
        else if (!enemyCount) {
            if (this._delayedEnd <= 0) {
                States.victory.ship = player;
                if (this._HUD) {
                    this._HUD.dispose();
                    this._HUD = null;
                }

                State.setCurrent(States.victory);
            }
            this._delayedEnd -= deltaTime;
        }
    }

    dispose() {
        this._shipManager.dispose();
        this._missileManager.dispose();
        this._shotManager.dispose();
        if (this._HUD) {
            this._HUD.dispose();
            this._HUD = null;
        }
        this._inputManager.dispose();
        if (this._recorder) {
            this._recorder.dispose();
        }
        this._explosions.dispose();
        this._sparksEffects.dispose();
        this._trailManager.dispose();
        this._world.dispose();
        this._scene.onBeforeRenderObservable.remove(this._renderObserver);
        this._cameraDummy.dispose();
        if (this._scene && this._hotkeyObservable) {
            this._scene.onKeyboardObservable.remove(this._hotkeyObservable);
        }
        //this._glowLayer.dispose();
    }
}