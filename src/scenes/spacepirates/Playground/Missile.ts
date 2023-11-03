import { Color3, AbstractMesh, Quaternion, Vector3, Mesh, Matrix, Scene, TransformNode, Engine, Nullable } from "@babylonjs/core";
import { Agent } from "./Agent";
import { Ship } from "./Ship";
import { Trail, TrailManager } from "./FX/Trail";
import { ExplosionManager } from "./FX/Explosion";
import { World } from "./World";

export const MAX_MISSILES: number = 10;
export const MISSILE_MAX_LIFE: number = 10000; // in milliseconds

export class Missile extends Agent {
    private _trail: Nullable<Trail> = null;
    public shipToChase: Nullable<Ship> = null;
    public time: number = 99999;
    public firedBy: Nullable<Ship> = null;

    constructor(scene: Scene) {
        super();
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `launch` 的方法。该方法用于发射导弹，接收如下参数：
    
    - `shipToChase: Ship`：被导弹追踪的目标飞船。
    - `firedBy: Ship`：发射导弹的飞船。
    - `worldPosition: Vector3`：导弹发射时的位置坐标。
    - `worldOrientation: Quaternion`：导弹发射时的四元数方向。
    - `missileTransform: TransformNode`：导弹的变换节点。
    - `trailManager: TrailManager`：轨迹管理器，用于记录导弹的轨迹。
    
    函数实现的具体步骤如下：
    
    1. 将导弹的变换节点设置为传入的 `missileTransform`
    ```
    this.transformNode = missileTransform;
    ```
    
    2. 设置导弹的输入速度为 0
    ```
    this.input.dx = 0;
    this.input.dy = 0;
    ```
    
    3. 记录被导弹追踪的飞船和发射导弹的飞船的引用
    ```
    this.shipToChase = shipToChase;
    this.firedBy = firedBy;
    ```
    
    4. 初始化导弹发射时间为 0，并将导弹的位置和朝向设置为传入的值
    ```
    this.time = 0;
    this.setPositionOrientation(worldPosition, worldOrientation);
    ```
    
    5. 使用轨迹管理器创建一个新的轨迹，并设置颜色以及粗细。最后将轨迹可见性设置为 true。
    ```
    this._trail = trailManager.spawnTrail(worldPosition, 3);
    this._trail?.setParameters(Color3.White(), 1);
    this._trail?.setVisible(true);
    ```
    
    在实际使用中，可以调用该方法来创建一个导弹对象，并设置导弹的起始位置、朝向、发射时间等参数。然后使用物理引擎或者自定义逻辑来控制导弹的运动，同时可以通过轨迹管理器记录导弹的轨迹，以便进行显示或者其他处理。
    */
    public launch(shipToChase: Ship, firedBy: Ship, worldPosition: Vector3, worldOrientation: Quaternion, missileTransform: TransformNode, trailManager: TrailManager): void {
        this.transformNode = missileTransform;
        this.input.dx = 0;
        this.input.dy = 0;
        this.shipToChase = shipToChase;
        this.firedBy = firedBy;
        this.time = 0;
        this.setPositionOrientation(worldPosition, worldOrientation);
        this._trail = trailManager.spawnTrail(worldPosition, 3);
        this._trail?.setParameters(Color3.White(), 1);
        this._trail?.setVisible(true);
    }

    dispose() {
        this.transformNode?.dispose();
        //this._trail.dispose();
    }

    // return true if still valid
    /*
    Quaternion.multiply() 是 Babylon.js 中 Quaternion 类的一个方法。它的作用是将两个四元数相乘，生成一个新的四元数。
    // 将 q1 与 q2 相乘，结果保存在 q3 中
    var q3 = q1.multiply(q2);

    */
    public tick(rx: Quaternion, ry: Quaternion, deltaTimeMs: number): boolean {

        if (this.setTime(this.time + deltaTimeMs)) {
            this.quat = this.quat.multiply(rx).multiply(ry);
            this.quat.normalize();
            if (this.transformNode) {
                if (this.transformNode.rotationQuaternion) {
                    this.transformNode.rotationQuaternion = Quaternion.Slerp(this.transformNode.rotationQuaternion, this.quat, 1.);
                }
                this.transformNode.position.addInPlace(this.forward.scale(0.15 * deltaTimeMs));
                if (deltaTimeMs > 0.001) {
                    this._trail?.append(this.transformNode.position);
                }
            }
            return true;
        } else {
            return false;
        }
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `tick` 的方法。该方法用于更新导弹的状态，接收如下参数：
    - `rx: Quaternion`：绕 x 轴旋转的四元数。
    - `ry: Quaternion`：绕 y 轴旋转的四元数。
    - `deltaTimeMs: number`：距上一帧经过的时间（单位为毫秒）。
    函数实现的具体步骤如下：
    1. 将导弹当前时间增加 `deltaTimeMs` 毫秒，并判断导弹是否到达指定生命周期。如果到达，则返回 false。
    ```
    if (this.setTime(this.time + deltaTimeMs)) {
    ```
    2. 将导弹的四元数方向与旋转矩阵乘积，并将结果规格化。随后，将导弹变换节点的旋转属性设置为导弹当前四元数和目标四元数之间的球面插值。
    ```
    this.quat = this.quat.multiply(rx).multiply(ry);
    this.quat.normalize();
    if (this.transformNode) {
        if (this.transformNode.rotationQuaternion) {
            this.transformNode.rotationQuaternion = Quaternion.Slerp(this.transformNode.rotationQuaternion, this.quat, 1.);
        }
    ```
    3. 将导弹向前移动 `0.15 * deltaTimeMs` 的距离，并将此时导弹的位置添加到导弹的轨迹中。注意判断 deltaTimeMs 是否大于 0.001，避免导弹的速度过快导致的轨迹过于稀疏。
    ```
    this.transformNode.position.addInPlace(this.forward.scale(0.15 * deltaTimeMs));
    if (deltaTimeMs > 0.001) {
        this._trail?.append(this.transformNode.position);
    }
    ```
    4. 返回 true，表示导弹更新成功。
    ```
    return true;
    ```
    在实际使用中，可以反复调用该方法来模拟导弹运动的过程，每次传入不同的 `rx`、`ry` 和 `deltaTimeMs` 参数，从而实现导弹的运动、旋转和位置变化。同时，函数内部还可以通过导弹的生命周期、变换节点以及轨迹管理器等对象来对导弹进行更加精细的控制和管理。
    */

    public getWorldMatrix(): Matrix {
        if (this.transformNode) {
            return this.transformNode.getWorldMatrix();
        } else {
            return Matrix.Identity();
        }
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `getWorldMatrix` 的方法。该方法用于获取导弹的世界矩阵，即将导弹从本地坐标系转换到世界坐标系中的矩阵。
    函数实现的具体步骤如下：
    
    1. 判断导弹的变换节点是否存在。
    ```
    if (this.transformNode) {
    ```
    
    2. 如果存在，则返回导弹变换节点的世界矩阵。
    ```
    return this.transformNode.getWorldMatrix();
    ```
    
    3. 如果不存在，则返回单位矩阵。
    ```
    } else {
        return Matrix.Identity();
    }
    ```
    在实际使用中，可以调用该方法来获取导弹的当前世界矩阵。通过其中的旋转、平移等元素，可以计算出导弹在世界坐标系中的位置、方向、速度等信息，以便进行各种物理、决策或可视化上的处理。需要注意的是，在使用该方法之前，必须要确保导弹的变换节点已经正确设置，否则将会返回单位矩阵，无法正确反映导弹的真实状态。
    */

    public getPosition(): Vector3 {
        if (this.transformNode) {
            return this.transformNode.position;
        } else {
            return Vector3.Zero();
        }
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `getPosition` 的方法。该方法用于获取导弹的位置向量，即导弹在本地坐标系中的位置。
    函数实现的具体步骤如下：
    1. 判断导弹的变换节点是否存在。
    ```
    if (this.transformNode) {
    ```
    2. 如果存在，则返回导弹变换节点的位置向量。
    ```
    return this.transformNode.position;
    ```
    3. 如果不存在，则返回原点向量。
    ```
    } else {
        return Vector3.Zero();
    }
    ```
    在实际使用中，可以调用该方法来获取导弹的当前位置向量。通过该向量中的 x、y、z 分量，可以计算出导弹在本地坐标系中的位置，并在不同场景下进行各种物理、决策或可视化上的处理。需要注意的是，在使用该方法之前，必须要确保导弹的变换节点已经正确设置，否则将会返回原点向量，无法正确反映导
    */

    public getOrientation(): Quaternion {
        if (this.transformNode && this.transformNode.rotationQuaternion) {
            return this.transformNode.rotationQuaternion;
        } else {
            return Quaternion.Identity();
        }
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `getOrientation` 的方法。该方法用于获取导弹的方向四元数，即将导弹从本地坐标系转换到世界坐标系中的旋转。
    
    函数实现的具体步骤如下：
    
    1. 判断导弹的变换节点是否存在，以及变换节点是否设置了旋转四元数。
    ```
    if (this.transformNode && this.transformNode.rotationQuaternion) {
    ```
    
    2. 如果条件都满足，则返回导弹变换节点的旋转四元数。
    ```
    return this.transformNode.rotationQuaternion;
    ```
    
    3. 如果条件不满足，则返回单位四元数。
    ```
    } else {
        return Quaternion.Identity();
    }
    ```
    
    在实际使用中，可以调用该方法来获取导弹的当前方向四元数。通过该四元数的 x、y、z、w 分量，可以计算出导弹在世界坐标系中的旋转角度和旋转轴，并在不同场景下进行各种物理、决策或可视化上的处理。需要注意的是，在使用该方法之前，必须要确保导弹的变换节点已经正确设置，并且设置了正确的旋转属性，否则将会返回单位四元数，无法正确反映导弹的真实旋转。
    */

    // return true if still valid
    public setTime(timeMs: number): boolean {
        this.time = timeMs;
        if (timeMs > MISSILE_MAX_LIFE) {
            this.transformNode?.setEnabled(false);
            this._trail?.invalidate();
            return false;
        }
        this.transformNode?.setEnabled(true);
        return true;
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `setTime` 的方法。该方法用于设置导弹的存在时间，并根据时间是否超过最大生存时间来控制导弹是否可见和轨迹是否失效。
    
    函数实现的具体步骤如下：
    
    1. 将传入的时间毫秒数赋值给导弹的 `time` 属性。
    ```
    this.time = timeMs;
    ```
    
    2. 判断导弹的存在时间是否超过最大生存时间。
    ```
    if (timeMs > MISSILE_MAX_LIFE) {
    ```
    
    3. 如果超过，则将导弹变换节点设置为不可见状态，并让导弹所关联的拖尾效果失效。
    ```
    this.transformNode?.setEnabled(false);
    this._trail?.invalidate();
    ```
    
    4. 返回 false，表示导弹已经失效。
    ```
    return false;
    ```
    
    5. 如果未超过，则将导弹变换节点设置为可见状态。
    ```
    this.transformNode?.setEnabled(true);
    ```
    
    6. 返回 true，表示导弹仍然有效。
    ```
    return true;
    ```
    
    在实际使用中，可以调用该方法来设置导弹的存在时间，并根据时间的流逝来控制导弹的可见性和轨迹的有效性。如果导弹已经超过最大生存时间，则可以通过该方法让导弹消失不再产生影响。需要注意的是，在使用该方法之前，必须要先创建并正确地初始化导弹对象，并设置了最大生存时间等参数，否则将无法实现预期的控制效果。
    */

    public tickEnabled(): void {
        this.transformNode?.setEnabled(this.time < MISSILE_MAX_LIFE);
        this._trail?.tickEnabled();
    }

    public getTime(): number {
        return this.time;
    }

    public isValid(): boolean {
        return this.time >= 0 && this.time <= MISSILE_MAX_LIFE;
    }

    public setPositionOrientation(position: Vector3, orientation: Quaternion): void {
        if (this.transformNode) {
            this.transformNode.position.copyFrom(position);
            this.transformNode.rotationQuaternion?.copyFrom(orientation);
            this.quat.copyFrom(orientation);
            this.position.copyFrom(position);
        }
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `setPositionOrientation` 的方法。该方法用于设置导弹的位置和方向四元数，即将导弹从本地坐标系转换到世界坐标系中的位置和旋转。
    
    函数实现的具体步骤如下：
    
    1. 判断导弹的变换节点是否存在。
    ```
    if (this.transformNode) {
    ```
    
    2. 如果存在，则将传入的位置向量赋值给导弹变换节点的位置属性。
    ```
    this.transformNode.position.copyFrom(position);
    ```
    
    3. 如果导弹变换节点设置了旋转四元数，则将传入的方向四元数赋值给导弹变换节点的旋转属性、导弹对象的 `quat` 属性和导弹对象的 `position` 属性。
    ```
    this.transformNode.rotationQuaternion?.copyFrom(orientation);
    this.quat.copyFrom(orientation);
    this.position.copyFrom(position);
    ```
    
    在实际使用中，可以调用该方法来设置导弹的位置和方向。通过该方法传入的位置向量和方向四元数，可以将导弹从本地坐标系转换到世界坐标系中的位置和旋转，并在不同场景中进行各种物理、决策或可视化上的处理。需要注意的是，在使用该方法之前，必须要确保导弹的变换节点已经正确设置，并且设置了正确的位置和旋转属性，否则将无法正确反映导弹的真实位置和方向。
    */
}

export class MissileManager {
    missiles = Array<Missile>();
    private _tmpMatrix = new Matrix();
    private _trailManager: TrailManager;

    constructor(scene: Scene, trailManager: TrailManager) {
        this._trailManager = trailManager;
        for (let i = 0; i < MAX_MISSILES; i++) {
            this.missiles.push(new Missile(scene));
        }
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `constructor` 的构造函数。该构造函数用于创建导弹管理器的实例，其中包括了由一系列导弹对象组成的数组和用于管理导弹拖尾效果的 `TrailManager` 对象。
    函数实现的具体步骤如下：
    1. 接收两个参数，即当前场景对象和用于管理导弹拖尾效果的 `TrailManager` 对象。
    ```
    constructor(scene: Scene, trailManager: TrailManager) {
    ```
    2. 将传入的用于管理导弹拖尾效果的 `TrailManager` 对象赋值给导弹管理器的 `_trailManager` 属性。
    ```
    this._trailManager = trailManager;
    ```
    3. 创建一个空数组用于存储导弹对象，并将最大导弹数量的值 `MAX_MISSILES` 设置为导弹数组的长度。
    ```
    for (let i = 0; i < MAX_MISSILES; i++) {
        this.missiles.push(new Missile(scene));
    }
    ```
    在实际使用中，可以通过该构造函数创建导弹管理器的实例，并初始化其所包含的导弹对象数组和拖尾效果管理器对象。通过导弹管理器实例中的导弹数组和拖尾效果管理器对象，可以对多个导弹对象和其产生的拖尾效果进行集中管理，并且可以针对不同的场景和需求进行自定义设置和处理。需要注意的是，在使用该构造函数之前，必须要先创建并正确初始化 `Scene` 和 `TrailManager` 对象，并确保这些对象的属性和方法与其他代码部分相互配合，否则将无法实现预期的效果。
    */

    public getMissiles(): Array<Missile> {
        return this.missiles;
    }

    public fireMissile(position: Vector3, quaternion: Quaternion, shipToChase: Ship, firedBy: Ship, missileTransform: TransformNode): Nullable<Missile> {
        for (let i = 0; i < MAX_MISSILES; i++) {
            if (!this.missiles[i].isValid()) {
                this.missiles[i].launch(shipToChase, firedBy, position, quaternion, missileTransform, this._trailManager);
                return this.missiles[i];
            }
        }
        return null;
    }
    /*
    这段代码是在 Babylon.js 中定义了一个名为 `fireMissile` 的公共方法。该方法用于发射导弹，并返回一个导弹对象。
    函数实现的具体步骤如下：
    1. 接收五个参数，分别为导弹的起始位置、方向四元数、要追踪的船只对象、发射导弹的船只对象和导弹变换节点。
    ```
    public fireMissile(position: Vector3, quaternion: Quaternion, shipToChase: Ship, firedBy: Ship, missileTransform: TransformNode): Nullable<Missile> {
    ```
    2. 通过循环遍历导弹数组，查找处于空闲状态的导弹对象。
    ```
    for (let i = 0; i < MAX_MISSILES; i++) {
        if (!this.missiles[i].isValid()) {
    ```
    3. 如果找到了一个空闲的导弹对象，则调用它的 launch 方法来设置导弹状态并返回该导弹对象。
    ```
    this.missiles[i].launch(shipToChase, firedBy, position, quaternion, missileTransform, this._trailManager);
    return this.missiles[i];
    ```
    4. 如果遍历完所有导弹对象仍然没有找到空闲的导弹对象，则返回 `null`。
    ```
    return null;
    ```
    在实际使用中，可以通过导弹管理器实例调用该方法来发射导弹，并获取相应的导弹对象实例。通过传入不同的参数，可以控制导弹的起始位置、方向和追踪目标等属性，并在导弹发射后更新导弹的状态和拖尾效果。需要注意的是，在调用该方法之前，必须要先创建并正确初始化导弹管理器实例和导弹对象数组，并确保这些对象的属性和方法与其他代码部分相互配合，否则将无法实现预期的效果。
    */

    public tick(deltaTime: number, explosionManager: ExplosionManager, world: World): void {
        for (let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            missile.tickEnabled();
            if (!missile.isValid()) {
                continue;
            }
            var wmat = missile.getWorldMatrix();
            if (!wmat || !missile.transformNode || !missile.isValid()) {
                continue;
            }

            const forward = new Vector3(wmat.m[8], wmat.m[9], wmat.m[10]);
            const right = new Vector3(wmat.m[0], wmat.m[1], wmat.m[2]);
            const up = new Vector3(wmat.m[4], wmat.m[5], wmat.m[6]);
            missile.forward = forward;
            missile.up = up;
            missile.right = right;

            let keepMissile = missile.shipToChase && missile.shipToChase.isValid();

            if (world.collideWithAsteroids(missile.transformNode.position, 0.5)) {//首先判断当前导弹是否与小行星发生了碰撞，如果是，则将 keepMissile 设为 false，表示导弹需要销毁。
                keepMissile = false;
                missile.setTime(MISSILE_MAX_LIFE + 1);
            }
            if (keepMissile && missile.shipToChase) {//如果导弹仍然需要继续运动，并且存在追踪目标，则计算导弹前进方向和目标方向之间的夹角比率 turnRatio，并调用导弹的 goToward 方法将导弹转向目标位置。
                const aimPos = missile.shipToChase.root.position;
                const turnRatio = Math.min(missile.time / 100000, 0.05);
                const dotTgt = missile.goToward(aimPos, missile.transformNode.position, turnRatio);

                // 根据导弹的输入值 input.dx 和 input.dy 计算导弹绕 X 轴和 Y 轴旋转的四元数 rx 和 ry，并调用导弹的 tick 方法更新导弹的状态。
                const rx = Quaternion.RotationAxis(new Vector3(0, 1, 0), missile.input.dx);
                rx.toRotationMatrix(this._tmpMatrix);
                const ry = Quaternion.RotationAxis(new Vector3(this._tmpMatrix.m[0], this._tmpMatrix.m[1], this._tmpMatrix.m[2]), missile.input.dy);
                keepMissile = missile.tick(rx, ry, deltaTime);
            }
            if (!keepMissile) {//最后，如果导弹不再需要运动，则销毁导弹并触发爆炸效果。
                explosionManager.spawnExplosion(missile.getPosition(), missile.getOrientation());
            }
        }
    }
    /*
    这段代码是在 `MissileManager` 类中定义的 `tick` 方法。该方法每帧都会被调用，在其中更新导弹状态，检测碰撞并处理导弹销毁和爆炸。
    
    具体实现步骤如下：
    
    1. 遍历当前所有导弹，对于每个导弹，执行以下步骤。
    ```
    for (let i = 0; i < this.missiles.length; i++) {
        const missile = this.missiles[i];
        // TODO: 更新导弹状态
        // TODO: 检测是否碰撞
        // TODO: 处理销毁和爆炸
    }
    ```
    
    2. 调用导弹实例的 `tickEnabled` 方法，用于支持在场景不活动时暂停导弹的计时器、拖尾效果等。
    ```
    missile.tickEnabled();
    ```
    
    3. 判断当前导弹是否为有效状态，如果不是，则直接跳过后续处理。
    ```
    if (!missile.isValid()) {
        continue;
    }
    ```
    
    4. 获取导弹的世界变换矩阵，并从中提取出导弹的朝向向量和右侧向量等属性，用于后续的导弹运动控制。
    ```
    var wmat = missile.getWorldMatrix();
    const forward = new Vector3(wmat.m[8], wmat.m[9], wmat.m[10]);
    const right = new Vector3(wmat.m[0], wmat.m[1], wmat.m[2]);
    const up = new Vector3(wmat.m[4], wmat.m[5], wmat.m[6]);
    missile.forward = forward;
    missile.up = up;
    missile.right = right;
    ```
    
    5. 检测当前导弹是否与小行星发生碰撞，如果是，则销毁导弹并触发爆炸效果。
    ```
    if (world.collideWithAsteroids(missile.transformNode.position, 0.5)) {
        keepMissile = false;
        missile.setTime(MISSILE_MAX_LIFE + 1);
    }
    ```
    
    6. 如果导弹仍处于有效状态，并且有目标船只，则计算导弹的运动轨迹，进行导弹的转向和加速等操作。
    ```
    let keepMissile = missile.shipToChase && missile.shipToChase.isValid();
    
    if (keepMissile && missile.shipToChase) {
        const aimPos = missile.shipToChase.root.position;
        const turnRatio = Math.min(missile.time / 100000, 0.05);
        const dotTgt = missile.goToward(aimPos, missile.transformNode.position, turnRatio);
    
        const rx = Quaternion.RotationAxis(new Vector3(0, 1, 0), missile.input.dx);
        rx.toRotationMatrix(this._tmpMatrix);
        const ry = Quaternion.RotationAxis(new Vector3(this._tmpMatrix.m[0], this._tmpMatrix.m[1], this._tmpMatrix.m[2]), missile.input.dy);
        keepMissile = missile.tick(rx, ry, deltaTime);
    }
    ```
    
    7. 如果导弹已经失去追踪目标或者已经超过最大生命周期，则销毁导弹并触发爆炸效果。
    ```
    if (!keepMissile) {
        explosionManager.spawnExplosion(missile.getPosition(), missile.getOrientation());
    }
    ```
    
    在实际使用中，可以通过导弹管理器实例调用该方法来更新当前所有导弹的状态，并在导弹与其他对象发生碰撞或者超过生命周期时触发爆炸效果。
    需要注意的是，在调用该方法之前，必须要先创建并正确初始化导弹管理器实例和导弹对象数组，并确保这些对象的属性和方法与其他代码部分相互配合，否则将无法实现预期的效果。
    */

    public invalidateMissileChasing(shipToChase: Ship): void {
        for (let i = 0; i < this.missiles.length; i++) {
            const missile = this.missiles[i];
            if (missile.isValid() && missile.shipToChase == shipToChase) {
                missile.setTime(MISSILE_MAX_LIFE + 1);
                return;
            }
        }
    }
    /*
    该代码是一个针对导弹的管理器类 `MissileManager` 中的公共方法 `invalidateMissileChasing`，用于使某个具体船只所追踪的所有导弹失去目标。其主要实现思路为：从当前所有导弹中找到那些追踪目标为指定船只的导弹，并将这些导弹的生命周期设为最大值加一，从而立即触发这些导弹的销毁和爆炸。
    
    具体实现步骤如下：
    
    1. 在导弹管理器类中定义方法 `invalidateMissileChasing`，并传入需要使导弹失去目标的目标船只参数 `shipToChase: Ship`。
    
    2. 遍历当前所有导弹，查找与目标船只相关的导弹。
    ```
    for (let i = 0; i < this.missiles.length; i++) {
        const missile = this.missiles[i];
        if (missile.isValid() && missile.shipToChase == shipToChase) {
            // 导弹追踪目标为指定船只
        }
    }
    ```
    
    3. 对于每个查找到的导弹，将其生命周期设为最大值加一，触发导弹销毁和爆炸。
    ```
    missile.setTime(MISSILE_MAX_LIFE + 1);
    ```
    
    4. 如果有多个导弹都追踪了这个船只，则仅处理第一个找到的导弹，并直接返回，避免重复处理。
    ```
    return;
    ```
    
    该方法可以在游戏场景中某个船只需要停止追踪目标时使用，例如玩家输入命令让自己的船只停止攻击某个目标。在具体应用中，也可以通过导弹管理器实例调用该方法来实现特定的导弹控制功能。
    */

    dispose() {
        this.missiles.forEach(missile => {
            missile.dispose();
        });
    }
}