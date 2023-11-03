import { Vector3, Vector4, Scene, FreeCamera, MeshBuilder, StandardMaterial, InstancedMesh, Color3, Matrix } from "@babylonjs/core";
import { Ship } from "./Ship"

export class ShipCamera {

    private _camera: FreeCamera;
    private _ship: Ship;
    private _shakeDelay: number = 0;
    private _shakeVector = new Vector3(0, 0, 0);

    // burst effect
    private StarCount = 250;
    private StarSpread = 10.0;
    private StarPositions = Array<Vector3>();
    private Stars = Array<InstancedMesh>();

    public getFreeCamera(): FreeCamera {
        return this._camera;
    }

    /*
    下述代码是一个自定义的方法，其作用是判断给定的 3D 坐标 position 是否在相机的视野内可见。

    具体实现过程如下：

    首先，方法将 position 转换为相机空间中的坐标 spo0，即将目标位置从世界坐标系转换到相机坐标系。为此，使用了相机的视图矩阵进行向量变换（通过调用 Vector4.TransformCoordinates() 方法将 position 向量转换为 spo0 向量）。

    接下来，方法使用相机的投影矩阵将 spo0 向量从相机空间坐标系转换为屏幕空间的坐标系。这一步骤同样是通过调用 Vector4.TransformCoordinates() 方法实现的，只不过输入向量为计算出的 spo1 向量。

    最后，方法根据屏幕空间坐标 spo1 的 x、y 分量和 z 分量来确定物体是否在屏幕上可见。具体地，如果 x 和 y 分量的绝对值均小于 0.5，且 z 分量大于 0，则认为物体在视野范围内可见。

    以下是使用示例：

    typescript
    // 获取相机对象和目标物体
    const camera = scene.getCameraByName("myCamera");
    const targetMesh = scene.getMeshByName("myTargetMesh");

    // 判断目标物体是否可见
    if (camera.isOnScreen(targetMesh.position)) {
        console.log("Target mesh is visible on screen.");
    } else {
        console.log("Target mesh is not visible on screen.");
    }
    在以上示例中，我们首先通过场景对象的 getCameraByName 方法和 getMeshByName 方法分别获取相机对象和目标物体。接着，我们调用自定义的 isOnScreen 方法判断目标物体是否在相机视野内可见，并根据返回值输出结果。

    */
    public isOnScreen(position: Vector3): boolean {
        var spo0 = Vector4.TransformCoordinates(position, this._camera.getViewMatrix());
        var spo1 = Vector4.TransformCoordinates(new Vector3(spo0.x, spo0.y, spo0.z), this._camera.getProjectionMatrix());

        spo1.x /= spo1.w;
        spo1.y /= spo1.w;
        return Math.abs(spo1.x) < 0.5 && Math.abs(spo1.y) < 0.5 && spo1.z > 0;
    }
    /*
    下述代码是一个私有方法 _initBurst，其作用是初始化星云场景中的星星实例网格。
    
    具体实现过程如下：
    
    首先，方法生成了指定数量的随机位置坐标（存储在 this.StarPositions 数组中），这些坐标将被用于初始化星星实例网格的位置。其中，星星实例网格的数量和散布范围都可以通过类的属性 this.StarCount 和 this.StarSpread 来控制。
    
    接着，方法创建了一个名为 Star 的圆柱体网格对象，并设置了该网格对象的位置、旋转角度和材质。其中，圆柱体的高度、底部直径、顶部直径和细分级别可以通过参数来控制。对于材质方面，代码使用了 StandardMaterial 材质，并设置了漫反射颜色、自发光颜色和透明度等属性。
    
    最后，方法遍历每个随机位置坐标，并为每个位置创建对应的星星实例对象。对于每个星星实例，代码先使用 Star.createInstance 方法创建了一个新的实例对象，并将其存储到 this.Stars 数组中。然后，代码设置了该实例对象的位置、大小和父对象等属性，以使其成为场景中的一颗星星。
    
    以下是使用示例：
    
    typescript
    // 创建一个星云对象并初始化星星实例网格
    const myGalaxy = new Galaxy(scene);
    myGalaxy.StarCount = 1000;
    myGalaxy.StarSpread = 500;
    myGalaxy.initBurst();
    在以上示例中，我们创建了一个新的 Galaxy 对象，并将该对象的 StarCount 和 StarSpread 属性设置为 1000 和 500，以表示星星实例网格的数量和散布范围。然后，我们调用了 initBurst 方法来初始化星星实例网格。在该方法执行完毕后，场景中就会出现一颗有 1000 颗星星的星云了。需要注意的是，该示例中省略了如何将星云对象添加到场景中的过程，读者可以参考官方文档查看如何实现。
    
    */
    private _initBurst(scene: Scene): void {
        while (this.StarPositions.length < this.StarCount) {
            this.StarPositions.push(
                new Vector3(
                    (Math.random() * 2 - 1) * this.StarSpread * 2,
                    (Math.random() * 2 - 1) * this.StarSpread,
                    (Math.random() * 2 - 1) * this.StarSpread * 10
                )
            )
        }

        var Star = MeshBuilder.CreateCylinder(
            "Star", { height: 30, diameterBottom: 0.05, diameterTop: 0.01, tessellation: 16 }, scene);
        Star.position = new Vector3(100, 100, 100);
        Star.rotation = new Vector3(Math.PI / 2, 0., 0.0);
        var StarMaterial = new StandardMaterial("StarMaterial", scene);
        StarMaterial.diffuseColor = Color3.White();
        StarMaterial.emissiveColor = new Color3(0.5, 0.9, 1);
        StarMaterial.alpha = 0.25;
        Star.material = StarMaterial;

        for (var i = 0; i < this.StarCount; i++) {
            this.Stars.push(Star.createInstance("star" + i));
            this.Stars[i].position = this.StarPositions[i];
            var s = Math.random();
            this.Stars[i].scaling = new Vector3(s, s, s);
            this.Stars[i].parent = this._camera;
        }
    }
    /*
    下述代码是一个私有方法 _tickBurst，其作用是更新场景中星星实例网格的位置和缩放，以创建一种类似于星云爆发的动画效果。
    
    具体实现过程如下：
    
    首先，方法计算出当前的 burstStrength，其值等于 bursting 减去 0.5 后取最大值为 0，并乘以 gameSpeed。这里的 bursting 表示当前星云中爆发状态的强度，而 gameSpeed 则表示当前游戏运行的速度（通常在游戏中会使用一个时间缩放系数来控制游戏速度）。
    
    接着，方法遍历场景中所有的星星实例网格，对每一个星星实例进行如下操作：
    
    将星星实例网格的 z 坐标减去一定的值，以使其向相机方向移动。其中，移动的距离等于 1/60 * 200 * burstStrength，其中 1/60 表示每一帧的时间间隔，200 表示星星移动的速度与游戏速度的比例系数。
    
    如果星星实例网格已经超出了相机的视野范围（即 z 坐标小于 -50），则将其重新放置到相机视野内（即将 z 坐标加上 100）。
    
    将星星实例网格的 y 缩放值设置为 burstStrength + 0.001，以使其在星云爆发状态下变得更加明显。
    
    以下是使用示例：
    
    typescript
    // 在游戏循环中调用 _tickBurst 方法
    function gameLoop(bursting: number, gameSpeed: number): void {
        scene.registerBeforeRender(() => {
            _tickBurst(bursting, gameSpeed);
        });
    }
    在以上示例中，我们定义了一个 gameLoop 方法，该方法会在游戏循环中每一帧都调用 _tickBurst 方法，并传入当前的爆发强度和游戏速度。这样，就可以实现场景中星云爆发的动画效果了。需要注意的是，该示例中省略了对星云实例网格对象的初始化和创建，读者可以参考官方文档查看如何实现。
    
    */
    private _tickBurst(bursting: number, gameSpeed: number): void {
        const burstStrength = Math.max(bursting - 0.5, 0) * gameSpeed;
        this.Stars.forEach((star: InstancedMesh) => {
            star.position.z -= 1 / 60 * 200 * burstStrength;
            if (star.position.z < -50) star.position.z += 100;
            star.scaling.y = burstStrength + 0.001;
        });
    }

    /*
    这段代码是一个名为 constructor 的构造函数，用于创建一个名为 CameraController 的相机控制器，并将其绑定到游戏场景中的自由相机上。

    在构造函数中，首先使用传入的参数 scene 创建了一个自由相机 this._camera，并将其初始位置设置为 (0, 5, -10)。然后通过 scene.activeCamera = this._camera 将该相机设置为场景的活动相机，即当前可见的相机。这样，游戏运行时就会使用该相机进行渲染。

    接下来是 _initBurst(scene) 方法的调用。由方法名可知，该方法用于初始化粒子特效，实现飞船爆发时的特效效果。该方法的实现不在代码片段中，可以猜测该方法会创建一些粒子系统，并将其添加到场景中。

    最后，通过 scene.audioListenerPositionProvider 属性将一个回调函数绑定到场景的音频监听器（listener）上。当场景中存在多个音频源（source）时，每个源都应该知道自己在哪里，以便计算声音传播的路径和强度。因此，该回调函数返回的位置信息将被用于确定监听器的位置，以便计算声音传播。如果飞船的变换节点（"_ship.transformNode"）存在，则返回该节点的绝对位置；否则返回相机位置作为监听器的位置。

    */
    constructor(ship: Ship, scene: Scene) {
        this._ship = ship;
        this._camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
        scene.activeCamera = this._camera;

        // burst
        this._initBurst(scene);

        scene.audioListenerPositionProvider = () => {
            if (this._ship && this._ship.transformNode) {
                return this._ship.transformNode.absolutePosition;
            }
            return this._camera.position;
        }
    }

    /*
    下述代码是一个名为 Tick 的方法，用于更新相机位置以跟随飞船的运动，并模拟相机镜头的震动效果。该方法接受四个参数：ship 表示当前的飞船对象；shipWorldMatrix 表示飞船的世界矩阵；speedRatio 和 gameSpeed 分别表示当前的速度比率和游戏速度。

    以下是对代码中各部分的解释：

    首先，方法使用接收到的参数更新私有变量 _ship，该变量表示当前的飞船对象。

    接着，方法每 6 帧会产生一次相机震动。如果 _shakeDelay 计时器已经归零，则将其重置为 6，并使用 Math.random() 方法随机生成一个长度为 3 的向量 _shakeVector 。该向量的每个分量都是在 [-0.5, 0.5] 范围内的随机值。

    然后，方法根据飞船的爆发程度（即 _ship.bursting 属性）和游戏速度（即 gameSpeed 参数）计算出一个噪声向量 noise 。该向量是 _shakeVector 向量的缩放结果，缩放系数为 Math.max(_ship.bursting, 0) * 0.5 * gameSpeed。该向量用于在相机震动时改变相机的位置和目标点。

    下面的代码通过一个 localEyePos 向量表示相机在飞船局部坐标系下的位置，以及一个 localEyeTarget 向量表示相机镜头所望向的方向。这两个向量也会受到 _shakeVector 向量的影响。

    然后，方法分别使用 shipWorldMatrix 矩阵对 localEyePos 和 localEyeTarget 进行变换，得到真实的相机位置 eyePos 和目标点位置 eyeTarget。另外，还计算出在世界坐标系下的飞船位置 shipPos。

    接下来的代码使用 Vector3.Lerp() 方法将相机的位置和目标点位置从当前值逐渐调整为目标值。这里使用了 ship.localEye 和 ship.localTarget 两个向量存储相机位置和目标点位置的局部坐标系下的值。具体来说，ship.localEye 和 ship.localTarget 的初始值为 localEyePos 和 localEyeTarget，而每帧调用 Tick 方法时，这两个向量都会缓慢地朝目标值靠近。

    之后的代码设置了相机的 up 向量（即视图正上方的方向），并调整了相机的视野角度。具体来说，up 向量是 eyeUp，由 Vector3.TransformNormal(new Vector3(0, 1, 0), shipWorldMatrix) 计算得到。视野角度则是 0.8 - _ship.bursting * 0.1，其中 _ship.bursting 表示飞船当前的爆发程度。

    最后，方法通过 _camera.position 和 _camera.setTarget() 方法设置相机的位置和目标点位置。需要注意的是，这里使用了一个临时变量 tmpTarget 来获得实际的目标点位置：由于相机相对于飞船位置的偏移量是存在的，因此需要先将局部坐标系下的 ship.localTarget 向量与飞船位置相加，才能得到实际的目标点位置。另外，还会调用 _tickBurst 方法来更新当前的粒子效果。

    该方法主要应用于游戏中的第一人称视角或者飞船尾焰的渲染，可在游戏引擎 Babylon.js 中使用。

    */
    Tick(ship: Ship, shipWorldMatrix: Matrix, speedRatio: number, gameSpeed: number) {
        this._ship = ship;
        if (this._shakeDelay <= 0) {
            this._shakeDelay = 6;
            this._shakeVector.set(Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5);
        }
        this._shakeDelay--;
        const noise = this._shakeVector.clone();
        noise.scaleInPlace(Math.max(ship.bursting, 0) * 0.5 * gameSpeed);

        const localEyePos = new Vector3(0,
            0.8 + Math.min(ship.bursting, 0) * 0.1,
            -2.5 - Math.max(ship.bursting, 0) * 1).scale(5);
        localEyePos.addInPlace(noise);
        const eyePos = Vector3.TransformNormal(localEyePos, shipWorldMatrix);

        const localEyeTarget = new Vector3(0, 0, 100).scale(5);
        localEyeTarget.addInPlace(noise);
        const eyeTarget = Vector3.TransformNormal(localEyeTarget, shipWorldMatrix);
        const eyeUp = Vector3.TransformNormal(new Vector3(0, 1, 0), shipWorldMatrix);
        // 由于飞船在世界坐标系下的位置信息保存在矩阵的第 13、14、15 个元素中，因此可以使用下标 12、13、14 进行访问
        const shipPos = new Vector3(shipWorldMatrix.m[12], shipWorldMatrix.m[13], shipWorldMatrix.m[14]);

        //camera.setTarget(Vector3.Lerp(camera.getTarget(), eyeTarget.addInPlace(shipPos), 0.2));
        this._camera.upVector = eyeUp;

        var cameraLerp = 0.1 * gameSpeed;// + speedRatio * 0.3;

        ship.localEye = Vector3.Lerp(ship.localEye, eyePos, cameraLerp);
        ship.localTarget = Vector3.Lerp(ship.localTarget, eyeTarget, 0.15 * gameSpeed);
        var tmpTarget = ship.localTarget.clone();
        tmpTarget.addInPlace(shipPos)
        this._camera.fov = 0.8 - ship.bursting * 0.1;

        this._camera.position.set(ship.localEye.x, ship.localEye.y, ship.localEye.z);
        this._camera.position.addInPlace(shipPos);
        this._camera.setTarget(tmpTarget);

        // burst
        this._tickBurst(ship.bursting, gameSpeed);
    }

    dispose() {
        this._camera.dispose();
    }
}