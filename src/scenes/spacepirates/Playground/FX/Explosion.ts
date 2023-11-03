import { Vector3, Scene, MeshBuilder, StandardMaterial, Color3, Nullable, Quaternion, Animation, Mesh, AbstractMesh, NodeMaterial, GlowLayer } from "@babylonjs/core";
import { Assets } from "../Assets";
import { SparksEffect } from "./SparksEffect";

export const MAX_EXPLOSIONS = 4;//作用是限制场景中最多同时存在的爆炸效果数量。
const SPARK_COUNT_EXPLOSION = 100;//它定义了爆炸效果中火花的数量。
const EXPLOSION_TIMEOUT = 2000;//它表示爆炸效果的持续时间，单位是毫秒。

/*
这段代码定义了一个名为Explosion的类，表示爆炸效果。每个Explosion对象包含一个爆炸的网格模型、火花特效以及时间信息。该类提供了一系列公共方法，用于设置和更新爆炸效果的各种属性。

在构造函数中，通过传入Babylon.js的场景对象、资源文件、Glow Layer对象，创建火花特效，并进行初始化操作。

该类提供了一些公共方法，如：

setTime(timeMs: number)：设置爆炸效果已经持续的时间。
addDeltaTime(deltaTimeMs: number)：向当前爆炸效果添加增量时间。
tickEnabled()：用于判断当前爆炸效果是否仍在进行中，如果超过一定时间则自动停止火花特效。
setPositionOrientation(position: Vector3, orientation: Quaternion)：设置爆炸效果的位置和朝向。
valid()：检查当前爆炸效果是否仍然有效（即在规定时间内）。
dispose()：释放所有爆炸效果占用的资源。
该类还定义了一些常量和私有变量，如_explosionMesh、_sparkEffect和_time，用于存储爆炸效果的网格模型、火花特效和已持续时间等信息。
*/
export class Explosion {
    private _explosionMesh: Nullable<AbstractMesh> = null;
    private _sparkEffect: SparksEffect;
    private _time: number = 9999; // in milliseconds

    constructor(scene: Scene, assets: Assets, glowLayer: GlowLayer) {
        this._sparkEffect = new SparksEffect(scene, assets, SPARK_COUNT_EXPLOSION);
        if (assets.explosionMesh && assets.explosionMaterial) {
            this._explosionMesh = assets.explosionMesh?.clone("explosionClone", null);
            if (this._explosionMesh) {
                //GLOW LAYER ISSUE
                glowLayer.referenceMeshToUseItsOwnMaterial(this._explosionMesh);
                this._explosionMesh.material = assets.explosionMaterial.clone("explosionMaterialClone", true);
                if (this._explosionMesh.material) {

                    //this._explosionMesh.material.getBlockByName("noiseTex").texture = material.noiseTexture;
                    (this._explosionMesh.material as any).getBlockByName("rand").value = Math.random();
                    (this._explosionMesh.material as any).getBlockByName("timeout").value = EXPLOSION_TIMEOUT / 1000;
                    (this._explosionMesh.material as any).getBlockByName("startTime").value = 0;
                }
            }
        }

        this.tickEnabled();
    }
    /*
    这段代码实现了一个构造函数，用于创建炸弹爆炸特效。下面是代码的逐行解释：
    
    1. `constructor(scene: Scene, assets: Assets, glowLayer: GlowLayer) {`
    
       构造函数使用了 TypeScript 语法，并接受了三个参数：场景对象、资源对象和 GlowLayer 对象。
    
    2. `this._sparkEffect = new SparksEffect(scene, assets, SPARK_COUNT_EXPLOSION);`
    
       在构造函数中创建了 `_sparkEffect` 对象，该对象是一个 SparksEffect 类的实例，用于创建火花特效。
    
    3. `if (assets.explosionMesh && assets.explosionMaterial) {`
    
       判断资源对象是否包含炸弹爆炸模型和爆炸材质。
    
    4. `this._explosionMesh = assets.explosionMesh?.clone("explosionClone", null);`
    
       如果资源对象包含炸弹爆炸模型，则将其克隆一份，并赋值给 `_explosionMesh` 变量。
    
    5. `if (this._explosionMesh) {`
    
       判断 `_explosionMesh` 是否存在。
    
    6. `glowLayer.referenceMeshToUseItsOwnMaterial(this._explosionMesh);`
    
       调用 GlowLayer 的 `referenceMeshToUseItsOwnMaterial` 方法，将 `_explosionMesh` 对象设置为自己的材质。
    
    7. `this._explosionMesh.material = assets.explosionMaterial.clone("explosionMaterialClone", true);`
    
       克隆资源对象中的爆炸材质，并将其赋值给 `_explosionMesh.material` 属性。
    
    8. `(this._explosionMesh.material as any).getBlockByName("rand").value = Math.random();`
    
       通过 `material.getBlockByName` 获取材质中的特定着色器块，然后设置其属性值。在本行中，我们设置了 `"rand"` 属性值为一个随机数。
    
    9. `(this._explosionMesh.material as any).getBlockByName("timeout").value = EXPLOSION_TIMEOUT / 1000;`
    
       设置 `"timeout"` 属性值为常量 `EXPLOSION_TIMEOUT` 的值除以 1000。
       其中 EXPLOSION_TIMEOUT 可能是一个常量，表示炸弹爆炸的持续时间（以毫秒为单位）。在这里，将 EXPLOSION_TIMEOUT 除以 1000 是为了将其转换为以秒为单位，因为该属性块的默认单位是秒。
    
    10. `(this._explosionMesh.material as any).getBlockByName("startTime").value = 0;`
    
        设置 `"startTime"` 属性值为 0。
    
    11. `this.tickEnabled();`
    
        最后调用 `tickEnabled` 方法，启用对象的更新循环。
    
    */

    public setTime(timeMs: number): void {
        this._time = timeMs;
        const scale = 1.0 + timeMs * 0.04;
        const visibility = 1.0 - timeMs * 0.001;
        if (this._explosionMesh) {
            (this._explosionMesh.material as any).getBlockByName("Time").value = timeMs / 1000;
        }

        this._sparkEffect.setTime(timeMs);

        this.tickEnabled();
    }

    public addDeltaTime(deltaTimeMs: number): void {
        this.setTime(this._time + deltaTimeMs);
    }

    public tickEnabled(): void {
        if (this._explosionMesh) {
            this._explosionMesh.setEnabled(this._time < EXPLOSION_TIMEOUT);
        }
        this._sparkEffect.tickEnable();
    }

    public setPositionOrientation(position: Vector3, orientation: Quaternion): void {
        if (this._explosionMesh) {
            this._explosionMesh.rotationQuaternion?.copyFrom(orientation);
            this._explosionMesh.position.copyFrom(position);
        }
        this._sparkEffect.setPositionOrientation(position, orientation);
    }

    public valid(): boolean {
        return this._time >= 0 && this._time <= EXPLOSION_TIMEOUT;
    }

    public getTime(): number {
        return this._time;
    }

    public getPosition(): Vector3 {
        if (this._explosionMesh) {
            return this._explosionMesh.position;
        } else {
            return Vector3.Zero();
        }
    }

    public getOrientation(): Quaternion {
        if (this._explosionMesh) {
            return this._explosionMesh.rotationQuaternion ? this._explosionMesh.rotationQuaternion : Quaternion.Identity();
        } else {
            return Quaternion.Identity();
        }
    }

    public dispose(): void {
        this._explosionMesh?.dispose();
        this._sparkEffect.dispose();
    }
}

export class ExplosionManager {
    private _explosions = new Array<Explosion>();

    constructor(scene: Scene, assets: Assets, glowLayer: GlowLayer) {
        for (let i = 0; i < MAX_EXPLOSIONS; i++) {
            this._explosions.push(new Explosion(scene, assets, glowLayer));
        }
    }

    public getExplosions(): Array<Explosion> {
        return this._explosions;
    }

    public spawnExplosion(position: Vector3, orientation: Quaternion): void {//根据传入的参数，生成新的爆炸效果。如果当前存在可用的爆炸效果，则重置其状态并设置其属性。
        for (let i = 0; i < this._explosions.length; i++) {
            const explosion = this._explosions[i];
            if (!explosion.valid()) {
                explosion.setPositionOrientation(position, orientation);
                explosion.setTime(0);
                return;
            }
        }
    }

    public tick(deltaTime: number): void {// 对所有爆炸效果进行更新，将增量时间deltaTime传入到每个爆炸效果中。
        this._explosions.forEach((explosion) => {
            explosion.addDeltaTime(deltaTime);
            explosion.tickEnabled();
        });
    }

    public dispose(): void {
        this._explosions.forEach((explosion) => {
            explosion.dispose();
        });
    }
}
