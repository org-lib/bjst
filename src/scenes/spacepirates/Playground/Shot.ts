import { Mesh, Scene, BoxBuilder, Matrix, StandardMaterial, Color3, Vector3, MeshBuilder, Nullable, VertexData, VertexBuffer, Engine, GlowLayer } from "@babylonjs/core";
import { Assets } from "./Assets";
import { Ship } from "./Ship"
import { World } from "./World";

/// <reference lib="dom" />

export const MAX_SHOTS = 200;

export class Shot {
    ttl: number = 0;
    firedBy?: Ship;
}

/*

Babylon.js中的Vector3.TransformNormal方法是用于将法向量（normal vector）从一个坐标系转换到另一个坐标系的方法。它接受两个参数：要转换的法向量和转换矩阵。转换矩阵可以是一个4x4的矩阵，也可以是一个3x3的矩阵。

使用Vector3.TransformNormal方法的步骤如下：

1. 创建要转换的法向量。
2. 创建转换矩阵。
3. 调用Vector3.TransformNormal方法，将法向量转换到目标坐标系。
4. 使用转换后的法向量进行后续操作。

例如，下面的代码将一个法向量从世界坐标系转换到相机坐标系：

```javascript
var worldNormal = new BABYLON.Vector3(0, 1, 0);
var cameraTransformMatrix = camera.getViewMatrix().clone().invert();
var cameraNormal = BABYLON.Vector3.TransformNormal(worldNormal, cameraTransformMatrix);
```

在这个例子中，我们创建了一个表示世界坐标系中的法向量的Vector3对象。然后，我们获取相机的视图矩阵，并将其倒置，以获得相机的逆矩阵。最后，我们使用Vector3.TransformNormal方法将世界法向量转换为相机坐标系中的法向量。

*/

export class ShotManager {

    public shots = Array<Shot>();
    private _matricesData = new Float32Array(16 * MAX_SHOTS);
    private _shotMesh: Nullable<Mesh> = null;
    private _tmpVec3: Vector3 = new Vector3();
    /*
    这段代码是一个构造函数，用于创建游戏中的子弹实例。
    
    实现过程如下：
    
    根据传入的assets参数获取子弹的几何体结构（包括位置坐标和索引等）。
    基于获取到的几何体数据，创建新的Mesh对象，并应用几何体数据到新的Mesh上。
    初始化存放矩阵数据的数组，并使用Matrix.Zero()将其初始化为全0矩阵，并将这些矩阵数据写入MatricesData数组中。
    将写有矩阵数据的 MatricesData 数组传递给 thinInstanceSetBuffer 方法，将其设置为精简实例矩阵缓冲区。
    将新的 Mesh 添加到场景中，并根据传入的 glowLayer 参数，修改该Mesh的材质，使之在Glow Layer中获得正确的效果。
    克隆 assets 中的 projectileShader 材质，并将其应用到该Mesh上，同时设置该材质的alphaMode，以便在渲染时获得正确的透明度。
    这段代码主要用于创建游戏中子弹的实例化Mesh，并将其添加到场景中，同时设置子弹的材质和透明度等相关属性。


    整个构造函数的目的是构建游戏中一种重要的元素-子弹射线，它可以被添加到游戏世界中，并随着时间的流逝不断地发射子弹。
    子弹射线（Bullet Line）通常指游戏中枪械类武器发射的实体弹药在空中留下的可见轨迹或线条。它可用于为游戏增加视觉效果并提高游戏体验。





    */
    constructor(assets: Assets, scene: Scene, glowLayer: GlowLayer) {
        if (!assets.projectile) {
            return;
        }
        var arrayPos = assets.projectile.getVerticesData(VertexBuffer.PositionKind);
        var arrayIndex = assets.projectile.getIndices();

        var shotMesh = new Mesh("custom", scene);
        var vertexData = new VertexData();

        vertexData.positions = arrayPos;
        vertexData.indices = arrayIndex;

        vertexData.applyToMesh(shotMesh);

        var m = Matrix.Zero();
        var index = 0;

        for (var shot = 0; shot < MAX_SHOTS; shot++) {
            this.shots.push({ ttl: -1 });

            m.copyToArray(this._matricesData, index * 16);//从 m 中读取 16 个 float 类型的数据，并将它们复制到 _matricesData 数组中，从 index * 16 这个偏移量开始存储
            index++;
        }

        shotMesh.thinInstanceSetBuffer("matrix", this._matricesData, 16, false);//将 _matricesData 数组中存储的每个子弹实例的变换矩阵数据赋值到名为 "matrix" 的缓冲区中，并指定每个实例数据占据 16 个 float 数据（即一个 4x4 矩阵），并且这些数据不需要归一化

        //GLOW LAYER ISSUE
        glowLayer.referenceMeshToUseItsOwnMaterial(shotMesh);

        var mat = assets.projectileShader?.clone("projectiles");
        if (mat) {
            shotMesh.material = mat;
            mat.alphaMode = Engine.ALPHA_ADD;
        }
        this._shotMesh = shotMesh;
    }
    /*
    上述代码中，首先使用 assets.projectile 获取子弹模型的顶点位置数据(arrayPos)和索引数据(arrayIndex)。然后，使用这些数据初始化一个新的网格对象 shotMesh。
    接下来，创建一个 VertexData 对象 vertexData，并将顶点位置数据(arrayPos)和索引数据(arrayIndex)分配给它。
    通过调用 vertexData.applyToMesh(shotMesh) ，将顶点数据应用到shotMesh网格中。
    然后，使用 Matrix.Zero() 创建一个矩阵对象m，并定义一个变量 index 用于索引。通过循环迭代 MAX_SHOTS 次，将矩阵m的数据复制到 this._matricesData 数组中，并更新 index 的值。
    最后，通过调用 shotMesh.thinInstanceSetBuffer("matrix", this._matricesData, 16, false)，将子弹实例的变换矩阵数据赋值给名为"matrix"的缓冲区。
    */

    public getMatrixData(): Float32Array {
        return this._matricesData;
    }

    public getMatrices(): Float32Array {
        return this._matricesData;
    }

    /*
    `Vector3.TransformNormal`方法可以将向量应用于矩阵的旋转和缩放部分，但不应用于平移部分。它返回一个新的向量，该向量是通过将当前向量乘以矩阵的旋转和缩放部分得到的
    */
    public addShot(ship: Ship, worldMatrix: Matrix, isHuman: boolean, cannonIndex: number): void {
        const startIndex = ship.faction ? (MAX_SHOTS / 2) : 0;
        for (var index = startIndex; index < (startIndex + MAX_SHOTS / 2); index++) {

            if (this.shots[index].ttl <= 0) {
                const flIndex = index * 16;
                const clIndex = index * 4;

                if (ship.cannonR && ship.cannonL) {
                    const cannonLocalOffset = (cannonIndex ? ship.cannonR : ship.cannonL).clone();
                    cannonLocalOffset.z += 0.2;
                    const offsetCannon = Vector3.TransformNormal(cannonLocalOffset.scale(25), worldMatrix);
                    worldMatrix.copyToArray(this._matricesData, index * 16);
                    this._matricesData[flIndex + 12] += offsetCannon.x;
                    this._matricesData[flIndex + 13] += offsetCannon.y;
                    this._matricesData[flIndex + 14] += offsetCannon.z;

                    this.shots[index].ttl = 5000;
                    this.shots[index].firedBy = ship;
                }
                return;
            }
        }
    }
    /*
    这段代码是一个对象的方法，用于更新游戏中炮弹的运动。
    
    实现过程如下：
    
    遍历所有的炮弹，根据炮弹的存活时间来更新它的位置。如果一个炮弹的存活时间大于0，则将其当前的位置加上速度、时间等参数计算得到的位移，以更新炮弹的新位置。
    通过判断新位置是否与陨石重叠，来判断炮弹是否被击中。如果新位置和任何一个陨石的距离小于一定范围（这里是6），则将该炮弹ttl（存活时间）置为-1，表示该炮弹已被击中。
    如果一个炮弹已经被击中，将其占用的矩阵数据全部归零（这里是16个数，即4x4的矩阵数据）。
    最后，将更新后的矩阵数据应用到实例化网格上。
    这段代码主要用于模拟游戏中炮弹的飞行路径和碰撞检测，实现了游戏中的射击效果。

    8,9,10对应的是子弹的方向向量，12,13,14对应的是子弹的位置坐标。通过将方向向量乘以速度和时间间隔得到移动距离，然后将其加到当前位置坐标上，从而更新子弹的位置。
    因为在三维空间中，位置和方向都可以用三个数值来表示（例如：x、y、z），所以可以使用相同的数组进行存储和操作。但是这并不意味着它们可以直接相加，而是需要分别进行运算。
    */
    public tick(deltaTime: number, world: World): void {
        const shootSpeed = 0.5;

        for (var index = 0; index < MAX_SHOTS; index++) {
            const flIndex = index * 16;
            if (this.shots[index].ttl > 0) {
                this._matricesData[flIndex + 12] += this._matricesData[flIndex + 8] * shootSpeed * deltaTime;
                this._matricesData[flIndex + 13] += this._matricesData[flIndex + 9] * shootSpeed * deltaTime;
                this._matricesData[flIndex + 14] += this._matricesData[flIndex + 10] * shootSpeed * deltaTime;
                this.shots[index].ttl -= deltaTime;
                this._tmpVec3.set(this._matricesData[flIndex + 12], this._matricesData[flIndex + 13], this._matricesData[flIndex + 14])
                if (world.collideWithAsteroids(this._tmpVec3, 6)) {//检测子弹是否与陨石碰撞
                    this.shots[index].ttl = -1;
                }
            } else {
                for (let i = 0; i < 16; i++) {
                    this._matricesData[flIndex + i] = 0;
                }
            }
        }
        this.matricesToInstances();
    }
    /*
    这段代码定义了一个名为 matricesToInstances() 的公共方法，用于将矩阵转换为实例。它是使用 babylonjs 实现批量渲染的关键方法之一。
    
    在该方法中，首先判断 this._shotMesh 是否存在。如果存在，则调用 thinInstanceBufferUpdated() 方法，将当前 Mesh 上的矩阵转换为实例数据，并更新缓冲区。
    
    thinInstanceBufferUpdated() 方法是 babylonjs 中的一个重要方法，它可以将一个 mesh 对象上的矩阵转换为实例数据，并在缓冲区更新后重新渲染。
    
    使用该方法时，需要先创建一个 Mesh 对象，并将其设为可批量渲染（即开启实例化渲染），然后再通过该方法将矩阵转换为实例数据。例如：
    
    typescript
    // 创建一个名为sphere的可批量渲染的 Mesh
    let sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
    sphere.thinInstanceSetBuffer("matrix", matrixBuffer, 16);
    
    // 对该 Mesh 进行一些初始化和设置操作...
    
    // 调用matricesToInstances方法，将当前 Mesh 上的矩阵转换为实例数据，并更新缓冲区
    sphere.matricesToInstances();
    这个示例代码创建了一个名为 sphere 的 Mesh 实例，并设置了实例缓冲区。然后调用 matricesToInstances() 方法，将矩阵转换为实例数据，并更新缓冲区。
    */
    public matricesToInstances(): void {
        if (this._shotMesh) {
            this._shotMesh.thinInstanceBufferUpdated("matrix");
        }
    }

    public dispose(): void {
        if (this._shotMesh) {
            this._shotMesh.dispose();
        }
    }
}