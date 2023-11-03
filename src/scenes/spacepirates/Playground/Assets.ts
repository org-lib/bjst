import { ContainerAssetTask, TransformNode, AbstractMesh, Tools, Scene, TextFileAssetTask, MeshAssetTask, Nullable, NodeMaterial, Texture, NodeMaterialBlock, TextureBlock, Vector3, CubeTexture, Sound, AssetContainer, Color3, InputBlock, AssetsManager } from "@babylonjs/core";
import { useNative } from "..";
import { PlanetBaker } from "./FX/PlanetBaker";
import { Parameters } from "./Parameters";

declare var _native: any;
declare var Canvas: any;
declare var _CanvasImpl: any;

export class Assets {
    public raider: Nullable<AbstractMesh> = null;//表示游戏中的 raider。
    public valkyrie: Nullable<AbstractMesh> = null;//表示游戏中的 valkyrie。
    public trailMaterial: Nullable<NodeMaterial> = null;//表示游戏中的拖尾材质。
    public starfieldMaterial: Nullable<NodeMaterial> = null;//表示游戏中的星空材质。
    public sunTexture: Nullable<Texture> = null;//表示游戏中的太阳纹理。
    public starfieldTextureBlock: Nullable<NodeMaterialBlock> = null;//表示游戏中的星空纹理块。
    public planetMaterial: Nullable<NodeMaterial> = null;//表示游戏中的行星材质。
    public sparksEffect: Nullable<NodeMaterial> = null;//表示游戏中的火花效果。
    public asteroidsTriPlanar: Nullable<NodeMaterial> = null;//表示游戏中的小行星材质。

    public explosionMaterial: Nullable<NodeMaterial> = null;//表示游戏中的爆炸效果材质。
    public explosionMesh: Nullable<AbstractMesh> = null;//表示游戏中的爆炸效果网格。

    public thrusterMesh: Nullable<AbstractMesh> = null;//表示游戏中的推进器网格。
    public vortexMesh: Nullable<AbstractMesh> = null;//表示游戏中的漩涡网格。

    public noisyRockMaterial: Nullable<NodeMaterial> = null;//表示游戏中的嘈杂岩石材质。
    public projectileShader: Nullable<NodeMaterial> = null;//表示游戏中的子弹材质。

    public thrusterShader: Nullable<NodeMaterial> = null;//表示游戏中的推进器材质。
    public vortexShader: Nullable<NodeMaterial> = null;//表示游戏中的漩涡材质。

    public asteroidMeshes: Nullable<AssetContainer> = null;//表示游戏中的小行星网格容器。
    public asteroidLocation: Nullable<AssetContainer> = null;//表示游戏中的小行星位置容器。
    public starfield: Nullable<AbstractMesh> = null;//表示游戏中的星空网格。

    public raidercannonL: Nullable<Vector3> = null;//表示游戏中 raider 左侧的炮管位置。
    public raidercannonR: Nullable<Vector3> = null;//表示游戏中 raider 右侧的炮管位置。

    public valkyriecannonL: Nullable<Vector3> = null;//表示游戏中 valkyrie 左侧的炮管位置。
    public valkyriecannonR: Nullable<Vector3> = null;//表示游戏中 valkyrie 右侧的炮管位置。

    public audio: Nullable<AudioAssets> = null;//表示游戏中的音频资源。
    public assetsHostUrl: string;//表示游戏资源的主机地址。
    public static missions: any;//表示游戏中的任务。

    public envCube: CubeTexture;//表示游戏中的环境立方体贴图。

    public planetBaker: PlanetBaker;//表示游戏中的行星贴图生成器。
    public shieldEffectMaterial: Nullable<NodeMaterial> = null;//表示游戏中的护盾效果材质。
    public projectile: Nullable<AbstractMesh> = null;//表示游戏中的子弹网格。

    public static loadingComplete: boolean = false;//表示游戏是否加载完成。

    /*
    这段代码是使用babylonjs库创建一个具有环境反射、星空背景、发动机喷射火焰和黑洞特效的场景。其中包含了多个任务，通过 AssetsManager 对象来异步加载场景中需要用到的各种资源。
    加载完成后，执行回调函数 whenReady 和 whenLoadingComplete。
    具体来说，这段代码中包含以下功能：
    - 创建一个 CubeTexture 对象作为环境贴图，并将其应用到场景中；
    - 创建一个 PlanetBaker 对象，用于在场景中创建星球；
    - 添加多个任务，包括加载 valkyrie 、 starsGeo 、 thrusterFlame 、 vortex 等模型，以及加载发动机火焰、黑洞特效等所需的 shader ；
    - 当所有异步任务执行完成后，执行回调函数 whenReady 和 whenLoadingComplete，完成场景的初始化和加载。
    值得一提的是，这段代码中使用了 NodeMaterial 对象来创建 shader ，并且使用了 Promise 和 async/await 等语法糖来实现异步操作，这些都是比较常见的现代Web开发技术。
    */
    constructor(scene: Scene, assetsHostUrl: string, whenReady: (assets: Assets) => void, whenLoadingComplete: (assets: Assets) => void) {
        var _this = this;
        this.assetsHostUrl = assetsHostUrl;

        // add in IBL with linked environment
        this.envCube = CubeTexture.CreateFromPrefilteredData(assetsHostUrl + "/src/assets/env/environment.env", scene);
        this.envCube.name = "environment";
        this.envCube.gammaSpace = false;
        this.envCube.rotationY = 1.977;//立方体贴图被旋转了1.977弧度

        this.planetBaker = new PlanetBaker(scene, assetsHostUrl, 512);

        scene.environmentTexture = this.envCube;
        scene.environmentIntensity = 1.25;//将场景的环境光照强度

        // MINIMAL loading
        var assetsManagerMinimal = new AssetsManager(scene);
        var valkyrieTask = assetsManagerMinimal.addMeshTask("valkyrieTask", "", assetsHostUrl + "/src/assets/gltf/", "valkyrie_mesh.glb");
        valkyrieTask.onSuccess = function (task: MeshAssetTask) {
            _this.valkyrie = task.loadedMeshes[0];
            _this.valkyrie.getChildTransformNodes().forEach((m: TransformNode) => {
                if (m.name == "valkyrie_cannon_L")
                    _this.valkyriecannonL = m.absolutePosition.clone();
                else if (m.name == "valkyrie_cannon_R")
                    _this.valkyriecannonR = m.absolutePosition.clone();
            });
        };

        var starsGeoTask = assetsManagerMinimal.addMeshTask("starsGeoTask", "", assetsHostUrl + "/src/assets/gltf/", "starsGeo.glb");
        starsGeoTask.onSuccess = function (task: MeshAssetTask) {
            _this.starfield = task.loadedMeshes[1];
            if (_this.starfield) {
                _this.starfield.scaling = new Vector3(4500, 4500, 4500);//将该模型放大了4500倍
                _this.starfield.visibility = 0;
            }
        };

        var thrusterTask = assetsManagerMinimal.addMeshTask("thrusterTask", "", assetsHostUrl + "/src/assets/gltf/", "thrusterFlame_mesh.glb");
        thrusterTask.onSuccess = function (task: MeshAssetTask) {
            _this.thrusterMesh = task.loadedMeshes[1];
        };

        var vortexTask = assetsManagerMinimal.addMeshTask("vortexTask", "", assetsHostUrl + "/src/assets/gltf/", "vortex_mesh.glb");
        vortexTask.onSuccess = function (task: MeshAssetTask) {
            _this.vortexMesh = task.loadedMeshes[1];
        };

        assetsManagerMinimal.onTasksDoneObservable.add(() => {

            NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/thrusterFlame.json", scene).then((nodeMaterial) => {
                _this.thrusterShader = nodeMaterial.clone("thrusterMaterial", true);
                _this.thrusterShader.backFaceCulling = false;
                // alphaMode 透明模式？
                _this.thrusterShader.alphaMode = 1;
                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/vortex.json", scene).then((nodeMaterial) => {
                    _this.vortexShader = nodeMaterial.clone("vortexMaterial", true);
                    _this.vortexShader.backFaceCulling = false;
                    _this.vortexShader.alphaMode = 1;

                    const starfieldShaderName = Parameters.starfieldHeavyShader ? "/src/assets/shaders/starfieldShaderHeavy.json" : "/src/assets/shaders/starfieldShader.json";
                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + starfieldShaderName, scene).then((nodeMaterial) => {
                        //nodeMaterial.build(false);
                        if (_this.starfield) {
                            const starfieldTexture = new Texture(assetsHostUrl + "/src/assets/textures/starfield_panorama_texture_mini.jpg", scene, false, false);
                            if (nodeMaterial.getBlockByName("emissiveTex")) {
                                _this.starfieldTextureBlock = nodeMaterial.getBlockByName("emissiveTex");
                                (_this.starfieldTextureBlock as TextureBlock).texture = starfieldTexture;
                            }
                            _this.starfield.material = nodeMaterial;
                        }
                        _this.starfieldMaterial = nodeMaterial;
                        console.log("Minimal asset loading done");
                        if (useNative) {
                            Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then((data) => {
                                _native.Canvas.loadTTFAsync("Arial", data);
                                whenReady(_this);
                            });
                        } else {
                            whenReady(_this);
                        }
                        // minimal done
                        this._completeLoading(scene, assetsHostUrl, whenLoadingComplete);
                    });
                });
            });

        });
        assetsManagerMinimal.load();
    }
    /*
    这段代码是一个构造函数，创建了一个名为“babylonjs”的对象。该函数有四个参数，分别为场景（scene）、资源主机地址（assetsHostUrl）、当资源准备好时的回调函数（whenReady）和当资源加载完毕时的回调函数（whenLoadingComplete）。以下是逐行解释：
    1. `var _this = this;`：定义一个变量 `_this` 并把 `this` 赋值给它，方便后面使用。
    2. `this.assetsHostUrl = assetsHostUrl;`：将传入的 `assetsHostUrl` 赋给 `this.assetsHostUrl`，即资源主机地址。
    3. `this.envCube = CubeTexture.CreateFromPrefilteredData(assetsHostUrl + "/src/assets/env/environment.env", scene);`：创建一个立方体贴图，并从预筛选数据中创建纹理。`assetsHostUrl + "/src/assets/env/environment.env"` 即为预筛选数据的路径，`scene` 为当前场景。
    4. `this.envCube.name = "environment";`：设置立方体贴图的名称为 "environment"。
    5. `this.envCube.gammaSpace = false;`：将立方体贴图的 gamma 空间设为 false。
    6. `this.envCube.rotationY = 1.977;`：将立方体贴图绕 Y 轴旋转 1.977 弧度。
    7. `this.planetBaker = new PlanetBaker(scene, assetsHostUrl, 512);`：创建一个名为 "planetBaker" 的 PlanetBaker 对象。
    8. `scene.environmentTexture = this.envCube;`：将场景的环境纹理设置为当前立方体贴图。
    9. `scene.environmentIntensity = 1.25;`：将场景的环境光强度设置为 1.25。
    10. `var assetsManagerMinimal = new AssetsManager(scene);`：创建一个名为 "assetsManagerMinimal" 的资源管理器对象，用于加载后续的资源。
    11. `var valkyrieTask = assetsManagerMinimal.addMeshTask("valkyrieTask", "", assetsHostUrl + "/src/assets/gltf/", "valkyrie_mesh.glb");`：新增一个任务，用于加载 "valkyrie_mesh.glb" 模型。
    12. `valkyrieTask.onSuccess = function (task: MeshAssetTask) { ... }`：当任务成功加载时执行回调函数，将加载的模型存到当前对象的属性里。
    13. `var starsGeoTask = assetsManagerMinimal.addMeshTask("starsGeoTask", "", assetsHostUrl + "/src/assets/gltf/", "starsGeo.glb");`：新增一个任务，用于加载 "starsGeo.glb" 模型。
    14. `starsGeoTask.onSuccess = function (task: MeshAssetTask) { ... }`：当任务成功加载时执行回调函数，将加载的模型存到当前对象的属性里。
    15. `var thrusterTask = assetsManagerMinimal.addMeshTask("thrusterTask", "", assetsHostUrl + "/src/assets/gltf/", "thrusterFlame_mesh.glb");`：新增一个任务，用于加载 "thrusterFlame_mesh.glb" 模型。
    16. `thrusterTask.onSuccess = function (task: MeshAssetTask) { ... }`：当任务成功加载时执行回调函数，将加载的模型存到当前对象的属性里。
    17. `var vortexTask = assetsManagerMinimal.addMeshTask("vortexTask", "", assetsHostUrl + "/src/assets/gltf/", "vortex_mesh.glb");`：新增一个任务，用于加载 "vortex_mesh.glb" 模型。
    18. `vortexTask.onSuccess = function (task: MeshAssetTask) { ... }`：当任务成功加载时执行回调函数，将加载的模型存到当前对象的属性里。
    19. `assetsManagerMinimal.onTasksDoneObservable.add(() => { ... });`：当所有任务都完成时执行回调函数。
    20. `NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/thrusterFlame.json", scene).then((nodeMaterial) => { ... });`：从文件中异步解析节点材质，并在解析完成后执行回调函数。
    21. `_this.thrusterShader = nodeMaterial.clone("thrusterMaterial", true);`：将解析出的节点材质克隆一个新的节点材质，并将新节点材质存储到当前对象的属性里。
    22. `_this.thrusterShader.backFaceCulling = false;`：禁用消隐剔除。
    23. `_this.thrusterShader.alphaMode = 1;`：设置 alpha 模式为 1，即使用 alpha 合成。
    24. `NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/vortex.json", scene).then((nodeMaterial) => { ... });`：从文件中异步解析节点材质，并在解析完成后执行回调函数。
    25. `_this.vortexShader = nodeMaterial.clone("vortexMaterial", true);`：将解析出的节点材质克隆一个新的节点材质，并将新节点材质存储到当前对象的属性里。
    26. `_this.vortexShader.backFaceCulling = false;`：禁用消隐剔除。
    27. `_this.vortexShader.alphaMode = 1;`：设置 alpha 模式为 1，即使用 alpha 合成。
    28. `const starfieldShaderName = Parameters.starfieldHeavyShader ? "/assets/shaders/starfieldShaderHeavy.json" : "/src/assets/shaders/starfieldShader.json";`：根据参数 "starfieldHeavyShader" 的值选择不同的星空着色器路径。
    29. `NodeMaterial.ParseFromFileAsync("", assetsHostUrl + starfieldShaderName, scene).then((nodeMaterial) => { ... });`：从文件中异步解析节点材质，并在解析完成后执行回调函数。
    30. `_this.starfield.material = nodeMaterial;`：将星空模型应用该节点材质。 
    31. `console.log("Minimal asset loading done");`：输出日志，表示最小化的资源加载已完成。
    32. `whenReady(_this);`：执行当资源准备好时的回调函数。
    33. `this._completeLoading(scene, assetsHostUrl, whenLoadingComplete);`：调用当前对象的 `_completeLoading` 方法，完成资源加载。
    */

    private _completeLoading(scene: Scene, assetsHostUrl: string, whenLoadingComplete: (assets: Assets) => void): void {
        // COMPLETE loading
        var _this = this;
        var assetsManager = new AssetsManager(scene);
        var raiderTask = assetsManager.addMeshTask("raiderTask", "", assetsHostUrl + "/src/assets/gltf/", "raider_mesh.glb");
        raiderTask.onSuccess = function (task: MeshAssetTask) {
            _this.raider = task.loadedMeshes[0];
            _this.raider.getChildTransformNodes().forEach((m: TransformNode) => {
                if (m.name == "raider_cannon_L")
                    _this.raidercannonL = m.absolutePosition.clone();
                else if (m.name == "raider_cannon_R")
                    _this.raidercannonR = m.absolutePosition.clone();
            });
        };

        var explosionMeshTask = assetsManager.addMeshTask("explosionMeshTask", "", assetsHostUrl + "/src/assets/gltf/", "explosionSpheres_mesh.glb");
        explosionMeshTask.onSuccess = function (task: MeshAssetTask) {
            _this.explosionMesh = task.loadedMeshes[1];
            _this.explosionMesh.parent = null;
            _this.explosionMesh.material?.dispose();
        };
        var asteroidsTask = assetsManager.addContainerTask("asteroidsTask", "", assetsHostUrl + "/src/assets/gltf/", "asteroids_meshes.glb");
        asteroidsTask.onSuccess = function (task: ContainerAssetTask) {
            _this.asteroidMeshes = task.loadedContainer;
        };
        var asteroidsTask = assetsManager.addContainerTask("asteroidsTask", "", assetsHostUrl + "/src/assets/gltf/", "asteroid_V1.glb");
        asteroidsTask.onSuccess = function (task: ContainerAssetTask) {
            _this.asteroidLocation = task.loadedContainer;
        };

        var projectileTask = assetsManager.addMeshTask("projectileTask", "", assetsHostUrl + "/src/assets/gltf/", "projectile_mesh.glb");
        projectileTask.onSuccess = function (task: MeshAssetTask) {
            _this.projectile = task.loadedMeshes[1];
            _this.projectile.scaling = new Vector3(100, 100, 100);

            (_this.projectile as any).bakeTransformIntoVertices(_this.projectile.computeWorldMatrix(true));
            _this.projectile.setEnabled(false);
        };
        var missionsTask = assetsManager.addTextFileTask("missionsTask", assetsHostUrl + "/src/assets/missions.json");
        missionsTask.onSuccess = function (task: TextFileAssetTask) {
            Assets.missions = JSON.parse(task.text);
        };

        this.sunTexture = new Texture(assetsHostUrl + "/src/assets/textures/sun.png", scene, true, false, Texture.BILINEAR_SAMPLINGMODE);

        assetsManager.onTasksDoneObservable.add(() => {
            NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/shields.json", scene).then((nodeMaterial) => {
                _this.shieldEffectMaterial = nodeMaterial;

                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/projectileUVShader.json", scene).then((nodeMaterial) => {
                    //NodeMaterial.ParseFromSnippetAsync("19ALD5#7", scene).then((nodeMaterial:any) => {
                    _this.projectileShader = nodeMaterial.clone("projectileMaterial", true);
                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/TrailShader.json", scene).then((nodeMaterial) => {
                        //NodeMaterial.ParseFromSnippetAsync("NLDUNC#8", scene).then((nodeMaterial:any) => {
                        _this.trailMaterial = nodeMaterial.clone("trailMaterial", true);
                        NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/explosionLayeredShader.json", scene).then((nodeMaterial) => {
                            _this.explosionMaterial = nodeMaterial.clone("explosionMaterial", true);
                            //nodeMaterial.getBlockByName("startTime").value = nodeMaterial.getBlockByName("Time").value;
                            (_this.explosionMaterial.getBlockByName("noiseTex") as TextureBlock).texture = new Texture(assetsHostUrl + "/src/assets/textures/noise_squareMask.png", scene, false, false);
                            _this.explosionMaterial.backFaceCulling = false;
                            _this.explosionMaterial.alphaMode = 1;
                            NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/planetShaderGreybox.json", scene).then((nodeMaterial) => {
                                _this.planetMaterial = nodeMaterial;
                                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/SparksShader.json", scene).then((nodeMaterial) => {
                                    _this.sparksEffect = nodeMaterial;
                                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/asteroidsTriplanarShader.json", scene).then((nodeMaterial) => {
                                        _this.asteroidsTriPlanar = nodeMaterial;

                                        if (Parameters.enableAudio) {
                                            this.audio = new AudioAssets(assetsHostUrl, scene);
                                        }

                                        const starfieldTexture = new Texture(assetsHostUrl + "/src/assets/textures/starfield_panorama_texture.jpg", scene, false, false);
                                        if (_this.starfieldTextureBlock) {
                                            (_this.starfieldTextureBlock as TextureBlock).texture = starfieldTexture;
                                        }
                                        Assets.loadingComplete = true;
                                        whenLoadingComplete(this);
                                        console.log("Complete asset loading done");
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        assetsManager.load();
    }
    async loadAssets() {
        return new Promise((resolve, reject) => {
        });
    }

    dispose() {
    }
}

class AudioAssets {
    public ready = false;
    public explosionSounds: Sound[];
    public heroLaserSounds: Sound[];
    public raiderLaserSounds: Sound[];
    public thrusterSound: Sound;
    public heroEngineSound: Sound;
    //public raiderEngineSound: Sound;
    public laserHitSound: Sound;
    public missileFireSound: Sound;

    private _sounds = 0;
    private _soundCount = 6;

    constructor(assetsHostUrl: string, scene: Scene) {
        this.explosionSounds = [new Sound("explosion", assetsHostUrl + "/src/assets/sounds/explosions/explosion1.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 0.2,
            volume: 2
        }),
        new Sound("explosion", assetsHostUrl + "/src/assets/sounds/explosions/explosion2.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 0.2,
            volume: 2
        })];

        this.heroLaserSounds = [new Sound("laser", assetsHostUrl + "/src/assets/sounds/heroShip/heroLaser1.mp3", scene, this.soundReady, {
            spatialSound: false,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 1
        }),
        new Sound("laser", assetsHostUrl + "/src/assets/sounds/heroShip/heroLaser2.mp3", scene, this.soundReady, {
            spatialSound: false,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 1
        }),
        new Sound("laser", assetsHostUrl + "/src/assets/sounds/heroShip/heroLaser3.mp3", scene, this.soundReady, {
            spatialSound: false,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 1
        })];
        this.raiderLaserSounds = [new Sound("laser", assetsHostUrl + "/src/assets/sounds/raider/raiderLaser1.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 1
        }),
        new Sound("laser", assetsHostUrl + "/src/assets/sounds/raider/raiderLaser2.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 1
        }),
        new Sound("laser", assetsHostUrl + "/src/assets/sounds/raider/raiderLaser3.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 1
        })];

        this.thrusterSound = new Sound("thruster", assetsHostUrl + "/src/assets/sounds/heroShip/thrusterFire_000.ogg", scene, this.soundReady, {
            autoplay: true,
            loop: true,
            volume: 0
        });
        this.heroEngineSound = new Sound("engine", assetsHostUrl + "/src/assets/sounds/heroShip/heroShipFlying.mp3", scene, this.soundReady, {
            autoplay: true,
            loop: true,
            volume: 1
        });
        /*this.raiderEngineSound = new Sound("engine", assetsHostUrl + "/assets/sounds/raider/raiderFlying.mp3", scene, this.soundReady, {
            autoplay: true,
            loop: true,
            volume: 0.1
        });*/

        this.laserHitSound = new Sound("laserHit", assetsHostUrl + "/src/assets/sounds/raider/raiderHitByLaser", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 0.7,
            volume: 3
        });
        this.missileFireSound = new Sound("missileFire", assetsHostUrl + "/src/assets/sounds/heroShip/rocketLaunch.mp3", scene, this.soundReady, {
            spatialSound: true,
            distanceModel: "exponential",
            rolloffFactor: 1,
            volume: 8
        });
    }

    soundReady() {
        this._sounds++;
        if (this._sounds == this._soundCount) {
            this.ready = true;
        }
    }
}