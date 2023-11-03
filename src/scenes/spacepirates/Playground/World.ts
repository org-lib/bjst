import { Texture, HemisphericLight, Vector3, Mesh, Scene, Nullable, Color3, Observer, AbstractMesh, Light, LensFlareSystem, LensFlare, TransformNode, VolumetricLightScatteringPostProcess, Camera, GlowLayer } from "@babylonjs/core";
import { Ship } from "./Ship";
import { Assets } from "./Assets"
import { GameDefinition } from "./Game";
import { PlanetBaker } from "./FX/PlanetBaker";

var seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

class Asteroid {
    asteroidRootTransform: TransformNode;
    radius: number = 0;
    position: Vector3 = new Vector3();
    subRadius: Array<number> = new Array<number>()
    subPosition: Array<Vector3> = new Array<Vector3>()
    private _debugSphere: Nullable<AbstractMesh> = null;

    constructor(assets: Assets, scene: Scene, asteroidRadius: number) {
        this.asteroidRootTransform = new TransformNode("AsteroidRoot", scene);
        const asteroidLocationContainer = assets.asteroidLocation;
        if (!asteroidLocationContainer) {
            return;
        }
        const asteroidMeshContainer = assets.asteroidMeshes;
        if (!asteroidMeshContainer) {
            return;
        }

        const scale = 100.0; //Math.random() * 300 + 300
        this.asteroidRootTransform.position.x = random() * asteroidRadius - asteroidRadius * 0.5;
        this.asteroidRootTransform.position.y = random() * asteroidRadius - asteroidRadius * 0.5;
        this.asteroidRootTransform.position.z = random() * asteroidRadius - asteroidRadius * 0.5;

        this.asteroidRootTransform.rotation.x = random() * Math.PI * 2;
        this.asteroidRootTransform.rotation.y = random() * Math.PI * 2;
        this.asteroidRootTransform.rotation.z = random() * Math.PI * 2;

        let asteroidPoints: Vector3[] = [];
        this.asteroidRootTransform.scaling = new Vector3(scale, scale, scale);
        asteroidLocationContainer.transformNodes.forEach((loc) => {
            const locName = loc.name.substring(0, 15);
            asteroidMeshContainer.meshes.forEach((msh) => {
                if (msh.name.substring(0, 15) === locName) {
                    const transform = (loc as TransformNode).clone("AsteroidLocation", this.asteroidRootTransform);
                    const subMesh = msh.clone(locName, transform);
                    subMesh?.computeWorldMatrix(true);
                    subMesh?.freezeWorldMatrix();
                    subMesh?.material?.freeze();

                    const subRadius = subMesh?.getBoundingInfo().boundingSphere.radiusWorld;
                    const subPosition = subMesh?.getBoundingInfo().boundingSphere.centerWorld;
                    if (subRadius && subPosition) {
                        this.subRadius.push(subRadius);
                        this.subPosition.push(subPosition);

                        asteroidPoints.push(subPosition);
                        /*
                                                const debugSphere = MeshBuilder.CreateSphere("", {diameter: subRadius}, scene);
                                                debugSphere.position.copyFrom(subPosition);
                                                debugSphere.visibility = 0.25;*/
                    }
                }
            });
        });

        // compute rough estimation of enclosing sphere
        this.position.set(0, 0, 0);
        asteroidPoints.forEach((p) => {
            this.position.addInPlace(p);
        });
        this.position.divideInPlace(new Vector3().setAll(asteroidPoints.length));
        this.radius = 0;
        asteroidPoints.forEach((p) => {
            this.radius = Math.max(this.radius, Vector3.Distance(this.position, p));
        });

        this.radius *= 4;
        /*
                this._debugSphere = MeshBuilder.CreateSphere("", {diameter: this.radius}, scene);
                this._debugSphere.position.copyFrom(this.position);
                this._debugSphere.visibility = 0.25;*/
    }

    public dispose(): void {
        if (this._debugSphere) {
            this._debugSphere.dispose();
        }
        this.asteroidRootTransform.dispose();
    }
}

export class World {
    private _starfield: Nullable<AbstractMesh>;
    private _asteroids: Array<Asteroid> = new Array<Asteroid>();
    private _renderObserver: Nullable<Observer<Scene>> = null;
    private _scene: Scene;
    private _planet: Mesh;
    private _atmosphere: Nullable<AbstractMesh> = null;
    private _tmpVec3: Vector3 = new Vector3();
    private _camera: Camera;
    public ship: Nullable<Ship> = null;
    public sun: VolumetricLightScatteringPostProcess;// VolumetricLightScatteringPostProcess（体积光散射后处理）是一种用于在场景中添加逼真的光线散射效果的后处理器
    /*
    这一段代码是一个构造函数，用于创建一个游戏场景，其中包含了星球、太阳、小行星等天体物体，并且在摄像机移动时改变这些天体物体的位置，使之看起来跟随摄像机移动。
    
    具体实现步骤如下：
    
    1.获取传入的 assets、scene、gameDefinition、camera 和glowLayer 参数。
    2.根据传入的 gameDefinition.seed 参数，设置一个随机种子 seed，以便后面的随机函数使用。
    3.将场景对象 scene 和相机对象 camera 保存到类属性中。
    4.设置星场背景模型，若该模型存在，则将其父级节点设置为 null ，从而脱离原有的场景结构，单独添加到当前新的场景中。
    5.创建行星模型，并设置其位置和大小。同时设置 GlowLayer 以产生光晕效果。
    6.创建太阳模型，并基于相机位置调整其位置和大小。
    7.使用循环语句依据 gameDefinition.asteroidCount 配置，创建小行星 Asteroid 对象，并添加到当前场景中。
    8.订阅 beforeRender 事件，根据当前摄像机的位置信息，更新星场、星球和太阳的位置和朝向等信息。
    这段代码的主要作用是创建一个带有星球、太阳、小行星等天体物体的游戏场景，并在摄像机移动时改变这些物体的位置，使之看起来跟随摄像机移动。
    */
    constructor(assets: Assets, scene: Scene, gameDefinition: GameDefinition, camera: Camera, glowLayer: GlowLayer) {
        seed = gameDefinition.seed;

        this._scene = scene;
        this._camera = camera;

        this._starfield = assets.starfield;
        if (this._starfield) {
            this._starfield.parent = null;
        }

        // planet
        this._planet = assets.planetBaker.createPlanet(scene, 1000, glowLayer);

        // sun
        this.sun = PlanetBaker.CreateSunPostProcess(camera, scene, assets);

        // asteroids
        for (let i = 0; i < gameDefinition.asteroidCount; i++) {
            this._asteroids.push(new Asteroid(assets, scene, gameDefinition.asteroidRadius));
        }

        this._renderObserver = scene.onBeforeRenderObservable.add(() => {
            const camera = (scene.activeCameras?.length && scene.activeCameras[0]) ? scene.activeCameras[0] : scene.activeCamera;
            if (camera) {
                const referencePosition = camera.position;
                if (referencePosition) {
                    if (this.ship && this._starfield) {
                        this._starfield.position.copyFrom(referencePosition);
                    }
                    if (this._planet && /*this._sun &&*/ this.ship) {
                        this._planet.position.copyFrom(referencePosition);
                        this._planet.position.z += 2500;

                        World.updateSunPostProcess(referencePosition, this.sun.mesh);
                    }
                }
            }
        });
    }
    /*
    首先，这个方法需要两个参数： referencePosition 和 sunMesh。referencePosition 是一个Vector3类型的参考点，表示太阳对应的空间位置； sunMesh 则表示太阳所在的网格对象。
    在 updateSunPostProcess 方法的实现中，首先将太阳网格对象的位置设置为参考点的位置，然后通过调整太阳网格对象的位置从而达到调整太阳的位置的目的。具体来说，通过将太阳网格对象向左移动0.47千米、向下移动0.09千米、向后移动0.86千米的方式，使得太阳看起来会在地平线附近升起或落下。    
    */
    public static updateSunPostProcess(referencePosition: Vector3, sunMesh: Mesh): void {
        sunMesh.position.copyFrom(referencePosition);
        sunMesh.position.x -= 0.47 * 1000;
        sunMesh.position.y -= -0.09 * 1000;
        sunMesh.position.z -= -0.86 * 1000;
    }

    public dispose(): void {
        this.sun.mesh.dispose();
        this.sun.dispose(this._camera);
        this._planet.dispose();
        this._asteroids.forEach((e) => { e.dispose(); });
        this._scene.onBeforeRenderObservable.remove(this._renderObserver);
    }
    /*
    这段代码是一个名为collideWithAsteroids的方法，它的作用是检测给定点是否与场景中的小行星碰撞。
    
    该方法有两个参数：一个Vector3类型的位置参数position和一个number类型的半径参数radius，分别表示要检测的位置和检测的半径范围。方法通过遍历场景中的所有小行星并计算它们与给定位置的距离，来判断给定位置是否与小行星碰撞。若存在碰撞，则返回true，否则返回false。
    
    小行星的碰撞被定义为小行星的表面与检测位置之间的距离小于等于半径参数radius和小行星半径的一半的差值。如果存在这样的小行星，则方法返回true，否则继续检测其他小行星。
    
    在检测时，还使用了一个更精确的近似方法。对于每个小行星，如果检测位置与小行星的表面距离小于等于小行星半径的一半和检测半径radius的差值，则会进一步检查小行星的子位置是否与检测位置距离小于等于子半径的一半和检测半径radius的差值。如果存在这样的子位置，则方法返回true，否则继续检测其他小行星。
    
    下面是一个使用该方法的示例：
    
    typescript
    // 假设场景中已经存在一个名为scene的Babylon.js场景对象
    // 创建一个位于(0, 100, 100)的位置向量
    const position = new BABYLON.Vector3(0, 100, 100);
    // 设置检测半径为50
    const radius = 50;
    // 调用方法检测碰撞
    const hasCollision = scene.collideWithAsteroids(position, radius);
    if (hasCollision) {
        console.log("发生碰撞");
    } else {
        console.log("未发生碰撞");
    }
    该示例在场景中创建一个位置向量，并设置检测半径为50。然后用该位置和半径调用collideWithAsteroids方法检测是否发生碰撞，结果会输出到控制台。
    */
    public collideWithAsteroids(position: Vector3, radius: number): boolean {
        for (let i = 0; i < this._asteroids.length; i++) {
            const asteroid = this._asteroids[i];
            if (!asteroid.asteroidRootTransform) {
                continue;
            }
            const distance = Vector3.Distance(position, asteroid.position);

            const delta = distance - radius - asteroid.radius * 0.5;
            if (delta < 0) {
                // finer approximation
                for (let sub = 0; sub < asteroid.subPosition.length; sub++) {
                    const distanceSub = Vector3.Distance(position, asteroid.subPosition[sub]);

                    const deltaSub = distance - radius - asteroid.subRadius[sub] * 0.5;
                    if (deltaSub < 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /*
    这段代码是一个名为shouldAvoid的方法，它的作用是检测给定点是否需要避开场景中的小行星。
    该方法有三个参数：一个Vector3类型的位置参数position、一个number类型的半径参数radius和一个Vector3类型的避开点位置参数avoidPos，分别表示要检测的位置、检测的半径范围和需要避开的点位置。方法通过遍历场景中的所有小行星并计算它们与给定位置的距离，来判断是否需要避开小行星。若需要避开，会在给定位置与小行星之间找到一个避开点，并将其存储在避开点位置参数avoidPos中，然后返回true，否则返回false。
    需要避开小行星被定义为小行星的表面与检测位置之间的距离小于等于半径参数radius和小行星半径的两倍的差值。如果存在这样的小行星，则方法会计算给定位置与小行星之间的向量，并将其投影到小行星表面上得到一个避开点。
    下面是一个使用该方法的示例：
    
    typescript
    // 假设场景中已经存在一个名为scene的Babylon.js场景对象
    // 创建一个位于(0, 50, 50)的位置向量
    const position = new BABYLON.Vector3(0, 50, 50);
    // 设置检测半径为20
    const radius = 20;
    // 创建一个避开点向量
    const avoidPos = new BABYLON.Vector3();
    // 调用方法检测是否需要避开
    const shouldAvoid = scene.shouldAvoid(position, radius, avoidPos);
    if (shouldAvoid) {
        console.log("需要避开小行星，避开点位置为：" + avoidPos);
    } else {
        console.log("不需要避开小行星");
    }
    该示例在场景中创建一个位置向量，并设置检测半径为20。然后用该位置和半径调用shouldAvoid方法检测是否需要避开小行星，如果需要，则输出避开点位置，否则输出不需要避开小行星的信息。
    */
    public shouldAvoid(position: Vector3, radius: number, avoidPos: Vector3): boolean {
        for (let i = 0; i < this._asteroids.length; i++) {
            const asteroid = this._asteroids[i];
            if (!asteroid.asteroidRootTransform) {
                continue;
            }
            const distance = Vector3.Distance(position, asteroid.position);

            const delta = distance - radius - asteroid.radius * 2;
            if (delta < 0) {
                position.subtractToRef(asteroid.position, this._tmpVec3);
                this._tmpVec3.normalize();
                this._tmpVec3.scaleInPlace(-delta);
                this._tmpVec3.addInPlace(position);
                avoidPos.copyFrom(this._tmpVec3);
                return true;
            }
        }
        return false;
    }
    /*
    这段代码是一个名为removeAsteroids的方法，它的作用是移除场景中位于给定位置和半径范围内的小行星。
    该方法有两个参数：一个Vector3类型的位置参数position和一个number类型的半径参数radius，分别表示要检测的位置和半径范围。方法会遍历场景中所有的小行星，计算每个小行星与给定位置之间的距离，判断它们是否在给定的半径范围内。
    如果是，则销毁该小行星并从小行星数组中移除，以实现移除小行星的效果。
    需要注意的是，在使用该方法前需要保证其所在的类（例如Scene对象）中已经有一个名为_asteroids的数组属性，该数组中包含了所有的小行星。所以这段代码应该是Scene类的一部分。
    下面是一个使用该方法的示例：
    typescript
    // 假设场景中已经存在一个名为scene的Babylon.js场景对象
    // 创建一个位于(0, 50, 50)的位置向量
    const position = new BABYLON.Vector3(0, 50, 50);
    // 设置检测半径为20
    const radius = 20;
    // 移除所有位于给定位置和半径范围内的小行星
    scene.removeAsteroids(position, radius);
    该示例创建了一个位置向量和半径，然后将它们作为参数传递给removeAsteroids方法来移除场景中所有位于这个半径范围内的小行星。
    */
    public removeAsteroids(position: Vector3, radius: number): void {
        console.log("asteroid count before ", this._asteroids.length);
        for (let i = this._asteroids.length - 1; i >= 0; i--) {
            const asteroid = this._asteroids[i];
            const distance = Vector3.Distance(position, asteroid.position);

            const delta = distance - radius - asteroid.radius;
            if (delta < 0) {
                asteroid.dispose();
                this._asteroids.splice(i, 1);
            }
        }
        console.log("asteroid count after ", this._asteroids.length);
    }
}