import { Node, Nullable, Vector3, Quaternion, Color3, AbstractMesh, Mesh, MeshBuilder, Vector2, Scene, Matrix, Sound, TransformNode, NodeMaterial, InputBlock, Engine, NodeMaterialBlock, GlowLayer } from "@babylonjs/core";
import { Agent } from "./Agent";
import { Input } from "./Inputs/Input";
import { MissileManager, MISSILE_MAX_LIFE } from "./Missile";
import { MAX_SHOTS, ShotManager } from "./Shot";
import { Assets } from "./Assets";
import { Trail, TrailManager } from "./FX/Trail";
import { SparksEffect, SparksEffects } from "./FX/SparksEffect";
import { ShipCamera } from "./ShipCamera";
import { TextBlock } from "@babylonjs/gui";
import { Parameters } from './Parameters';
import { States } from "./States/States";
import { State } from "./States/State";
import { ExplosionManager } from "./FX/Explosion";
import { World } from "./World";
import { GameDefinition } from "./Game";

enum AIState {
    WANDER = "wander",
    CHASE = "chase",
    EVADE = "evade",
    RETURN = "return",
    AVOID = "Avoid Asteroid",
}

enum ShipManeuver {
    NONE = -1,
    IMMELMANN = 0
}

const factions = [
    {
        trail: {
            color: new Color3(0.64, 0.42, 0.15)
        }
    },
    {
        trail: {
            color: new Color3(0.12, 0.56, 0.62)
        }
    }
];

export class Statistics {
    damageDealt: number = 0;//造成的伤害
    damageTaken: number = 0;//承受伤害
    shipsDestroyed: number = 0;
    timeOfBattle: number = 0;
    shotFired: number = 0;
    shotHitting: number = 0;
    missilesFired: number = 0;
    static alliesCrash: number = 0;
    static enemiesCrash: number = 0;

    // damageDealt加一
    addDamageDealt(): void {
        this.damageDealt++;
    }

    // damageTaken加一
    addDamageTaken(): void {
        this.damageTaken++;
    }

    // shipsDestroyed加一
    addShipDestroyed(): void {
        this.shipsDestroyed++;
    }

    // timeOfBattle加time
    addTimeOfBattle(time: number): void {
        this.timeOfBattle += time;
    }

    // shotFired加一
    addShotFired(): void {
        this.shotFired++;
    }

    // shotHitting加一
    addShotHitting(): void {
        this.shotHitting++;
    }

    // missilesFired加一
    addMissilesFired(): void {
        this.missilesFired++;
    }

    // alliesCrash加一
    static addCrashAlly(): void {
        this.alliesCrash++;
    }
    // enemiesCrash加一
    static addCrashEnemy(): void {
        this.enemiesCrash++;
    }
}

export class Ship extends Agent {
    /*
    这段代码定义了一个名为Ship的类，它继承自Agent类。该类表示游戏中的一艘飞船，并包含了许多属性和方法来描述和操作这个飞船。
    该类包含了许多属性，例如missileCooldown、roll、velocity、trail等等。这些属性分别表示该飞船的导弹冷却时间、翻滚角度、速度、尾迹等等。
    除了这些常规属性外，还有一些较为特殊的属性，例如cannonR、cannonL、life、bursting等等。这些属性分别表示该飞船的右炮管、左炮管、生命值、爆炸程度等等。
    在该类中还定义了一些方法，例如constructor、onHit、fireMissile等等。这些方法用于创建实例、处理被击中、发射导弹等等。
    */
    public missileCooldown: number = 0;// 导弹冷却时间
    roll: number = 0;// 翻滚角度
    root: TransformNode;// 根节点
    velocity: number = 0;// 速度
    speedRatio: number = 0;// 速度比率
    trail: Nullable<Trail> = null;// 轨迹
    isHuman: boolean = false;// 是否为人类
    faction: number = 0;// 阵营
    cannonIndex: number = 0;// 加农炮索引
    localEye: Vector3 = new Vector3(0, 0, 0);// 视点位置
    localTarget: Vector3 = new Vector3(0, 0, 0);// 目标位置
    shipMesh: Nullable<AbstractMesh> = null;// 飞船网格
    cannonR: Nullable<Vector3> = null; // 右侧加农炮位置
    cannonL: Nullable<Vector3> = null;// 左侧加农炮位置
    life: number = -1;// 生命值
    bursting: number = 0;// 爆炸状态
    bestPrey: number = -1;// 最佳猎物
    bestPreyTime: number = 0;// 最佳猎物时间
    // for debugging purposes (remove later)
    // shows where the ship is trying to fly
    targetSphere: Nullable<Mesh>;// 目标球体，用于调试
    evadeTimer: number = 0;// 逃避计时器
    state: AIState = AIState.WANDER;// AI状态
    dotToEnemy = 0; // 与敌人的点积
    dotToAlly = 0;// 与盟友的点积
    currentThusterPower = 1;// 当前推进器功率
    debugLabel: Nullable<TextBlock> = null;// 调试标签
    evadeTo = Vector3.Zero();// 逃避位置
    maneuver = ShipManeuver.NONE;// 飞船机动状态
    maneuverTimer = 0;// 机动计时器
    statistics: Nullable<Statistics> = null;// 统计信息
    shipCamera: Nullable<ShipCamera> = null;// 飞船相机
    public laserHit: Nullable<Sound> = null;// 激光命中音效
    public laser: Nullable<Sound[]> = null;// 激光音效
    public missileSfx: Nullable<Sound> = null;// 导弹音效
    public explosionSfx: Nullable<Sound[]> = null;// 爆炸音效
    public shieldMain: Nullable<Mesh> = null;// 主护盾网格
    private _assets: Assets;// 资源
    shieldEffectMaterial: Nullable<NodeMaterial> = null;// 护盾效果材质
    public availableMissiles: number = 0;// 可用导弹数量
    public lastDecal: Nullable<Mesh> = null;// 上一个弹痕网格
    public lastDecalTime: number = 0;// 上一个弹痕时间
    public vortexPowerBlocks: InputBlock[] = [];// 涡轮引擎功率块
    public thrusterPowerBlocks: InputBlock[] = [];// 推进器功率块
    private _glowLayer: GlowLayer;// 发光层

    /*
    这段代码是一个类的构造函数，该类表示一个飞船对象，在 Babylon.js 场景中进行渲染和交互。构造函数接受三个参数，分别是 assets、scene 和 glowLayer。
    在构造函数中，首先调用了父类（AbstractMesh）的构造函数，并且初始化了一个 _assets 属性和一个 targetSphere 属性，并将 _glowLayer 属性设置为传入的 glowLayer 参数。其中，_assets 属性是该飞船所需的资源包，包括模型、纹理、材质等。
    然后，构造函数创建了一个名为 "ShipRoot" 的新 TransformNode，并将其赋值给了 this.root 属性，表示该飞船的基准点。随后，设置了 this.root 的旋转四元数为单位四元数 Quaternion.Identity()。
    接下来，如果全局参数 Parameters.enableAudio 设置为 true，则通过 assets 对象获取音频资源，并对它们进行 clone() 复制处理，在飞船对象中保存下来以备后用。
    最后，调用了 this.tickEnabled() 方法，使得飞船对象能够被场景循环调用并更新状态。
    该构造函数是整个飞船对象的初始化函数，通过初始化资源、创建 TransformNode 等操作，从而实现了在 Babylon.js 场景中渲染和交互的目的。
    */
    constructor(assets: Assets, scene: Scene, glowLayer: GlowLayer) {
        super();
        this._assets = assets;
        this.targetSphere = null;
        this._glowLayer = glowLayer;

        this.root = new TransformNode("ShipRoot", scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.shieldEffectMaterial = assets.shieldEffectMaterial;

        if (Parameters.enableAudio) {
            this.laserHit = this._assets.audio?.laserHitSound.clone() as Sound;

            this.missileSfx = this._assets.audio?.missileFireSound.clone() as Sound;
            this.explosionSfx = [this._assets.audio?.explosionSounds[0].clone() as Sound,
            this._assets.audio?.explosionSounds[1].clone() as Sound];
        }
        this.tickEnabled();
    }
    /*
    这段代码是一个名为 setThrusterPower 的公共方法，用于设置飞船的推进器功率。该方法接受一个 number 类型的参数 power，表示将要设置的推进器的功率值。
    首先，方法会计算当前的推进器功率值 currentThusterPower ，使用了一个简单的线性插值方式，即每次将目标功率值与当前功率值之差的 2% 作为本次修改的量，从而实现推进器逐渐达到目标功率的效果。
    接下来，方法会遍历 vortexPowerBlocks 和 thrusterPowerBlocks 数组中的 InputBlock 对象，并将它们的 value 属性设置为当前的推进器功率值 currentThusterPower 。
    这两个数组分别表示翻转推进器和前向推进器，通过设置这些 InputBlock 的 value 属性，可以更新这些推进器的材质效果，使其表现出飞船推进的效果。
    该方法是属于 Babylon.js 中的一段处理飞船推进器和护盾效果的代码，用于设置飞船的推进器功率以及推进器的材质效果。
    */
    public setThrusterPower(power: number): void {
        this.currentThusterPower = this.currentThusterPower + (power - this.currentThusterPower) * 0.02;
        this.vortexPowerBlocks.forEach((i: InputBlock) => {
            i.value = this.currentThusterPower;
        });
        this.thrusterPowerBlocks.forEach((i: InputBlock) => {
            i.value = this.currentThusterPower;
        });
    }
    /*
    这段代码是使用 Babylon.js 创建游戏中飞船对象的一个方法。下面是该方法的主要解释和使用情景：
    该方法通过接收一些参数生成一个新的飞船对象。其中，position 是代表飞船的位置，quat 是代表飞船的旋转方向，isHuman 表示是否为人类飞船，faction 则表示飞船所属阵营。此外，还传入了一个轨迹管理器（trailManager）、生命值（life）等信息。
    首先，方法将飞船对象的位置和旋转设置为传入的参数值，并将其属性进行初始化。然后，通过 Babylon.js 的 clone 方法克隆出一个船模型对象，并设置其父级为飞船对象。
    接着，如果是人类飞船，则为其创建一个 Statistics 对象。在飞船上添加 Trail 效果，并设置其颜色和可见性。如果开启了音频功能，则为飞船创建 Sound 对象，并附加到其上。
    最后，根据飞船类型调整其相关属性，并开启定时器（tickEnabled）以更新飞船状态。
    这段代码适用于基于 Babylon.js 的太空射击游戏或者其他类似的场景。在游戏中，玩家可以选择不同的飞船类型和阵营，并使用该方法生成自己的飞船对象。该方法可以帮助开发者在游戏中快速创建复杂的飞行器，并通过参数灵活配置其属性和效果。
    */
    public spawn(position: Vector3, quat: Quaternion, isHuman: boolean, faction: number, trailManager: TrailManager, life: number): void {
        this.root.position = position;
        this.root.rotationQuaternion = quat;
        this.quat = quat.clone();
        this.isHuman = isHuman;
        this.faction = faction;
        this.life = life;
        const isValkyrie = !faction;
        var clone;
        if (this._assets.valkyrie && this._assets.raider) {
            if (isValkyrie) {
                clone = this._assets.valkyrie.clone("valkyrie", null);
            } else {
                clone = this._assets.raider.clone("raider", null);
            }
        }
        if (clone) {
            this.shipMesh = clone;
            this.shipMesh.parent = this.root;
            this.shipMesh.scaling = this.shipMesh.scaling.scale(25);
        } else {
            this.shipMesh = new AbstractMesh("null");
        }

        this.cannonR = isValkyrie ? this._assets.valkyriecannonR : this._assets.raidercannonR;
        this.cannonL = isValkyrie ? this._assets.valkyriecannonL : this._assets.raidercannonL;

        if (isHuman) {
            this.statistics = new Statistics;
        }

        this.trail = trailManager.spawnTrail(position, isValkyrie ? 1 : 2);
        if (this.trail) {
            this.trail.setParameters(factions[faction].trail.color, 1);
            this.trail.setVisible(!isHuman);
        }
        if (this.laser && this.laserHit) {
            this.laser.forEach((laser: any) => laser.attachToMesh(this.shipMesh!));
            this.laserHit.attachToMesh(this.root);
        }
        if (Parameters.enableAudio) {
            const lasers = isHuman ? this._assets.audio?.heroLaserSounds : this._assets.audio?.raiderLaserSounds;
            if (lasers) {
                this.laser = [lasers[0].clone() as Sound,
                lasers[1].clone() as Sound,
                lasers[2].clone() as Sound];
            }
        }

        Ship.HandleThrustersShield(this._assets, this, this.shipMesh, isValkyrie, 0, this._glowLayer);

        this.availableMissiles = isValkyrie ? 8 : 0;
        this.tickEnabled();
    }
    /*
    这是一段使用 Babylon.js 构建3D场景的代码。此代码是处理飞船的推进器和护盾效果的方法，需要传入参数：
    
    assets: 包含了素材的对象。
    ship: 可选参数，表示当前的飞船。
    shipMesh: 飞船的3D模型。
    isValkyrie: 一个布尔值，表示是否为瓦尔基里型号的飞船。
    defaultThrusterValue: 默认的推进器功率。
    glowLayer: GlowLayer对象，表示发光效果的图层。
    首先，该方法会遍历飞船3D模型的子节点，并根据名称找到护盾和推进器的模型。如果传入了飞船对象，方法会将护盾模型从其父节点中删除，并将其旋转，并设置位置和缩放。
    对于所有的推进器模型，方法还会复制它们并将其覆盖原有的模型，然后为它们设置材质，并修改一些材质的属性，比如颜色等。最后，这个方法会将所有的推进器的参数（如随机偏移等）设置好，并添加它们的power block到对应的数组中。
    
    注意到这段代码中有两处“GLOW LAYER ISSUE”注释，因为代码中使用了 GlowLayer 来实现飞船的发光效果，但目前的版本存在一些问题，不能使用该方法。
    */
    /*
    TypeScript 中的参数传递方式是：如果参数是对象、数组、函数等引用类型，那么传递的是引用而不是值。因此，在函数内部修改该参数，原始对象也会被修改。
    TypeScript 中的引用类型包括对象（Object）、数组（Array）、函数（Function）、正则表达式（RegExp）等。这些类型在内存中都是以引用方式存在的，即保存的是指向该对象/数组/函数/正则表达式所在内存地址的指针。

    此外，TypeScript 还可以定义自定义的类，也可以通过接口来定义对象类型。这些类和接口在使用时同样也是引用类型。
    
    引用类型的特点是：赋值或传参时都是传递引用而非值的副本，所以如果对引用类型的值进行修改，那么所有引用到该值的地方都会发生改变。
    */

    public static HandleThrustersShield(assets: Assets, ship: Nullable<Ship>, shipMesh: AbstractMesh, isValkyrie: boolean, defaultThrusterValue: number, glowLayer: GlowLayer): void {
        let thrusters: TransformNode[] = [];
        shipMesh.getChildTransformNodes(false).forEach((m: TransformNode) => {
            if (m.name.endsWith(isValkyrie ? "valkyrieShield_mesh" : "raiderShield_mesh")) {
                if (ship) {
                    ship.shieldMain = m as Mesh;
                    ship.shieldMain.parent = null;
                    ship.shieldMain.rotation.set(0, Math.PI, 0);

                    /*
                    这段代码中的数字是用来设置飞船护盾的位置和缩放比例的。具体来说，0.015 * 25 * 1.85 是用来设置护盾在 Y 轴方向上的偏移量，
                    其中 0.015 表示原始模型中护盾相对于飞船本身的偏移量，
                    25 表示一个单位长度在游戏中对应多少个实际长度（通常称为缩放比例），
                    而 1.85 则是一个调整因子，用于微调护盾的位置。
                    类似地，25 * 1.85 表示了护盾在 X、Y、Z 轴上的缩放比例。这里同样使用了一个调整因子 1.85 来微调大小。
                    这些数字可能会因为开发者个人喜好或游戏需求而有所不同，并没有固定的规定。
                     */
                    if (isValkyrie) {
                        ship.shieldMain.position.set(0, 0.015 * 25 * 1.85, 0);
                        ship.shieldMain.scaling.set(25 * 1.85, 25 * 1.85, 25 * 1.85);
                    } else {
                        ship.shieldMain.position.set(0, -0.009 * 25, 0.02 * 25 * 3.718);
                        ship.shieldMain.scaling.set(25 * 5.451, 25 * 1, 25 * 3.718);
                    }
                    ship.shieldMain.scaling.multiplyInPlace(new Vector3(-1, 1, 1));
                    ship.shieldMain.setEnabled(false);
                }
            }

            // 与相应的渲染对象关联起来
            if (m.name.endsWith("valkyrie_thruster_L1") ||
                m.name.endsWith("valkyrie_thruster_L2") ||
                m.name.endsWith("valkyrie_thruster_R1") ||
                m.name.endsWith("valkyrie_thruster_R2") ||
                m.name.endsWith("raider_thruster_L") ||
                m.name.endsWith("raider_thruster_R")) {
                thrusters.push(m);
            }
        });

        // clone thrusters
        if (ship) {
            ship.vortexPowerBlocks = [];
            ship.thrusterPowerBlocks = [];
        }
        thrusters.forEach((thruster: TransformNode) => {
            let thrusterMesh = assets.thrusterMesh?.clone("thruster", thruster);

            if (assets.thrusterShader && assets.vortexShader) {
                const thrusterMat = assets.thrusterShader.clone("thrusterMat_" + thruster.name);
                if (thrusterMat && thrusterMesh) {
                    thrusterMesh.material = thrusterMat;
                    //GLOW LAYER ISSUE
                    //glowLayer.referenceMeshToUseItsOwnMaterial(thrusterMesh);

                    if (thrusterMat) {
                        (thrusterMat.getBlockByName("rand") as InputBlock).value = new Vector2(Math.random(), Math.random());
                        const thrusterPowerBlock = thrusterMat.getBlockByName("power") as InputBlock;
                        thrusterPowerBlock.value = defaultThrusterValue;
                        if (ship) {
                            ship.thrusterPowerBlocks.push(thrusterPowerBlock);
                        }

                        if (isValkyrie) {
                            (thrusterMat.getBlockByName("coreColor") as InputBlock).value = Color3.FromInts(211, 20, 20);
                            (thrusterMat.getBlockByName("midColor") as InputBlock).value = Color3.FromInts(211, 100, 20);
                            (thrusterMat.getBlockByName("sparkColor") as InputBlock).value = Color3.FromInts(216, 168, 48);
                            (thrusterMat.getBlockByName("afterburnerColor") as InputBlock).value = Color3.FromInts(229, 13, 248);
                        } else {
                            (thrusterMat.getBlockByName("coreColor") as InputBlock).value = Color3.FromInts(24, 122, 156);
                            (thrusterMat.getBlockByName("midColor") as InputBlock).value = Color3.FromInts(49, 225, 230);
                            (thrusterMat.getBlockByName("sparkColor") as InputBlock).value = Color3.FromInts(48, 216, 167);
                            (thrusterMat.getBlockByName("afterburnerColor") as InputBlock).value = Color3.FromInts(13, 248, 168);
                        }
                    }
                }
                if (isValkyrie) {
                    let vortexMesh = assets.vortexMesh?.clone("vortex", thruster);
                    const vortexMat = assets.vortexShader?.clone("vortexMat_" + thruster.name);
                    if (vortexMat && vortexMesh) {
                        vortexMesh.material = vortexMat;
                        //GLOW LAYER ISSUE
                        //glowLayer.referenceMeshToUseItsOwnMaterial(vortexMesh);
                        (vortexMat.getBlockByName("rand") as InputBlock).value = new Vector2(Math.random(), Math.random());
                        const vortexPowerBlock = vortexMat.getBlockByName("power") as InputBlock;
                        vortexPowerBlock.value = defaultThrusterValue;
                        if (ship) {
                            ship.vortexPowerBlocks.push(vortexPowerBlock);
                        }
                        if (thruster.name.endsWith("valkyrie_thruster_L1") || thruster.name.endsWith("valkyrie_thruster_L2")) {
                            (vortexMat.getBlockByName("direction") as InputBlock).value = 1;
                        } else {
                            (vortexMat.getBlockByName("direction") as InputBlock).value = -1;
                        }
                    }
                }
            }
        });
    }

    public isValid(): boolean {
        return this.life > 0;
    }
    /*
    这段代码是一个名为 tickEnabled 的公共方法，用于决定飞船对象在场景中是否可见。该方法通过检查当前飞船对象的 isValid() 方法返回值，来确定是否显示飞船模型。
    其中，isValid() 方法是该飞船对象使用者在调用前应该实现的方法，用于判断当前飞船对象是否存在或有效。如果 isValid() 返回 true，则表示飞船对象合法有效，并且可以在场景中正常显示；否则，将禁用飞船对象的渲染。
    在该方法中，使用了带问号的成员访问操作符 ?，表示当 this.shipMesh 不为 null 或 undefined 时，才会执行 setEnabled() 方法，否则将不做任何操作。
    该方法适用于通过 isValid() 方法来判断飞船对象是否有效，并控制它在场景中的可见性。当 isValid() 返回 false 时，能够及时禁用飞船的渲染，提升应用程序的性能表现。
    */
    public tickEnabled(): void {
        this.shipMesh?.setEnabled(this.isValid());
    }
    /*
    这段代码是一个名为 fireMissile 的公共方法，用于发射导弹。该方法接受两个参数，分别是 missileManager 和 bestPrey。
    在方法体内，首先检查当前飞船对象的 shipMesh 属性是否存在，如果不存在则直接返回 null。接下来，通过 this.availableMissiles 属性来获取导弹的名称，并在飞船的 mesh 中查找该导弹的 TransformNode 节点。
    如果找不到导弹的 TransformNode，则返回 null；否则，将导弹从父节点中解除绑定，重置导弹的变换属性，包括位置、旋转、缩放等，并设置导弹的状态为可用。
    然后，使用获取到的导弹 TransformNode 和其他参数，调用 missileManager 对象的 fireMissile 方法，实现发射导弹的操作。
    最后，将飞船对象的 availableMissiles 属性减 1，并返回发射的导弹 TransformNode 对象。
    该方法适用于在 Babylon.js 场景中控制导弹的发射。通过传入 missileManager 和 bestPrey 参数，可以实现对导弹的管理和寻找目标的操作，同时更新飞船对象的可用导弹数量。
    */
    public fireMissile(missileManager: MissileManager, bestPrey: Ship): Nullable<TransformNode> {
        if (!this.shipMesh) {
            return null;
        }
        const missileName = "valkyrie_missileMount" + this.availableMissiles;
        const missileTransform = this.shipMesh.getChildTransformNodes(false, (node: Node) => { return (node as TransformNode).name.endsWith(missileName); })[0];
        if (!missileTransform) {
            return null;
        }
        const worldPosition = new Vector3;
        const worldOrientation = new Quaternion;
        missileTransform.computeWorldMatrix(true);
        missileTransform.getWorldMatrix().decompose(undefined, worldOrientation, worldPosition);
        missileTransform.parent = null;

        missileTransform.getChildMeshes()[0].position.scaleInPlace(25)
        missileTransform.getChildMeshes()[0].rotationQuaternion = null;
        missileTransform.getChildMeshes()[0].rotation.setAll(0);
        missileTransform.getChildMeshes()[0].scaling = new Vector3(25, 25, 25);
        missileTransform.position = worldPosition;
        missileTransform.scaling.setAll(1);
        missileTransform.rotation.setAll(0);
        missileTransform.rotationQuaternion = worldOrientation;

        missileManager.fireMissile(worldPosition, worldOrientation, bestPrey, this, missileTransform);
        this.availableMissiles--;
        return missileTransform;
    }

    dispose() {
        this.root.dispose();
        this.shipMesh?.dispose();
        if (this.trail) {
            this.trail.dispose();
        }
        if (this.targetSphere) {
            this.targetSphere.dispose();
        }
        if (this.debugLabel) {
            this.debugLabel.dispose();
        }
        if (Parameters.enableAudio) {
            this.laserHit?.dispose();
            this.laser?.forEach((laser: Sound) => laser.dispose());
            this.missileSfx?.dispose();
            this.explosionSfx?.forEach((explosion: Sound) => explosion.dispose());
        }
        if (this.shipCamera) {
            this.shipCamera.dispose();
        }
    }
}

export class ShipManager {
    ships = new Array<Ship>();
    private _gameDefinition: GameDefinition;
    shipIndexToFollow = 0;
    _missileManager: MissileManager;
    _shotManager: ShotManager;
    private _trailManager: TrailManager;
    time: number = 0;
    _scene: Scene;
    private _tmpVec3 = new Vector3(0, 0, 0);
    private _assets: Assets;
    private _tempMatrix = new Matrix();
    private _avoidPos = new Vector3();
    private static _tmpMatrix = new Matrix;
    //private _glowLayer: GlowLayer;

    /*
    这段代码是一个名为构造函数（constructor）的方法，用于初始化游戏场景中的飞船对象。该构造函数接收多个参数，包括 missileManager、shotManager、assets、trailManager、scene、maxShips、gameDefinition 和 glowLayer。
    在方法体内，通过在循环中创建 Ship 对象并添加到 ships 数组中，可以创建多个飞船对象来实现对游戏场景中飞船对象的管理。
    同时，在构造函数中还设置了一些统计信息的初始值，如 alliesCrash 和 enemiesCrash，用于记录玩家和敌人的飞船相撞次数。
    该构造函数适用于在创建 Babylon.js 场景中的 Ship 对象，并初始化它们的属性。通过传入不同的参数，可以创建不同类型的飞船对象，以及定义它们的行为和外观等属性。同时，可以记录一些统计信息，用于分析和优化游戏玩法。
    */
    constructor(missileManager: MissileManager, shotManager: ShotManager, assets: Assets, trailManager: TrailManager, scene: Scene, maxShips: number, gameDefinition: GameDefinition, glowLayer: GlowLayer) {
        this._gameDefinition = gameDefinition;
        this._missileManager = missileManager;
        this._shotManager = shotManager;
        this._scene = scene;
        this._assets = assets;
        this._trailManager = trailManager;
        //this._glowLayer = glowLayer;

        for (let i = 0; i < maxShips; i++) {
            this.ships.push(new Ship(this._assets, this._scene, glowLayer));
        }

        Statistics.alliesCrash = 0;
        Statistics.enemiesCrash = 0;
    }

    /*
    spawnShip 方法的作用是在游戏场景中生成一个新的飞船对象，具体实现如下：

    首先，该方法接收了四个参数：position 表示生成位置，quat 表示生成方向，isHuman 表示是否为人类飞船，faction 则表示飞船所属阵营。

    接着，在 for 循环中遍历了当前可用的所有飞船对象，找到第一个空闲的飞船对象，并对其进行初始化操作。

    将飞船对象的状态设置为有效（isValid）。

    根据传入的参数，设置飞船的各个属性，包括位置、旋转、是否为人类飞船、所属阵营、生命值等。

    如果是人类飞船，则根据阵营不同，为其设置不同的生命值。

    调用轨迹管理器（trailManager）的 addTrail 方法，为飞船添加轨迹效果。

    返回飞船对象。

    如果所有的飞船对象都已经被占用，则该方法会返回 null，表示生成飞船失败。

    使用 spawnShip 方法的例子可以是一个多人在线的太空战斗游戏，玩家可以自由选择不同的飞船类型和阵营，参与连续不断的战斗。在游戏中，每个玩家都可以使用 spawnShip 方法生成自己的飞船对象，并通过其进行操作和交互。该方法可以确保所有的飞船对象都是经过管理和复用的，避免了频繁创建和销毁大量对象带来的性能消耗和卡顿。
    */
    spawnShip(position: Vector3, quat: Quaternion, isHuman: boolean, faction: number): Nullable<Ship> {
        for (let i = 0; i < this.ships.length; i++) {
            if (!this.ships[i].isValid()) {
                const ship = this.ships[i];
                const life = isHuman ? (faction ? this._gameDefinition.humanEnemiesLife : this._gameDefinition.humanAlliesLife) :
                    (faction ? this._gameDefinition.aiEnemiesLife : this._gameDefinition.aiAlliesLife);
                ship.spawn(position, quat, isHuman, faction, this._trailManager, life);
                return ship;
            }
        }
        // fatal error
        return null;
    }

    destroyShip(shipIndex: number) {
        console.log(`destroying ${shipIndex}`)
        const ship = this.ships[shipIndex];
        this._shotManager.shots.forEach(shot => {
            if (shot.firedBy === ship) {
                shot.firedBy = undefined;
            }
        });
        ship.trail?.invalidate();
        ship.shipMesh?.setEnabled(false);
        ship.bursting = 0;

        this.ships.forEach(otherShip => {
            if (otherShip.isValid() && otherShip.bestPrey == shipIndex) {
                otherShip.bestPrey = -1;
                otherShip.bestPreyTime = 0;
            }
        })
    }
    /*
    这段代码是一个名为 findBestPreyFor 的方法，用于寻找最佳的目标飞船，以便进行攻击。该方法接收一个参数 index，表示要查找的飞船对象在 ships 数组中的索引。
    在方法体内，首先获取 ships 数组和位于 index 索引处的 Ship 对象。然后，通过遍历所有有效的飞船对象，检查每个飞船是否符合一些条件，如是否在屏幕上、是否属于同一阵营等，以决定是否将其作为目标进行攻击。
    对于每个可攻击的敌方飞船，计算当前飞船与该目标飞船之间的夹角，并将其保存到 dot 变量中。如果该目标飞船是当前飞船可以选择的最佳目标，则更新 bestToChase 变量。
    同时，记录当前飞船与其他飞船之间的夹角信息，以供后续判断使用。最后返回最佳的目标飞船的索引。
    该方法适用于在 Babylon.js 游戏场景中，基于某些条件来寻找最佳的攻击目标。通过传入不同的参数，可以定制不同类型的查找逻辑，以满足游戏玩家的需求。
    */
    findBestPreyFor(index: number) {
        const ships = this.ships;
        const ship = ships[index];
        let bestToChase = -1;
        let bestDot = Parameters.AIPerceptionCone
        ship.dotToEnemy = Parameters.AIPerceptionCone;
        ship.dotToAlly = Parameters.AIPerceptionCone;
        for (let other = 0; other < ships.length; other++) {
            if (!ships[other].isValid()) {
                continue;
            }
            if (ship.shipCamera) {
                const onScreen = ship.shipCamera.isOnScreen(ships[other].root.position);
                if (!onScreen) {
                    continue;
                }
            }
            if (other != index) {
                const dot = ShipManager.dotToTarget(ship, ships[other].root.position)
                if (ship.faction != ships[other].faction && dot > ship.dotToEnemy /*&& chaseDot < 0.997*/) {
                    if ((ship.isHuman || this.howManyTargeting(other) <= Parameters.AIMaxTargets) && dot > bestDot) {
                        bestDot = dot;
                        bestToChase = other;
                    }
                    bestToChase = other;
                    ship.dotToEnemy = dot;
                } else if (ship.faction == ships[other].faction && dot > ship.dotToAlly) {
                    ship.dotToAlly = dot;
                }
            }
        }
        return bestToChase;
    }
    /*
    这段代码是一个名为 dotToTarget 的静态方法，其作用是计算一个给定的飞船对象是否朝向了目标位置（position），并返回一个夹角系数（dot）。
    该方法接收两个参数：一个 Ship 类型的对象（表示飞船），以及一个 Vector3 类型的对象（表示目标位置的向量）。
    在方法体内，首先计算出从飞船位置指向目标位置的向量 chaseDir，并将其标准化。然后使用 Vector3.Dot 方法计算出当前飞船正方向与 chaseDir 之间的夹角系数，并将该结果作为函数的返回值。
    这个夹角系数 dot 的取值范围为 -1.0 到 1.0，其中：
    当 dot 等于 1.0 时，表示当前飞船正对着目标位置；
    当 dot 小于 0 时，表示当前飞船背对着目标位置；
    当 dot 等于 0 时，表示当前飞船与目标位置垂直。
    该方法适用于处理 Babylon.js 游戏场景中飞船的移动和旋转，例如在空战游戏中判断飞船是否瞄准了目标，或者在太空探险类游戏中判断飞船是否朝向了目标行星等。
    */
    // tells you whether ship is aiming towards position
    // 1.0 = exactly facing shipB
    // -1.0 = facing away from shipB
    // 0.0 = perpendicular
    public static dotToTarget(ship: Ship, position: Vector3) {
        const chaseDir = position.subtract(ship.root.position);
        chaseDir.normalize();
        return Vector3.Dot(ship.forward, chaseDir);
    }
    /*
    这段代码是一个方法，其名称为 howManyTargeting，它接收一个整型参数 targetIndex。这个方法用于计算非玩家控制（!ship.isHuman）的飞船中有多少正在瞄准指定的目标编号 targetIndex（即 ship.bestPrey 等于 targetIndex）的飞船。其中：
    使用 let count = 0 定义变量 count 进行计数。
    使用 forEach 方法遍历每个飞船，并对符合条件的飞船进行计数操作。条件为：飞船不是玩家控制的、不是目标本身、且飞船正在瞄准指定的目标。
    返回计数结果。
    这个方法可以用于游戏中计算某个目标被多少个敌对飞船瞄准，从而在游戏逻辑中做出相应的判断和处理。例如，在某个飞船攻击时，可以根据目标正在受到多少个敌对飞船瞄准来调整攻击能力等参数，增加游戏难度或提供更加真实的游戏体验。
    */
    howManyTargeting(targetIndex: number) {
        let count = 0;
        this.ships.forEach((ship, index) => {
            if (!ship.isHuman && index != targetIndex && ship.bestPrey == targetIndex) count++;
        })
        return count;
    }

    /*
1
    这段代码是 tick 方法，用于每一帧的游戏逻辑更新。该方法接受多个参数，包括当前能否发射子弹、玩家或AI的输入、时间间隔、游戏速度等参数。除此之外，还会传入一些引用类型的对象，如火花（sparksEffects）、爆炸管理器（explosionManager）和世界（world）等。

    首先，代码检查游戏速度是否太低（小于0.001），如果是，则直接跳过该帧的逻辑计算。

    接着，对所有的飞船进行遍历，并依次执行以下操作：

    检查上一次挂载的弹孔贴图是否要被清除，并移除该贴图。
    调用ship.tickEnabled()方法，这个方法处理了飞船的准星显示和敌机信息等。
    检查飞船是否仍然有效。如果无效，则跳过该飞船的逻辑计算。
    根据飞船类型（人类或AI），调用不同的逻辑处理方法。
    处理飞船的各种碰撞、攻击等逻辑。
    如果是人类飞船，检查导弹冷却时间，更新最佳目标（bestPrey）。同时，如果声音资源可用，则根据加速度设置喷气声音的音量。
    处理与小行星的碰撞检查。
    处理飞船结束生命周期的逻辑，即在飞船失去生命后从场景中移除。
    总体来说，这段代码是游戏逻辑的核心部分，负责控制飞船的运动、攻击和碰撞等行为，并更新游戏中的各种效果。
2
    这段 tick 方法的作用是更新游戏的各种物理和逻辑行为，具体实现如下：

    首先，判断当前游戏速度是否太低，如果太低则直接跳过该帧的逻辑计算。

    接着，对游戏中所有的飞船进行循环遍历，并一一执行以下操作：

    检查当前飞船上一次挂载的弹孔贴图是否需要清除，并移除该贴图。

    调用 ship.tickEnabled() 方法，这个方法主要处理了飞船的准星显示和敌机信息等。

    检查当前飞船是否有效。如果无效，则跳过该飞船的逻辑计算。

    根据飞船类型（人类或AI），调用不同的逻辑处理方法。

    处理飞船的各种碰撞、攻击等逻辑。

    如果是人类飞船，检查导弹冷却时间，更新最佳目标（ bestPrey ）。同时，如果声音资源可用，则根据加速度设置喷气声音的音量。

    处理与小行星的碰撞检查。

    处理飞船结束生命周期的逻辑，即在飞船失去生命后从场景中移除。

    以上操作都会影响到游戏中各种效果的表现，比如飞船移动、攻击、爆炸等。实现这些效果的细节需要根据具体场景和需求来选择不同的函数和方法，例如在第五步中调用了 _tickShipVsShots 和 _tickShipVsMissile 方法，分别处理了飞船与子弹和导弹的碰撞检测。此外，在第六步中更新了人类飞船的最佳目标，这需要根据游戏规则和玩家输入进行计算和判断。

    使用 tick 方法的例子可以是一个飞船射击游戏，通过调用该方法来更新所有物体的位置和状态，并处理各种碰撞和爆炸效果，从而实现一个流畅、真实的游戏体验。用户可以通过添加不同的飞船类型、子弹类型、音效和特效等元素来扩展游戏的内容和玩法。
    */
    public tick(canShoot: boolean, humanInputs: Input, deltaTime: number, gameSpeed: number, sparksEffects: SparksEffects, explosionManager: ExplosionManager, world: World, targetGameSpeed: number): void {
        if (gameSpeed <= 0.001) {
            return;
        }

        this.time += deltaTime;

        const ships = this.ships;
        for (var index = 0; index < ships.length; index++) {
            const ship = ships[index];

            ship.lastDecalTime -= deltaTime;
            if (ship.lastDecalTime < 0 && ship.lastDecal) {
                ship.lastDecal.material?.dispose();
                ship.lastDecal.dispose();
                ship.lastDecal = null;
            }

            ship.tickEnabled();
            if (!ship.isValid()) {
                continue;
            }
            const input = ship.isHuman ? humanInputs : ship.input;

            ship.statistics?.addTimeOfBattle(deltaTime);

            if (!ship.isHuman) {
                this._tickAI(ship, deltaTime, index, world);
            } else {
                this._tickHuman(ship, deltaTime, index);
            }

            this._tickGeneric(ship, input, deltaTime, gameSpeed, canShoot, targetGameSpeed);
            this._tickShipVsShots(ship, input, sparksEffects, explosionManager);
            this._tickShipVsMissile(ship, sparksEffects, explosionManager);

            if (ship.isHuman) {
                if (ship.missileCooldown <= 0) {
                    const bestToChase = this.findBestPreyFor(index);
                    if (bestToChase == ship.bestPrey) {
                        ship.bestPreyTime += deltaTime;
                    } else {
                        ship.bestPreyTime = 0;
                    }
                    ship.bestPrey = bestToChase;
                } else {
                    ship.bestPrey = -1;
                    ship.bestPreyTime = 0;
                }
            }

            if (ship.isHuman) {
                if (this._assets.audio && this._assets.audio.thrusterSound.isReady()) {
                    this._assets.audio.thrusterSound.setVolume(Math.max(0, ship.bursting / 2));
                }
            }
            this._tickAsteroids(ship, world, explosionManager);
            this._tickEndOfLife(ship, index);
        }
    }
    /*
    _tickAsteroids 方法的作用是检测飞船与小行星的碰撞，具体实现如下：
    
    首先，该函数传入了三个参数：ship 表示当前需要检测碰撞的飞船对象，world 表示小行星所在的世界对象，explosionManager 则表示爆炸效果管理器。
    
    接着，该函数调用 world.collideWithAsteroids(ship.root.position, 1.0) 方法，检测当前位置是否与小行星有碰撞。如果有碰撞，则会执行以下操作：
    
    将该飞船的生命值设置为 -1，表示飞船已经被摧毁了。
    
    在飞船坠毁的位置上创建爆炸效果，使用 explosionManager.spawnExplosion 方法实现。
    
    根据飞船阵营（faction）不同，统计撞击敌机或友机的次数。
    
    以上操作主要是为了增加游戏的真实感和挑战性，当飞船与小行星发生碰撞时，即使飞船还有生命值，也应该会受到一定程度的损伤和惊吓。同时，这也为后面的游戏后续操作（如结束生命周期、计算得分等）提供了基础数据。
    
    使用 _tickAsteroids 方法的例子可以是一个太空战斗游戏，玩家需要通过操纵飞船来躲避小行星的碰撞和敌机的攻击，并尽可能地摧毁敌人。因此，在游戏场景中会添加多个小行星和飞船对象，并使用 _tickAsteroids 方法来检测它们之间的碰撞。此外，还可以根据游戏需求和美感要求来设置不同的小行星形状、文理和效果等。
    
    
    */
    private _tickAsteroids(ship: Ship, world: World, explosionManager: ExplosionManager): void {
        if (world.collideWithAsteroids(ship.root.position, 1.0)) {
            ship.life = -1;
            explosionManager.spawnExplosion(ship.root.position.clone(), ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
            if (ship.faction) {
                Statistics.addCrashEnemy();
            } else {
                Statistics.addCrashAlly();
            }
        }
    }
    /*
    这段代码是私有方法 _tickEndOfLife，它接收两个参数 ship 和 index。这个方法用于检查飞船是否已经死亡，并在需要时进行与此相关的处理。具体来说：
    
    检查飞船的生命值是否小于或等于 0。
    如果飞船已经死亡，使用 _missileManager.invalidateMissileChasing(ship) 非法化所有攻击该飞船的导弹。
    如果飞船设置了爆炸音效（explosionSfx），则从中随机选取一个并在该飞船的位置上播放。
    如果该飞船是玩家控制的，则将其信息传递给状态机（States）。
    最后通过调用 destroyShip(index) 方法销毁该飞船。
    这个方法主要用于游戏中检测飞船的生命值，当其死亡时进行相应的逻辑处理，比如发布一些爆炸声、更新得分信息等等。_tickEndOfLife 方法可能被游戏循环调用。
    */
    private _tickEndOfLife(ship: Ship, index: number): void {
        if (ship.life <= 0) {
            this._missileManager.invalidateMissileChasing(ship);
            if (ship.explosionSfx) {
                const rand = Math.floor(Math.random() * ship.explosionSfx.length);
                ship.explosionSfx[rand].setPosition(ship.position);
                ship.explosionSfx[rand].play();
            }
            if (ship.isHuman) {
                States.dead.ship = ship;
            }
            this.destroyShip(index);
        }
    }
    /*
    这是一个控制飞船运动的函数，主要功能如下：
    
    获取飞船的世界矩阵，并根据矩阵计算出飞船的前向、右向、向上向量。
    根据输入和游戏速度控制飞船朝向和滚转。
    根据输入和当前速度计算出飞船的加速度和位置。
    控制火力和导弹的发射，并判断是否处于冷却状态。
    控制飞船尾迹的生成和可见性。
    根据输入控制飞船的突进和刹车效果。
    其中，需要注意的一些变量解释如下：
    
    Ship：飞船类，包含了飞船的各种属性和方法。
    Input：输入类，包含了玩家的输入信息。
    deltaTime：当前帧与上一帧的时间差。
    gameSpeed：游戏速度倍率。
    canShoot：当前是否可以射击。
    Parameters：一些常量参数的定义和管理。
    
    这段代码是实现游戏中飞船运动的函数。主要有以下功能：
    
    更新飞船的方向，通过获取飞船的世界矩阵，从中提取出正前方、右方和上方向量。
    实现飞行机动（Immelmann Maneuver）。当输入标志位 immelmann 为true时，启动Immelmann Maneuver，使飞船进入一个特定的旋转模式，并在规定的时间内完成该动作。当时间到时，结束该动作。
    对飞船的运动进行限制，以避免在突发情况下产生过多的运动。
    对飞船的方向进行更新，并根据用户的输入进行调整。在用户输入dx时进行绕y轴旋转，在输入dy时进行绕x轴旋转，并将结果存储在四元数中。
    对飞船的位置进行更新。通过飞船当前的速度和方向，在每一帧上将其移动到新的位置。同时，通过缩小飞船的速率来模拟空气阻力和动量守恒。
    更新飞船的射击。当输入标志位 shooting 为 true 时，添加新的shot对象以模拟发射炮弹的效果。同时，也实现了导弹的发射以及CD的控制等相关功能。
    此外，代码还对飞船的 roll 角进行更新，以及处理飞船的燃气尾迹效果等。
    */
    private _tickGeneric(ship: Ship, input: Input, deltaTime: number, gameSpeed: number, canShoot: boolean, targetGameSpeed: number): void {
        var wmat = ship.root.getWorldMatrix();
        /*
        在获取一个物体的世界矩阵之后，我们可以通过其中对应的元素来获取这个物体在世界空间中的位置和方向信息。
        总结一下：
        矩阵的第0、1、2列分别表示物体的右方向、上方向和前方向；
        矩阵的第3列表示物体的位置信息；
        矩阵的第8、9、10个元素（也就是第2列中的第2、6、10个元素）表示物体的前方向向量；
        矩阵的第0、1、2个元素（也就是第0列中的第0、4、8个元素）表示物体的右方向向量；
        矩阵的第4、5、6个元素（也就是第1列中的第1、5、9个元素）表示物体的上方向向量；
        矩阵的第12、13、14个元素（也就是第3列中的第12、13、14个元素）表示物体在世界空间中的位置坐标。
        */
        const forward = new Vector3(wmat.m[8], wmat.m[9], wmat.m[10]);
        const right = new Vector3(wmat.m[0], wmat.m[1], wmat.m[2]);
        const up = new Vector3(wmat.m[4], wmat.m[5], wmat.m[6]);
        ship.forward = forward;
        ship.up = up;
        ship.right = right;

        // 如果飞船没有进行机动，检查是否需要执行Immelmann机动，并设置相应的计时器。如果飞船正在进行Immelmann机动，则根据计时器的值设置飞船的输入值。计时器会不断减少，直到机动结束。
        if (ship.maneuver == ShipManeuver.NONE) {
            if (input.immelmann) {
                ship.maneuver = ShipManeuver.IMMELMANN;
                ship.maneuverTimer = Parameters.ImmelmannDuration;
            }
        } else {
            if (ship.maneuver == ShipManeuver.IMMELMANN) {
                input.dx = 0;
                if (ship.maneuverTimer >= 600) {
                    input.dy -= 0.12;
                } else {
                    input.dy = 0;
                }
            }
            ship.maneuverTimer -= deltaTime;
            if (ship.maneuverTimer <= 0) {
                ship.maneuver = ShipManeuver.NONE;
            }
        }

        // restraint movement when in burst mode
        const constrainFactor = Math.min(1.1 - ship.bursting * 0.5, 1.) * gameSpeed;//计算一个约束因子，用于限制飞船在爆发模式下的运动。
        input.dx *= constrainFactor;//将水平输入值乘以约束因子。
        input.dy *= constrainFactor;//将垂直输入值乘以约束因子

        // orientation
        ship.roll = ship.roll + (input.dx - ship.roll) * 0.01 * gameSpeed;//根据水平输入值计算飞船的滚转角度
        if (ship.maneuver == ShipManeuver.IMMELMANN) {//如果飞船正在进行Immelmann机动，则根据计时器的值计算飞船的滚转角度。
            // do a barel roll
            if (ship.maneuverTimer < 600) {
                ship.roll = Math.sin((ship.maneuverTimer / 600) * Math.PI * 0.5) * 0.2;
            }
        }

        const rx = Quaternion.RotationAxis(new Vector3(0, 1, 0), input.dx);//根据水平输入值创建一个旋转四元数
        const mat = this._tempMatrix;//创建一个临时矩阵
        rx.toRotationMatrix(mat);//将旋转四元数转换为旋转矩阵。
        const ry = Quaternion.RotationAxis(new Vector3(mat.m[0], mat.m[1], mat.m[2]), input.dy);//根据垂直输入值和临时矩阵创建一个旋转四元数。

        ship.quat = ship.quat.multiply(rx).multiply(ry);//将旋转四元数和飞船的四元数相乘，并将结果设置为飞船的四元数。
        ship.quat.normalize();//将飞船的四元数归一化。

        ship.root.rotationQuaternion = Quaternion.Slerp(ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity(), ship.quat, 0.05);//将飞船的旋转矩阵设置为四元数的插值。
        //ship.roll *= 0.9;

        if (ship.shipMesh) {//如果飞船有一个船体网格，根据滚转角度设置船体网格的旋转。
            ship.shipMesh.rotationQuaternion = null;
            ship.shipMesh.rotation.z = ship.roll * 30;
            ship.shipMesh.rotation.y = Math.PI;
        }

        // position
        //ship.velocity = this.maxSpeed; // always moving
        ship.speedRatio = Math.min(ship.velocity / Parameters.maxSpeed, 1.);//计算飞船的速度比率。
        if (ship.isHuman) {//根据输入设置飞船的推进器功率。
            ship.setThrusterPower(input.burst ? 2 : (input.breaking ? 0 : 1));
        } else {
            ship.setThrusterPower(ship.faction ? 2 : 1);
        }

        //console.log(ship.speedRatio);
        if (true) // TODO humanInputs[1])
        {
            if (input.burst) {
                let currentAccel = Parameters.maxAccel * (1.0 - ship.speedRatio);
                ship.velocity += currentAccel * 8;
            } else if (input.breaking) {
                ship.velocity *= 0.98;
            } else {
                let currentAccel = Parameters.maxAccel * (0.5 - ship.speedRatio);
                ship.velocity += currentAccel * 8;
            }
        }

        ship.root.position.addInPlace(forward.scale(ship.velocity * gameSpeed));//根据速度和前向向量计算飞船的位置。【滑动到新位置】

        // damping
        //ship.velocity *= 0.99;

        // trail
        if (ship.trail && targetGameSpeed === 1) {
            ship.trail.append(ship.root.position);//将飞船的位置添加到拖尾效果中。
            /*if (ship.isHuman) {
                const dest = ship.box.position.clone();
                dest.addInPlace(new Vector3(0,0,100));
                this._sparksEffect.CreateShot(dest, new Vector3(0,1,0), 1);
            }*/
            ship.trail.setVisible(!ship.isHuman);//设置拖尾效果是否可见。
        }

        // reset for next frame
        input.dx = 0;//重置水平输入值。
        input.dy = 0;//重置垂直输入值。

        if (canShoot && input.shooting && deltaTime > 0.001) {// 如果可以发射，根据输入和其他参数创建一个新的Shot对象，并将其添加到ShotManager中。
            this._shotManager.addShot(ship, wmat, ship.isHuman, ship.cannonIndex);
            ship.statistics?.addShotFired();
            ship.cannonIndex = (ship.cannonIndex + 1) & 1;
            if (ship.laser) {
                const rand = Math.floor(Math.random() * ship.laser.length);
                ship.laser[rand].play();
            }
        }

        ship.missileCooldown = Math.max(ship.missileCooldown - deltaTime, 0);//计算导弹的冷却时间。

        // 如果可以发射导弹并且满足一些条件，根据参数创建一个新的 Missile 对象，并将其添加到 MissileManager 中。
        if (ship.bestPrey >= 0 && ship.bestPreyTime > Parameters.timeToLockMissile && input.launchMissile && ship.missileCooldown <= 0) {
            if (this._assets.trailMaterial && ship.availableMissiles) {
                const missile = ship.fireMissile(this._missileManager, this.ships[ship.bestPrey]);
                ship.statistics?.addMissilesFired();
                if (missile && ship.missileSfx) {
                    ship.missileSfx.attachToMesh(missile!);
                    ship.missileSfx.play();
                }
            }
            ship.missileCooldown = Parameters.missileCoolDownTime;
        }

        // 根据输入计算飞船的加速度。
        // 0.001，这是为了将时间间隔转换为秒。这样可以让deltaTime的单位与其它速度相关的变量相同，方便计算。
        // 0.98是一个衰减因子。在飞船不进行加速或减速时，ship.bursting的值会逐渐衰减。这是为了让飞船在爆发模式下不会一直加速或减速，从而更容易控制
        // -2是一个下限，如果ship.bursting小于-2，则会被设置为-2。这是为了避免飞船的速度下降过快，导致飞船无法控制。
        if (input.breaking) {
            ship.bursting = Math.max(ship.bursting - deltaTime * 0.001, -2.);
        } else if (input.burst) {
            ship.bursting = Math.min(ship.bursting + deltaTime * 0.001, 2.);
        } else {
            ship.bursting *= 0.98;
        }
    }
    /*
    这段代码是私有方法 _tickShipVsMissile ，它接收三个参数：ship、sparksEffects 和 explosionManager。这个方法用于处理导弹与飞船之间的碰撞检测，并在需要时根据游戏定义进行相应的逻辑处理。具体来说：
    
    遍历游戏中所有的导弹（通过 this._missileManager.missiles 访问）。
    对于每枚有效的导弹，判断导弹是否瞄准该方法传入的飞船 ship。
    如果导弹确实正在瞄准该飞船，则计算导弹和飞船之间的距离，如果距离小于设定的阈值（200），则将飞船的生命值减去导弹造成的伤害（根据游戏定义设定）。
    如果飞船已经被摧毁，则在飞船位置产生爆炸特效，并更新击败了该飞船的导弹发射者的状态（统计其摧毁了多少架飞船）。
    这个方法主要用于游戏中处理导弹与飞船之间的碰撞检测，当飞船被导弹击中时进行相应的逻辑处理，比如减少飞船的生命值、生成特效等等。 _tickShipVsMissile 方法可能被游戏循环调用。
    */
    private _tickShipVsMissile(ship: Ship, sparksEffects: SparksEffects, explosionManager: ExplosionManager) {
        // missile / ship
        for (let p = 0; p < this._missileManager.missiles.length; p++) {
            const missile = this._missileManager.missiles[p];
            if (!missile.isValid()) {
                continue;
            }
            if (missile.shipToChase == ship) {
                const dist = Vector3.DistanceSquared(missile.getPosition(), ship.root.position);
                if (dist < 200) {
                    ship.life -= this._gameDefinition.missileDamage;
                    ship.statistics?.addDamageTaken();
                    missile.setTime(MISSILE_MAX_LIFE + 1);
                    // Ship died to missile
                    if (ship.life <= 0) {
                        explosionManager.spawnExplosion(ship.root.position.clone(), ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
                        missile.firedBy?.statistics?.addShipDestroyed();
                    }
                }
            }
        }
    }
    /*
    这段代码是用 TypeScript 写的 babylonjs 游戏引擎的一个私有方法 _tickShipVsShots。该方法接收四个参数：一个飞船对象 ship、一个输入对象 input、一个火花特效对象 sparksEffects 和一个爆炸管理器对象 explosionManager。
    
    这个方法的主要作用是检测所有已经发射的子弹是否与指定飞船 ship 发生碰撞，并在碰撞时进行相应的处理。具体来说：
    
    遍历游戏中已经发射的所有子弹（通过 this._shotManager.shots 访问）。
    对于每一颗有效的子弹，判断其是否与飞船 ship 发生了碰撞。
    如果碰撞发生，则触发相应的碰撞处理逻辑，比如生成火花特效、更新飞船生命值等等。
    如果飞船被击败，则在飞船位置产生爆炸特效，并更新击败了该飞船的子弹发射者的状态（统计其摧毁了多少架飞船）。
    在碰撞处理逻辑中，对于击中了飞船的子弹会触发一系列行为：
    
    生成火花特效；
    如果飞船的护盾生效，生成护盾特效；
    更新子弹发射者及飞船的击中统计；
    更新飞船生命值，并根据需要进行 AI 相关逻辑（如避障）。
    如果飞船被毁灭，会在飞船位置产生爆炸特效，并更新击败了该飞船的子弹发射者的状态（统计其摧毁了多少架飞船）。
    
    总之，该方法用于游戏中处理子弹与飞船之间的碰撞检测，并根据游戏定义进行相应的逻辑处理。
    */
    private _tickShipVsShots(ship: Ship, input: Input, sparksEffects: SparksEffects, explosionManager: ExplosionManager): void {
        const ships = this.ships;

        // shot / ship
        var tmpPewpewPos = new Vector3();
        var pewpews = this._shotManager.shots;
        const matrices = this._shotManager.getMatrices();
        for (let p = 0; p < MAX_SHOTS; p++) {
            if (pewpews[p].ttl > 0 && pewpews[p].firedBy != ship) {
                /*
                这段代码是用来检测一个飞船是否被击中了，如果有子弹和这个飞船的距离小于等于36，那么就进行一系列操作。
                matrices数组是一个用来存储所有子弹位置信息的数组。在这个方法中，pewpews[p]表示第p个子弹，而每个子弹都有一个4x4的矩阵来表示它的位置、旋转、缩放等信息。
                因为每个矩阵有16个元素（4行 x 4列），所以我们需要通过 p * 16 来获取当前子弹的矩阵在 matrices 数组中的起始下标。
                然后再加上12、13、14三个偏移量，分别对应着矩阵中第四列（X轴）、第五列（Y轴）和第六列（Z轴）中的值，即可得到该子弹在世界坐标系下的位置信息。
                矩阵的存储方式是按列存储（column-major），所以第四列的元素是在第12、13、14个位置上的，第五列和第六列依次类推。因此通过 p * 16 + 12、p * 16 + 13、p * 16 + 14 就可以得到该子弹矩阵中第四列的XYZ值，即该子弹在世界坐标系下的位置信息。
                第四列的第15、16个位置的元素是用来表示投影的。具体来说，第15个元素（也就是p * 16 + 15）通常被称为透视除法因子（perspective divide factor），
                它是一个常数，在Babylon.js中通常表示为1/w，其中w是从原始顶点坐标变换过程中的第四个分量（也就是向量的齐次坐标）。
                这个值用于进行透视变换，在将位置从裁剪空间坐标（clip space）转换回NDC空间坐标（normalized device coordinate space）时被用到。
                第16个元素通常用于实现“灯光效果（lighting effects）”，但具体使用方式可能会因为不同的应用场景而有所不同。
                */
                tmpPewpewPos.set(matrices[p * 16 + 12], matrices[p * 16 + 13], matrices[p * 16 + 14]);
                /*
                这段代码的意思是计算玩家的飞船(ship)所在位置和某个临时变量tmpPewpewPos所代表的子弹位置之间的距离的平方。
                具体来说，DistanceSquared方法是Babylon.js中Vector3类的静态方法，可以计算两个向量之间的距离的平方。
                在这里，使用了ship.root.position作为一个向量，表示玩家飞船的位置，tmpPewpewPos也被视为另一个向量，表示子弹的位置，计算它们之间的距离的平方，用来判断子弹是否撞击到了飞船。
                注意，这里使用距离的平方是因为距离的平方与距离具有相同的相对大小，但计算距离的平方要比计算距离更加高效。
                */
                const dist = Vector3.DistanceSquared(ship.root.position, tmpPewpewPos);
                /*
                这里的36是一个距离的阈值，表示子弹和飞船之间的距离平方必须小于等于36，才认为子弹命中了飞船。
                实际上，36是一个任意选择的数值，用来表示子弹和飞船之间的接触范围。如果将阈值设为0，则只有在子弹恰好碰到飞船的中心点时，才会被判定为命中。
                而实际上，为了让游戏更加容易和有趣，我们通常会设置一个适当的阈值，使得玩家可以更容易地命中目标，增加游戏的可玩性。
                当然，具体的阈值应该根据游戏的需求和玩法来确定，36只是这个游戏设计者选择的一个合适的数值。
                */
                if (dist <= 36) {
                    sparksEffects.addShot(ship.root.position, ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
                    // shield effect
                    if (ship.shieldEffectMaterial && ship.shieldMain) {
                        if (ship.lastDecal) {
                            ship.lastDecal.material?.dispose();
                            ship.lastDecal.dispose();
                        }
                        var normal = tmpPewpewPos.subtract(ship.root.position).normalize();

                        ship.root.getWorldMatrix().invertToRef(ShipManager._tmpMatrix);
                        const localNormal = Vector3.TransformNormal(normal, ShipManager._tmpMatrix);

                        var decalSize = new Vector3(7, 7, 7);
                        ship.lastDecal = MeshBuilder.CreateDecal("decal", ship.shieldMain, { position: Vector3.Zero(), normal: localNormal, size: decalSize });
                        ship.lastDecalTime = 475;
                        ship.lastDecal.parent = ship.root;
                        let nodeMat = ship.shieldEffectMaterial.clone("shieldEffectMat");
                        nodeMat.alphaMode = Engine.ALPHA_ADD;
                        if (ship.faction) {
                            (nodeMat.getBlockByName("hitColor") as any).value = new Color3(0.42, 3.27, 3.72);
                            (nodeMat.getBlockByName("valkyriePattern") as any).value = 0.0;
                        } else {
                            (nodeMat.getBlockByName("hitColor") as any).value = new Color3(3.01, 1.72, 0.30);
                            (nodeMat.getBlockByName("valkyriePattern") as any).value = 1.0;
                        }
                        ship.lastDecal.material = nodeMat;
                        (nodeMat.getBlockByName("startTime") as InputBlock).value = (nodeMat.getBlockByName("Time") as InputBlock).value;
                    }

                    pewpews[p].ttl = -1;
                    pewpews[p].firedBy?.statistics?.addDamageDealt();
                    pewpews[p].firedBy?.statistics?.addShotHitting();
                    ship.statistics?.addDamageTaken();
                    ship.life -= this._gameDefinition.shotDamage;
                    if (!ship.isHuman) {
                        ship.evadeTimer = Parameters.AIEvadeTime;
                        const hitVector = tmpPewpewPos.subtract(ship.root.position);
                        const evadeDirection = hitVector.normalize();
                        ship.evadeTo = ship.root.position.clone().addInPlace(evadeDirection.cross(ship.forward).multiplyByFloats(1000, 1000, 1000));
                        if (pewpews[p].firedBy && pewpews[p].firedBy!.faction !== ship.faction) {
                            ship.bestPrey = ships.indexOf(pewpews[p].firedBy!);
                        }
                        if (Math.random() < Parameters.AIImmelmannProbability) {
                            input.immelmann = true;
                        }
                    }
                    // Ship died to lasers
                    if (ship.life <= 0) {
                        explosionManager.spawnExplosion(ship.root.position, ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
                        pewpews[p].firedBy?.statistics?.addShipDestroyed();
                    } else {
                        if (ship.laserHit) {
                            ship.laserHit.play();
                        }
                    }
                }
            }
        }
    }
    /*
    这是babylonjs游戏引擎中的一个私有方法 _tickHuman，该方法接收三个参数：一个飞船对象 ship、一个局部时间参数 localTime 和一个索引号 index。
    
    该方法的主要作用是限制玩家飞船在可玩边界球内移动。具体来说：
    
    首先定义了一个向量 centerToShip，用于存储飞船位置相对于玩家的中心的向量；
    然后通过 copyFrom 方法将飞船位置复制到 centerToShip 向量中；
    接着通过 length() 方法获取 centerToShip 向量的长度，即飞船距离玩家中心的距离；
    通过 normalize() 方法将 centerToShip 向量归一化；
    最后通过 scale() 方法将归一化后的 centerToShip 向量按照玩家可玩半径和飞船距离玩家中心的距离的最小值进行缩放，并将结果存储到飞船位置中。
    以上过程可以保证玩家飞船始终在玩家可玩边界球内移动，而不超出边界。
    
    总之，该方法是一种控制玩家飞船在可玩边界球内移动的方式，确保游戏策略的正确实施。
    */
    private _tickHuman(ship: Ship, localTime: number, index: number): void {
        // clamp player inside playable bounding sphere
        const centerToShip = this._tmpVec3;
        centerToShip.copyFrom(ship.root.position);
        const distance = centerToShip.length();
        centerToShip.normalize();
        ship.root.position.copyFrom(centerToShip.scale(Math.min(distance, this._gameDefinition.humanBoundaryRadius)));
    }
    /*
    这是一个使用 Babylon.js 游戏引擎的 TypeScript 代码段。这段代码是一个游戏 AI（人工智能）函数 _tickAI，接受一个 Ship 对象、时间参数 localTime、索引 index 以及一个 World 对象作为参数，并根据当前的游戏状态改变给定船只的行为。
    首先，函数检查船只是否距离游戏世界的中心过远。如果是，船只的状态被设置为 AVOID（避开状态）。如果船只超出了敌人的范围，则将其状态设置为 RETURN（返回状态）；否则，将其状态设置为 EVADE（逃脱状态）、CHASE（追逐状态）或 WANDER（徘徊状态），具体取决于 AI 算法的判断。
    随后，根据船只的状态选择不同的行为。在 AVOID 状态下，船只会朝着 _avoidPos 移动；在 RETURN 状态下，船只会返回游戏中心；在 EVADE 状态下，船只会朝着一个目标点移动，并启用 burst 输入。在 CHASE 状态下，船只会朝着一个预测位置移动，并根据敌人的移动进行开火。在 WANDER 状态下，船只会以一定的速率在游戏中徘徊。
    最后，函数添加了一些随机因素，以增加 AI 的随机性。
    
    这段代码是一个基于 Babylon.js 的游戏 AI 实现。主要作用是根据游戏中战斗飞船的状态和周围环境，进行相应的 AI 行为。
    该函数接受四个参数：ship, localTime, index 和 world。其中ship是一个Ship类的实例对象，代表玩家的战斗飞船；localTime是运行时间；index是已经获得的目标飞船索引；world是一个World类的实例对象，代表游戏世界。
    函数首先判断是否需要回避（shouldAvoid）或返回，或者执行其他行为。如果处于回避状态，则飞船将向着指定点逐渐移动；如果处于追逐状态，则飞船将朝着预测目标位置移动，并进行射击等操作。此外还有一些其他行为，如游荡（WANDER）等。
    在实现这些行为时，代码会根据当前状态，设置一些船只属性来控制行动，例如输入（input）、速度等。最后还添加了一些随机的输入来使 AI 稍微具有随机性。
    总之，这段代码实现了一些基础的 AI 细节，可以应用于空战类游戏中的敌对飞船设计中。
    */
    private _tickAI(ship: Ship, localTime: number, index: number, world: World): void {
        const input = ship.input;
        const ships = this.ships;

        // too far from center?
        if (world.shouldAvoid(ship.root.position, 1, this._avoidPos)) {
            ship.state = AIState.AVOID;
        } else if (ship.root.position.length() > this._gameDefinition.enemyBoundaryRadius) {
            ship.state = AIState.RETURN
        } else {
            if (ship.evadeTimer > 0) {
                ship.evadeTimer -= localTime;
                ship.state = AIState.EVADE;
            } else {
                const bestPreyNow = this.findBestPreyFor(index);
                // if we have a target, and we can see them, stay on them
                if (bestPreyNow != ship.bestPrey) {
                    ship.bestPreyTime = 0;
                    ship.bestPrey = bestPreyNow;
                } else {
                    ship.bestPreyTime += localTime;
                }
                if (ship.bestPrey >= 0) {
                    ship.state = AIState.CHASE;
                } else {
                    // wander around
                    ship.state = AIState.WANDER;
                }
            }
        }
        // HANDLE BEHAVIOR
        // by default, do nothing
        input.burst = false;
        input.breaking = false;
        input.shooting = false;
        input.immelmann = false;
        switch (ship.state) {
            case AIState.AVOID:
                ship.goToward(this._avoidPos, ship.root.position, 0.02);
                break;
            case AIState.RETURN:
                ship.goToward(Vector3.Zero(), ship.root.position, 0.02);
                break;
            case AIState.EVADE:
                input.burst = true;
                ship.goToward(ship.evadeTo, ship.root.position, Parameters.AITurnRate);
                break;
            case AIState.CHASE:
                const enemy = ships[ship.bestPrey].root;
                // position to aim the ship towards
                const gotoPos = enemy.position.add(enemy.forward.normalizeToNew().multiplyByFloats(Parameters.AIFollowDistance, Parameters.AIFollowDistance, Parameters.AIFollowDistance));
                // const aimWmat = enemy.getWorldMatrix();
                // aimPos.addInPlace((new Vector3(aimWmat.m[8], aimWmat.m[9], aimWmat.m[10])).scale(100));
                if (ship.targetSphere) {
                    ship.targetSphere.position = gotoPos;
                }
                ship.goToward(gotoPos, ship.root.position, Parameters.AITurnRate);
                // position we want to fire at - where we predict the enemy will be in the future
                const firePos = enemy.position.add(enemy.forward.normalizeToNew().multiplyByFloats(Parameters.AIPredictionRange * ships[ship.bestPrey].velocity, Parameters.AIPredictionRange * ships[ship.bestPrey].velocity, Parameters.AIPredictionRange * ships[ship.bestPrey].velocity));
                const fireDot = ShipManager.dotToTarget(ship, firePos)
                const distanceToTarget = ship.root.position.subtract(enemy.position).length();
                if ((distanceToTarget < Parameters.AIBreakDistance || ship.dotToEnemy < 0.4) && ship.velocity > Parameters.AIMinimumSpeed) {
                    input.breaking = true;
                }
                if (distanceToTarget > Parameters.AIBurstDistance && ship.dotToEnemy > 0.8 && ship.velocity < Parameters.AIMaximumSpeed) {
                    input.burst = true;
                }
                if (fireDot > Parameters.AIFirePrecision && ship.dotToAlly < Parameters.AIFriendlyFirePrecision && distanceToTarget < Parameters.AIFireRange) {
                    input.shooting = true;
                }

                break;
            case AIState.WANDER:
                input.dx = Math.cos(this.time * 0.002) * Parameters.AITurnRate;
                input.dy = Math.sin(this.time * 0.002) * Parameters.AITurnRate;
                break;
        }
        // add a bit of randomness
        input.dx += (2 * Math.random() - 1) * Parameters.AIInputRandomness;
        input.dy += (2 * Math.random() - 1) * Parameters.AIInputRandomness;
    }

    public dispose(): void {
        this.ships.forEach(ship => {
            ship.dispose();
        });
        this._missileManager.dispose();
        this._shotManager.dispose();
    }
}