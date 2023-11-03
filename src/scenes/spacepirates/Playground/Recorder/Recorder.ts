import { Color3, Quaternion, Vector3, Nullable } from "@babylonjs/core";
import { ShipManager } from "../Ship";
import { ExplosionManager } from "../FX/Explosion"
import { SparksEffects } from "../FX/SparksEffect"
import { Shot, ShotManager, MAX_SHOTS } from "../Shot"
import { MissileManager, Missile } from "../Missile"
import { TrailManager, Trail, TRAIL_LENGTH } from "../FX/Trail"

class PositionOrientationFrame {
    position: Vector3 = new Vector3();
    orientation: Quaternion = new Quaternion();
    enabled: boolean = false;
}

class TimedEffect {
    position: Vector3 = new Vector3();
    orientation: Quaternion = new Quaternion();
    time: number = 0;
}

class Shots {
    shots = Array<Shot>();
    matricesData = new Float32Array(16 * MAX_SHOTS);
}

class TrailData {
    color: Color3 = new Color3();
    alpha: number = 1;
    side: number = 3;
}

class RecordFrame {

    private static _tmpQuaternion = new Quaternion();
    private static _tmpVec3 = new Vector3();

    ships: Array<PositionOrientationFrame> = new Array<PositionOrientationFrame>();
    explosions: Array<TimedEffect> = new Array<TimedEffect>();
    sparks: Array<TimedEffect> = new Array<TimedEffect>();
    missiles: Array<TimedEffect> = new Array<TimedEffect>();
    shots: Shots = new Shots();
    trails: Array<TrailData> = new Array<TrailData>();
    trailData: Nullable<Float32Array> = null;
    trailCurrentIndex: number = 0;
    // [X] ships
    // [X] shots
    // [X] explosion
    // [X] particles
    // [ ] missiles
    // [ ] trails

    /*
    这段代码是Babylon.js游戏引擎的一部分，主要用于存储游戏中各种对象（例如飞船、爆炸效果等）的信息，以便进行回放或其他操作。下面是代码实现的具体步骤：
    1. 首先，将所有飞船的位置、方向和启用状态（通过检查 shipMesh 是否为 null 来确定）记录到 this.ships 数组中。
    2. 然后，将所有爆炸效果的位置、方向和时间记录到this.explosions数组中。
    3. 接着，将所有火花效果的位置、方向和时间记录到this.sparks数组中。
    4. 然后，将所有导弹的位置、方向和时间记录到this.missiles数组中。
    5. 接着，将所有拖尾效果的颜色、透明度和边缘记录到this.trails数组中，并将所有拖尾数据记录到 this.trailData 数组中。
    6. 最后，将所有子弹的矩阵数据和实际数据记录到 this.shots.matricesData 和 this.shots.shots 数组中。
    使用storeFrame方法可以在游戏运行时将游戏中各种对象的信息记录下来，方便进行回放或其他处理。这对于游戏开发者或游戏玩家都非常有用，可以更好地了解游戏的运作方式和细节。
    */
    public storeFrame(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager): void {
        for (let i = 0; i < shipManager.ships.length; i++) {
            const ship = shipManager.ships[i];
            this.ships[i].position.copyFrom(ship.root.position);
            this.ships[i].orientation.copyFrom(ship.root.rotationQuaternion ? ship.root.rotationQuaternion : Quaternion.Identity());
            this.ships[i].enabled = !!ship.shipMesh?.isEnabled();
        }

        const explosionArray = explosionManager.getExplosions();
        for (let i = 0; i < explosionArray.length; i++) {
            const exp = explosionArray[i];
            this.explosions[i].position.copyFrom(exp.getPosition());
            this.explosions[i].orientation.copyFrom(exp.getOrientation());
            this.explosions[i].time = exp.getTime();
        }

        const sparksArray = sparksEffects.getSparksEffects();
        for (let i = 0; i < sparksArray.length; i++) {
            const spa = sparksArray[i];
            this.sparks[i].position.copyFrom(spa.getPosition());
            this.sparks[i].orientation.copyFrom(spa.getOrientation());
            this.sparks[i].time = spa.getTime();
        }

        const missileArray = missileManager.getMissiles();
        for (let i = 0; i < missileArray.length; i++) {
            const mis = missileArray[i];
            this.missiles[i].position.copyFrom(mis.getPosition());
            this.missiles[i].orientation.copyFrom(mis.getOrientation());
            this.missiles[i].time = mis.getTime();
        }

        const trailArray = trailManager.getTrails();
        this.trailData = new Float32Array(TRAIL_LENGTH * 4 * trailArray.length);
        this.trailData.set(trailManager.getData());
        this.trailCurrentIndex = trailManager.getCurrentIndex();
        for (let i = 0; i < trailArray.length; i++) {
            const trail = trailArray[i];
            this.trails[i].color.copyFrom(trail.getColor());
            this.trails[i].alpha = trail.getAlpha();
            this.trails[i].side = trail.getSide();
        }

        this.shots.matricesData.set(shotManager.getMatrixData());
        this.shots.shots = shotManager.shots.slice(0);
    }
    /*
    这段代码是Babylon.js游戏引擎的一部分，主要用于恢复之前存储的游戏状态，以便进行回放或其他操作。下面是代码实现的具体步骤：
    1. 首先，将存储的飞船位置、方向和启用状态信息复制到现有的飞船对象中，并清除任何存在的贴花。
    2. 然后，将存储的爆炸效果位置、方向和时间信息应用于现有的爆炸对象中。
    3. 接着，将存储的火花效果位置、方向和时间信息应用于现有的火花对象中。
    4. 然后，将存储的导弹位置、方向和时间信息应用于现有的导弹对象中。
    5. 接着，将存储的拖尾效果颜色、透明度和可见性应用于现有的拖尾对象中，并更新所有拖尾对象。
    6. 最后，将存储的子弹矩阵数据和实际数据应用于现有的子弹对象中，并将矩阵数据转换为实例数据。
    使用restoreFrame方法可以在游戏运行时恢复之前存储的游戏状态，方便进行回放或其他处理。这对于游戏开发者或游戏玩家都非常有用，可以更好地了解游戏的运作方式和细节，并能够重新体验先前的游戏状态。
    */
    public restoreFrame(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        trailVisibilityMask: number): void {
        for (let i = 0; i < shipManager.ships.length; i++) {
            const ship = shipManager.ships[i];
            ship.root.position.copyFrom(this.ships[i].position);
            if (ship.root.rotationQuaternion) {
                ship.root.rotationQuaternion.copyFrom(this.ships[i].orientation);
            }
            ship.shipMesh?.setEnabled(this.ships[i].enabled);
            if (ship.lastDecal) {
                ship.lastDecal.dispose();
                ship.lastDecal = null;
            }
        }

        const explosionArray = explosionManager.getExplosions();
        for (let i = 0; i < explosionArray.length; i++) {
            const exp = explosionArray[i];
            exp.setPositionOrientation(this.explosions[i].position, this.explosions[i].orientation);
            exp.setTime(this.explosions[i].time);
        }

        const sparksArray = sparksEffects.getSparksEffects();
        for (let i = 0; i < sparksArray.length; i++) {
            const spa = sparksArray[i];
            spa.setPositionOrientation(this.sparks[i].position, this.sparks[i].orientation);
            spa.setTime(this.sparks[i].time);
        }

        const missileArray = missileManager.getMissiles();
        for (let i = 0; i < missileArray.length; i++) {
            const mis = missileArray[i];
            mis.setPositionOrientation(this.missiles[i].position, this.missiles[i].orientation);
            mis.setTime(this.missiles[i].time);
        }

        const trailArray = trailManager.getTrails();
        if (this.trailData) {
            trailManager.getData().set(this.trailData);
        }
        trailManager.setCurrentIndex(this.trailCurrentIndex);
        for (let i = 0; i < trailArray.length; i++) {
            const trail = trailArray[i];
            trail.setParameters(this.trails[i].color, this.trails[i].alpha);
            trail.setVisible((this.trails[i].side & trailVisibilityMask) ? true : false);
            trail.update();
        }
        trailManager.update();

        shotManager.getMatrixData().set(this.shots.matricesData);
        shotManager.shots = this.shots.shots.slice(0);
        shotManager.matricesToInstances();
    }
    /*
    这段代码是Babylon.js游戏引擎的一部分，主要用于恢复之前存储的游戏状态并实现平滑过渡效果。下面是代码实现的具体步骤：
    1. 对于每个飞船对象，将其位置和旋转信息进行线性插值，并将新的位置和旋转信息应用到现有的飞船上。
    2. 对于每个爆炸效果对象，将其位置和旋转信息进行球面插值，并将新的位置和旋转信息应用到现有的爆炸效果上。同时更新爆炸效果的时间信息，以实现平滑过渡效果。
    3. 对于每个火花效果对象，同样进行球面插值，并且更新时间信息。
    4. 对于每个导弹对象，同样进行线性插值，并更新时间信息。
    5. 对于每个拖尾效果对象，设置拖尾颜色、透明度和可见性，并更新拖尾对象。
    6. 对于子弹矩阵数据，对当前帧和下一帧之间各个元素进行线性插值，并将插值结果应用到现有的子弹对象中。
    使用restoreFrameBlend方法可以在游戏运行时平滑恢复之前存储的游戏状态，并实现平滑过渡效果。相比于restoreFrame方法，restoreFrameBlend方法能够更加顺滑地恢复游戏状态，使得游戏更具流畅性和可玩性。
    */
    public restoreFrameBlend(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        nextFrame: RecordFrame,
        trailVisibilityMask: number,
        t: number): void {
        for (let i = 0; i < shipManager.ships.length; i++) {
            const ship = shipManager.ships[i];
            Vector3.LerpToRef(this.ships[i].position, nextFrame.ships[i].position, t, ship.root.position);
            if (ship.root.rotationQuaternion) {
                Quaternion.SlerpToRef(this.ships[i].orientation, nextFrame.ships[i].orientation, t, ship.root.rotationQuaternion);
            }
            ship.shipMesh?.setEnabled(this.ships[i].enabled);
            if (ship.lastDecal) {
                ship.lastDecal.dispose();
                ship.lastDecal = null;
            }
        }
        const explosionArray = explosionManager.getExplosions();
        for (let i = 0; i < explosionArray.length; i++) {
            const exp = explosionArray[i];
            Vector3.LerpToRef(this.explosions[i].position, nextFrame.explosions[i].position, t, RecordFrame._tmpVec3);
            Quaternion.SlerpToRef(this.explosions[i].orientation, nextFrame.explosions[i].orientation, t, RecordFrame._tmpQuaternion);
            exp.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
            exp.setTime(this.explosions[i].time + (nextFrame.explosions[i].time - this.explosions[i].time) * t);
        }

        const sparksArray = sparksEffects.getSparksEffects();
        for (let i = 0; i < sparksArray.length; i++) {
            const spa = sparksArray[i];
            Vector3.LerpToRef(this.sparks[i].position, nextFrame.sparks[i].position, t, RecordFrame._tmpVec3);
            Quaternion.SlerpToRef(this.sparks[i].orientation, nextFrame.sparks[i].orientation, t, RecordFrame._tmpQuaternion);
            spa.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
            spa.setTime(this.sparks[i].time + (nextFrame.sparks[i].time - this.sparks[i].time) * t);
        }

        const missileArray = missileManager.getMissiles();
        for (let i = 0; i < missileArray.length; i++) {
            const mis = missileArray[i];
            Vector3.LerpToRef(this.missiles[i].position, nextFrame.missiles[i].position, t, RecordFrame._tmpVec3);
            Quaternion.SlerpToRef(this.missiles[i].orientation, nextFrame.missiles[i].orientation, t, RecordFrame._tmpQuaternion);
            mis.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
            mis.setTime(this.missiles[i].time + (nextFrame.missiles[i].time - this.missiles[i].time) * t);
        }

        const trailArray = trailManager.getTrails();
        if (this.trailData) {
            trailManager.getData().set(this.trailData);
        }
        trailManager.setCurrentIndex(this.trailCurrentIndex);
        for (let i = 0; i < trailArray.length; i++) {
            const trail = trailArray[i];
            trail.setParameters(this.trails[i].color, this.trails[i].alpha);
            trail.setVisible((this.trails[i].side & trailVisibilityMask) ? true : false);
            trail.update();
        }
        trailManager.update();

        const dest = shotManager.getMatrixData();
        const A = this.shots.matricesData;
        const B = nextFrame.shots.matricesData;
        for (let i = 0; i < 16 * MAX_SHOTS; i++) {
            dest[i] = A[i] + (B[i] - A[i]) * t;
        }

        shotManager.shots = this.shots.shots.slice(0);
        shotManager.matricesToInstances();
    }
    /*
    这是 Babylon.js 中的一段代码，下面逐行解释它：
    
    ```
    public restoreFrameBlend(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        nextFrame: RecordFrame,
        trailVisibilityMask: number,
        t: number): void {
    ```
    这是一个名为 `restoreFrameBlend` 的公共方法。它接受许多参数，包括船只管理器 `shipManager`、爆炸管理器 `explosionManager`、火花特效 `sparksEffects`、射击管理器 `shotManager`、导弹管理器 `missileManager`、拖尾管理器 `trailManager`、下一帧的记录帧 `nextFrame`、回放时的拖尾可见性掩码 `trailVisibilityMask` 以及混合帧进度 `t`。
    
    ```
    for (let i = 0; i < shipManager.ships.length; i++) {
        const ship = shipManager.ships[i];
        Vector3.LerpToRef(this.ships[i].position, nextFrame.ships[i].position, t, ship.root.position);
        if (ship.root.rotationQuaternion) {
            Quaternion.SlerpToRef(this.ships[i].orientation, nextFrame.ships[i].orientation, t, ship.root.rotationQuaternion);
        }
        ship.shipMesh?.setEnabled(this.ships[i].enabled);
        if (ship.lastDecal) {
            ship.lastDecal.dispose();
            ship.lastDecal = null;
        }
    }
    ```
    对每个船只进行线性插值，计算出当前混合状态下船只的位置和旋转。如果船只有旋转四元数，还需要进行球面插值。同时，根据混合帧状态修改船只的可见性，并清除上一次的贴花。
    
    ```
    const explosionArray = explosionManager.getExplosions();
    for (let i = 0; i < explosionArray.length; i++) {
        const exp = explosionArray[i];
        Vector3.LerpToRef(this.explosions[i].position, nextFrame.explosions[i].position, t, RecordFrame._tmpVec3);
        Quaternion.SlerpToRef(this.explosions[i].orientation, nextFrame.explosions[i].orientation, t, RecordFrame._tmpQuaternion);
        exp.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
        exp.setTime(this.explosions[i].time + (nextFrame.explosions[i].time - this.explosions[i].time) * t);
    }
    ```
    对每个爆炸进行线性插值，计算出当前混合状态下爆炸的位置和旋转，并更新爆炸时间。
    
    ```
    const sparksArray = sparksEffects.getSparksEffects();
    for (let i = 0; i < sparksArray.length; i++) {
        const spa = sparksArray[i];
        Vector3.LerpToRef(this.sparks[i].position, nextFrame.sparks[i].position, t, RecordFrame._tmpVec3);
        Quaternion.SlerpToRef(this.sparks[i].orientation, nextFrame.sparks[i].orientation, t, RecordFrame._tmpQuaternion);
        spa.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
        spa.setTime(this.sparks[i].time + (nextFrame.sparks[i].time - this.sparks[i].time) * t);
    }
    ```
    对每个火花特效进行线性插值，计算出当前混合状态下火花特效的位置和旋转，并更新火花特效时间。
    
    ```
    const missileArray = missileManager.getMissiles();
    for (let i = 0; i < missileArray.length; i++) {
        const mis = missileArray[i];
        Vector3.LerpToRef(this.missiles[i].position, nextFrame.missiles[i].position, t, RecordFrame._tmpVec3);
        Quaternion.SlerpToRef(this.missiles[i].orientation, nextFrame.missiles[i].orientation, t, RecordFrame._tmpQuaternion);
        mis.setPositionOrientation(RecordFrame._tmpVec3, RecordFrame._tmpQuaternion);
        mis.setTime(this.missiles[i].time + (nextFrame.missiles[i].time - this.missiles[i].time) * t);
    }
    ```
    对每个导弹进行线性插值，计算出当前混合状态下导弹的位置和旋转，并更新导弹时间。
    
    ```
    const trailArray = trailManager.getTrails();
    if (this.trailData) {
        trailManager.getData().set(this.trailData);
    }
    trailManager.setCurrentIndex(this.trailCurrentIndex);
    for (let i = 0; i < trailArray.length; i++) {
        const trail = trailArray[i];
        trail.setParameters(this.trails[i].color, this.trails[i].alpha);
        trail.setVisible((this.trails[i].side & trailVisibilityMask) ? true : false);
        trail.update();
    }
    trailManager.update();
    ```
    修改拖尾效果的颜色和透明度，并根据每个拖尾的可见性掩码修改其可见性。最后更新拖尾管理器。
    
    ```
    const dest = shotManager.getMatrixData();
    const A = this.shots.matricesData;
    const B = nextFrame.shots.matricesData;
    for (let i = 0; i < 16 * MAX_SHOTS; i++) {
        dest[i] = A[i] + (B[i] - A[i]) * t;
    }
    shotManager.shots = this.shots.shots.slice(0);
    shotManager.matricesToInstances();
    ```
    对每个射击进行线性插值，计算出当前混合状态下射击的位置和旋转，并更新射击管理器中的数据。
    
    以上即为该段代码的逐行解释。
    */

    /*
    这段代码是Babylon.js游戏引擎的一部分，用于创建一个新的RecordFrame对象并初始化其中的一些属性。下面是代码实现的具体步骤：
    1. 对于每个飞船对象，将其位置和旋转信息存储到新的PositionOrientationFrame对象中，并将该对象添加到ships数组中。
    2. 对于每个爆炸效果对象、火花效果对象和导弹对象，都创建一个新的TimedEffect对象，并将该对象添加到对应的explosions、sparks和missiles数组中。
    3. 对于每个拖尾效果对象，创建一个新的TrailData对象，并将该对象添加到trails数组中。
    4. 最后，调用storeFrame方法来存储当前帧的游戏状态。
    使用constructor方法可以创建一个新的RecordFrame对象，并对其中的一些属性进行初始化。在游戏运行过程中，可以使用RecordFrame对象来存储当前帧的游戏状态，并在需要时恢复到该状态。通过不断地创建与存储RecordFrame对象，游戏就可以支持撤销/恢复功能，提高游戏的可玩性和娱乐性。
    */
    constructor(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager) {
        for (let i = 0; i < shipManager.ships.length; i++) {
            this.ships.push(new PositionOrientationFrame());
        }
        for (let i = 0; i < explosionManager.getExplosions().length; i++) {
            this.explosions.push(new TimedEffect());
        }
        for (let i = 0; i < sparksEffects.getSparksEffects().length; i++) {
            this.sparks.push(new TimedEffect());
        }
        for (let i = 0; i < missileManager.getMissiles().length; i++) {
            this.missiles.push(new TimedEffect());
        }
        for (let i = 0; i < trailManager.getTrails().length; i++) {
            this.trails.push(new TrailData());
        }
        this.storeFrame(shipManager, explosionManager, sparksEffects, shotManager, missileManager, trailManager);
    }
}

export class Recorder {
    private _recordActive: boolean = false;
    private _shipManager: ShipManager;
    private _explosionManager: ExplosionManager;
    private _sparksEffects: SparksEffects;
    private _missileManager: MissileManager;
    private _trailManager: TrailManager;
    private _shotManager: ShotManager;
    private _availableFrames: number = 0;
    private _maxFrames: number;
    private _head: number = 0;
    private _recordFrames: Array<RecordFrame> = new Array<RecordFrame>();
    private _playbackFrame: number = 0;
    private _playbackSpeed: number = 0;
    private _playingBack: boolean = false;
    private _whenDone: () => void;
    public _trailVisibilityMask: number = 3;
    private _lastFrame: number = -1;

    constructor(shipManager: ShipManager,
        explosionManager: ExplosionManager,
        sparksEffects: SparksEffects,
        shotManager: ShotManager,
        missileManager: MissileManager,
        trailManager: TrailManager,
        maxFrames: number) {
        this._shipManager = shipManager;
        this._maxFrames = maxFrames;
        this._explosionManager = explosionManager;
        this._sparksEffects = sparksEffects;
        this._shotManager = shotManager;
        this._missileManager = missileManager;
        this._trailManager = trailManager;
        this._whenDone = () => { };
    }

    public setRecordActive(recordActive: boolean): void {
        this._recordActive = recordActive;
    }

    public getAvailableFrames(): number {
        return this._availableFrames;
    }
    /*
    这是一个Babylon.js游戏中，用于存储和恢复游戏状态的函数。通过该函数，可以实现记录游戏状态，然后在需要时进行回放，实现类似录像和回放的功能。
    首先判断是否处于“记录”模式，如果不是，则判断是否处于“回放”模式。如果正在回放，则逐帧播放录制的记录，并利用`_whenDone()`方法在回放结束后做一些收尾工作。如果没有在回放，则直接返回。
    如果处于“记录”模式，分别将飞船、爆炸、火花、子弹、导弹等游戏元素状态进行记录，创建一个新的`RecordFrame`对象，将当前帧的游戏状态保存到其中。若已经记录了足够多的帧，则覆盖最老的记录。
    由于该函数是在每一帧都被调用，所以可以不断地记录游戏状态，实现动态的游戏录制。回放时，通过逐帧播放记录的帧来还原游戏状态，实现游戏的回放功能。
    */
    public tick(): void {
        if (!this._recordActive) {
            if (this._playingBack) {
                this._playbackFrame += this._playbackSpeed;
                if (this._playbackFrame >= this._availableFrames) {
                    this._playingBack = false;
                    this._whenDone();
                } else {
                    const effective = this._getEffectiveIndex(Math.floor(this._playbackFrame));
                    if (this._playbackSpeed === 1) {
                        this._recordFrames[effective].restoreFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._trailVisibilityMask);
                    } else {
                        const effectiveN = this._getEffectiveIndex(Math.floor(this._playbackFrame) + 1);
                        const t = this._playbackFrame - Math.floor(this._playbackFrame);
                        this._recordFrames[effective].restoreFrameBlend(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._recordFrames[effectiveN], this._trailVisibilityMask, t);
                    }
                }
            }
            return;
        }

        if (this._recordFrames.length < this._maxFrames) {
            this._recordFrames.push(new RecordFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager));
        } else {
            const frameIndex = this._head % this._maxFrames;
            this._recordFrames[frameIndex].storeFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager);
        }
        this._increaseStore();
    }
    /*
    这段代码实现了一个名为 `tick` 的方法，它是一个游戏循环中的核心逻辑，用于更新游戏状态。下面来逐行解释它：
    
    ```
    if (!this._recordActive) {
    ```
    如果当前游戏不处于录制状态，则继续执行以下代码块。
    
    ```
    if (this._playingBack) {
        this._playbackFrame += this._playbackSpeed;
        if (this._playbackFrame >= this._availableFrames) {
            this._playingBack = false;
            this._whenDone();
        } else {
            const effective = this._getEffectiveIndex(Math.floor(this._playbackFrame));
            if (this._playbackSpeed === 1) {
                this._recordFrames[effective].restoreFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._trailVisibilityMask);
            } else {
                const effectiveN = this._getEffectiveIndex(Math.floor(this._playbackFrame) + 1);
                const t = this._playbackFrame - Math.floor(this._playbackFrame);
                this._recordFrames[effective].restoreFrameBlend(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._recordFrames[effectiveN], this._trailVisibilityMask, t);
            }
        }
    }
    ```
    如果游戏处于回放状态(`_playingBack` 为真)，则更新当前帧编号 `_playbackFrame` 并判断它是否超过可用帧数 `_availableFrames`。如果当前帧已经达到可用帧数，则将 `_playingBack` 设为假，并执行回调函数 `_whenDone`。否则，使用当前帧编号调用 `_getEffectiveIndex` 方法获取有效帧编号 `effective`。如果当前帧速度为 1，就调用 `restoreFrame` 方法还原有效帧。否则，先获取下一个有效帧编号 `effectiveN`，计算出当前帧的进度 `t` 并调用 `restoreFrameBlend` 方法混合有效帧和下一个有效帧。
    
    ```
    return;
    ```
    结束此次方法执行。
    
    ```
    if (this._recordFrames.length < this._maxFrames) {
        this._recordFrames.push(new RecordFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager));
    } else {
        const frameIndex = this._head % this._maxFrames;
        this._recordFrames[frameIndex].storeFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager);
    }
    ```
    如果游戏正处于录制状态，且记录帧数没有达到最大值 `_maxFrames`，则往 `_recordFrames` 数组中添加一条新的记录帧。否则，计算出存储头部位置 `frameIndex`，并调用该位置上记录帧的 `storeFrame` 方法，记录当前帧的游戏状态。
    
    ```
    this._increaseStore();
    ```
    使存储头部位置向前推移一位。
    
    以上即为该段代码的逐行解释。
    */

    /*
    这是一个在Babylon.js游戏中，用于应用指定帧的游戏状态的方法。通过该方法，可以将记录的某一帧游戏状态应用到当前游戏中，实现单独帧的回放和调试。
    
    首先判断是否正在进行“记录”模式，如果是，则直接返回，因为此时无法应用某一帧游戏状态。
    
    如果不处于“记录”模式，则获取目标帧的有效索引位置（由于使用了循环缓冲区技术，可能存在有效索引和实际索引不同的情况），并从`_recordFrames`数组中提取相应的游戏帧数据，并将其恢复到游戏中的对应元素上，包括飞船、爆炸、火花、子弹、导弹等游戏元素状态。最后将该帧的索引记录到`_lastFrame`属性中，以备下次应用。
    
    通过这个方法，可以针对单独的游戏帧进行调试和测试，并通过观察游戏元素的状态来验证游戏逻辑的正确性。
    */
    public applyFrame(frameIndex: number): void {
        if (this._recordActive) {
            // issue here
            return;
        }
        this._lastFrame = frameIndex;
        const effective = this._getEffectiveIndex(frameIndex);
        this._recordFrames[effective].restoreFrame(this._shipManager, this._explosionManager, this._sparksEffects, this._shotManager, this._missileManager, this._trailManager, this._trailVisibilityMask);
    }

    public refreshFrame(): void {
        if (this._lastFrame >= 0) {
            this.applyFrame(this._lastFrame);
        }
    }

    public playback(speed: number, whenDone: () => void): void {
        this._playbackFrame = 0;
        this._playbackSpeed = speed;
        this._playingBack = true;
        this._whenDone = whenDone;
    }

    public stop(): void {
        this._playingBack = false;
    }

    public dispose(): void {
    }

    /*
    这是一个用于获取指定帧有效索引值的方法，主要用于在循环缓冲区中正确访问某一帧的数据。下面解释各个变量的含义和具体作用：
    1. `frameIndex`：目标帧的索引值。    
    2. `_head`：记录当前存储的游戏帧数量。    
    3. `_maxFrames`：最大存储游戏帧数量。
    4. `_tail`：游戏帧循环缓冲区的队列尾部索引值。
    5. `_availableFrames`：可使用的游戏帧数量，既是存储的游戏帧数量与最大数量之间的较小值。
    根据以上参数，`_getEffectiveIndex`方法可以分为以下步骤：
    1. 首先，计算出游戏帧循环缓冲区的队列尾部索引值，即使用`Math.max(this._head - this._maxFrames, 0)`截取丢弃的过期帧数量，再使用取模运算符`%`限制该索引值不超过最大帧数。
    2. 其次，将队列尾部索引值和目标帧的索引值相加，并使用取模运算符`%`计算出该值在循环缓冲区中对应的有效索引值。
    3. 最后，返回所计算出的有效索引值。
    通过`_getEffectiveIndex`方法计算出的有效索引值，可以确保在循环缓冲区中正确访问到指定的游戏帧数据，从而实现针对单独帧的回放和调试。
    */
    private _getEffectiveIndex(frameIndex: number): number {
        const tail = Math.max(this._head - this._maxFrames, 0) % this._maxFrames;
        const effective = (tail + frameIndex) % this._availableFrames;
        return effective;
    }

    /*
    这是一个用于增加存储空间的方法，主要用于将记录游戏帧的存储空间大小加1。下面解释各个变量的含义和具体作用：
    1. `_head`：记录当前存储的游戏帧数量。
    2. `_maxFrames`：最大存储游戏帧数量。
    3. `_availableFrames`：可使用的游戏帧数量，既是存储的游戏帧数量与最大数量之间的较小值。
    根据以上参数，`_increaseStore`方法可以分为以下步骤：
    1. 首先，将记录当前存储的游戏帧数量`_head`加一表示增加一帧。
    2. 其次，使用`Math.min(this._head, this._maxFrames)`计算出可用的游戏帧数量，既是存储的游戏帧数量与最大数量之间的较小值。这样保证了存储的游戏帧数量不超过最大值。
    3. 最后，将可用的游戏帧数量复制给`_availableFrames`，以更新存储空间大小。
    通过`_increaseStore`方法增加存储空间，可以为记录、回放等操作提供更多的存储空间，从而实现更加丰富的游戏玩法和体验。
    */
    private _increaseStore(): void {
        this._head++;
        this._availableFrames = Math.min(this._head, this._maxFrames);
    }
}
