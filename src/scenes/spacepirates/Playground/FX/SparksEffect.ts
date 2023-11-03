import { Vector3, Scalar, Scene, NodeMaterial, SolidParticleSystem, MeshBuilder, Engine, Quaternion, Color4, Nullable, Observer } from "@babylonjs/core";
import { Assets } from "../Assets";


const SPARK_COUNT_SHOT = 10;//每次触发的火花数量。
const MAX_SHOTS = 30;//最多能发射的火花数量。
/*
首先定义了 SPARK_COUNT_SHOT 和 MAX_SHOTS 两个常量，分别表示特效的火花数量和最大发射次数。
然后定义了 SparksEffect 类，构造函数需要传入场景对象、资源对象和火花数量。在类的构造函数内部，创建了一个名为 "SPS" 的实例化的 SolidParticleSystem 对象，利用 MeshBuilder 创建了一个大小为 0.000001 的平面，将其添加到 SPS 中，并释放该平面对象。并初始化了一些参数和方法。
其中 initParticles 方法用于初始化粒子，设置了每个粒子的位置、速度、颜色、存活时间等。updateParticle 方法用于更新粒子的位置、颜色等信息。
接下来判断场景中是否存在制定资源（assets.sparksEffect），如果存在，则将其应用到 mesh 对象上，并且开启了一个 onBeforeRenderObservable 监听器用于更新特效的状态。其他方法包括设置粒子特效的位置和方向，以及设置时间、获取位置、朝向等信息。最后定义了一个 dispose 方法用于销毁特效。
总之，这段代码使用 Babylon.js 实现了一个简单的火花特效。
*/
export class SparksEffect {
    private _SPS: SolidParticleSystem;
    private _time: number; // in milliseconds
    private _renderObserver: Nullable<Observer<Scene>> = null;
    private _scene: Scene;
    // 在类内部分别定义了私有变量 _SPS 、 _time 、 _renderObserver 和 _scene ，分别用于存储当前火花效果的 SolidParticleSystem 对象、时间（以毫秒计）、渲染观察器和场景。

    constructor(scene: Scene, assets: Assets, sparkCount: number) {// 接收三个参数：场景、assets资源和sparkCount表示每次要发射的火花数量
        this._scene = scene;
        this._SPS = new SolidParticleSystem("SPS", scene);
        const plane = MeshBuilder.CreatePlane("", { size: 0.000001 }); // 创建一个名为“plane”的平面网格，作为火花的形状。
        this._SPS.addShape(plane, sparkCount);// 将“ plane ”添加到 SolidParticleSystem 中，并指定要添加的数量为sparkCount。

        plane.dispose();

        this._time = 9999;//初始化时间为9999毫秒。
        const mesh = this._SPS.buildMesh();//构建SolidParticleSystem的网格。

        mesh.visibility = 0.99;//设置网格的可见性为99%。
        mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);//设置网格的旋转四元数为(0,0,0,1)，表示不旋转。

        /*
        在 Babylon.js 中，Solid Particle（实体粒子）是一种用于创建和管理大量移动的、有物理属性的粒子系统的对象。每个 Solid Particle 对象都有一个 velocity（速度）属性，它表示粒子在三维空间中的运动速度。

        velocity 属性是一个具有 x、y 和 z 分量的向量，分别表示粒子在 x、y 和 z 方向上的速度。这些分量的值决定了粒子的运动方向和速度大小。

        SolidParticle.velocity.x：表示粒子在 x 轴上的速度分量。正值表示向正方向运动，负值表示向负方向运动。
        SolidParticle.velocity.y：表示粒子在 y 轴上的速度分量。正值表示向正方向运动，负值表示向负方向运动。
        SolidParticle.velocity.z：表示粒子在 z 轴上的速度分量。正值表示向正方向运动，负值表示向负方向运动。
        通过修改 Solid Particle 的 velocity 属性，可以控制粒子在各个轴上的运动方式和速度，从而实现不同的动态效果，比如飞行、旋转、弹跳等。

        需要注意的是，velocity 属性只是粒子的速度矢量，具体的运动效果还受到其他因素的影响，例如粒子的初始位置、应用的力或重力等。在使用 Solid Particle 进行粒子系统的创建和更新时，可以通过调整 velocity 属性来实现所需的运动效果。
        */
        /*
        在上述的 Babylon.js 游戏代码中，使用以下代码来生成火花粒子的初始速度：

        const nga = Scalar.RandomRange(-Math.PI, Math.PI);
        const ngb = Scalar.RandomRange(0, Math.PI);
        const strength = Scalar.RandomRange(0.05, 0.2) * 10;
        这段代码通过随机生成角度（nga 和 ngb）以及一个强度值（strength），来设置火花粒子的初始速度。

        nga 是一个随机生成的角度，范围介于 -π（负 pi）到 π（正 pi）之间，表示粒子在水平方向上的偏转角度。
        ngb 也是一个随机生成的角度，范围从 0 到 π（正 pi），表示粒子在垂直方向上的偏转角度。
        strength 是一个随机生成的强度值，范围从 0.05 到 0.2 之间，并乘以 10。这个值决定了粒子的速度大小。
        通过这些随机生成的角度和强度，根据三角函数的计算，可以将速度分解为 x、y 和 z 分量，并赋值给对应的属性：

        particle.velocity.x = Math.cos(nga) * Math.cos(ngb) * strength;
        particle.velocity.y = Math.sin(ngb) * strength;
        particle.velocity.z = Math.sin(nga) * Math.cos(ngb) * strength;
        这样设置了粒子的初始速度后，它们就会在游戏中以随机的方向和速度开始运动，形成火花效果。

        通过使用随机生成的角度和强度来设置初始速度，可以获得更多样化和自然的火花运动效果，增加了游戏的视觉吸引力和真实感。
        */
        // initiate particles function
        this._SPS.initParticles = () => {//定义了 initParticles 函数，用于初始化火花粒子的位置、速度和颜色等属性。
            for (let p = 0; p < this._SPS.nbParticles; p++) {//循环处理每个粒子，根据一定的随机规则设置其位置和速度等属性。
                const particle = this._SPS.particles[p];

                const nga = Scalar.RandomRange(-Math.PI, Math.PI);
                const ngb = Scalar.RandomRange(0, Math.PI);
                const strength = Scalar.RandomRange(0.05, 0.2) * 10;
                particle.position.x = 0;
                particle.position.y = 0;
                particle.position.z = 0;

                particle.velocity.x = Math.cos(nga) * Math.cos(ngb) * strength;
                particle.velocity.y = Math.sin(ngb) * strength;
                particle.velocity.z = Math.sin(nga) * Math.cos(ngb) * strength;

                particle.color = new Color4(0, 0, 0, 0);

                const pp = particle as any;
                pp.ttl = Scalar.RandomRange(300, 1000);
            }
        };

        //Update SPS mesh
        this._SPS.initParticles();
        this._SPS.setParticles();

        this._SPS.updateParticle = (particle: any) => {//定义了updateParticle函数，用于更新火花粒子的属性。
            if (particle.ttl - this._time > 0) {
                const velocityFactor = Math.pow(0.99, this._time * 0.001);
                (particle.position).copyFrom(particle.velocity.scale(this._time * 0.01));      // update particle new position

                particle.color.r = particle.velocity.x * 0.03;// * velocityFactor;
                particle.color.g = particle.velocity.y * 0.03;// * velocityFactor;
                particle.color.b = particle.velocity.z * 0.03;// * velocityFactor;
                particle.color.a = Math.max((particle.ttl - this._time) / particle.ttl, 0.);
            }
            return particle;
        }

        if (assets.sparksEffect) {//如果传入的assets资源中存在名为“sparksEffect”的材质，则将材质设置给 SolidParticleSystem 的网格对象，并进行额外的设置。
            mesh.material = assets.sparksEffect.clone("sparkles", true);
            mesh.material.backFaceCulling = false;
            mesh.material.alphaMode = Engine.ALPHA_ADD;

            var _this = this;

            this._renderObserver = scene.onBeforeRenderObservable.add(function () {
                if (_this.valid()) {
                    _this._SPS.setParticles();
                }
            });
        }
    }

    public valid(): boolean {//判断当前时间是否在0-1000毫秒之间，返回结果。
        return this._time >= 0 && this._time < 1000;
    }

    public setPositionOrientation(position: Vector3, orientation: Quaternion): void {//设置SolidParticleSystem的网格对象的位置和旋转四元数。
        this._SPS.mesh.position.copyFrom(position);
        this._SPS.mesh.rotationQuaternion?.copyFrom(orientation);
    }

    public setTime(timeMs: number) {//设置时间，单位为毫秒。
        this._time = timeMs;
    }

    public addDeltaTime(deltaTimeMs: number) {//增加时间，单位为毫秒。
        this._time += deltaTimeMs;
    }

    public tickEnable(): void {//控制SolidParticleSystem的网格对象是否可见。
        this._SPS.mesh.setEnabled(this._time < 1000);
    }

    public getTime(): number {//获取当前时间。
        return this._time;
    }

    public getPosition(): Vector3 {
        return this._SPS.mesh.position;
    }

    public getOrientation(): Quaternion {
        return this._SPS.mesh.rotationQuaternion ? this._SPS.mesh.rotationQuaternion : Quaternion.Identity();
    }

    public dispose(): void {//销毁火花效果类的资源，在此处是移除渲染观察器和销毁SolidParticleSystem对象。
        this._scene.onBeforeRenderObservable.remove(this._renderObserver);
        this._SPS.dispose();
    }
}

// 定义了一个名为 SparksEffects 的类，用于管理多个 SparksEffect 火花特效对象
export class SparksEffects {
    private _shots = new Array<SparksEffect>();//一个 SparksEffect 对象数组。

    constructor(scene: Scene, assets: Assets) {
        for (let i = 0; i < MAX_SHOTS; i++) {
            this._shots.push(new SparksEffect(scene, assets, SPARK_COUNT_SHOT));
        }
    }

    public tick(deltaTime: number) {//遍历 Shots 数组中的每一个 SparksEffect 对象，依次调用它们的 addDeltaTime 方法和 tickEnable 方法，分别用来更新时间和启用/禁用这些特效。
        this._shots.forEach((effect) => {
            effect.addDeltaTime(deltaTime);
            effect.tickEnable();
        });
    }

    public getSparksEffects(): Array<SparksEffect> {//返回 Shots 数组。
        return this._shots;
    }

    /*
        定义了一个名为 addShot 的公共成员方法，用于添加新的火花特效。需要传入位置向量和朝向四元数作为参数。
        遍历 Shots 数组中的每一个 SparksEffect 对象，找到第一个无效的对象（ valid 方法返回 false ），并调用其 setPositionOrientation 和 setTime 方法来设置位置和时间。
    */
    public addShot(position: Vector3, orientation: Quaternion): void {
        for (let i = 0; i < this._shots.length; i++) {
            const shot = this._shots[i];
            if (!shot.valid()) {
                shot.setPositionOrientation(position, orientation);
                shot.setTime(0);
                return;
            }
        }
    }

    public dispose(): void {
        this._shots.forEach((value) => {
            value.dispose();
        });
    }
}
