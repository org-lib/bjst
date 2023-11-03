import { Texture, Engine, Vector3, Mesh, Scene, NodeMaterial, NodeMaterialBlock, Nullable, TextureBlock, RawTexture, Color3, BoundingInfo, MeshBuilder, Color4, InputBlock, ColorMergerBlock } from "@babylonjs/core";
import { MAX_MISSILES } from "../Missile";

export const MAX_TRAILS: number = 60;
export const TRAIL_LENGTH = 256;
/*
这是用 TypeScript 语言编写的 Babylon.js 的一个 Trail 类。
Trail（拖尾）是一种特效，常见于游戏中物体运动的轨迹或者飞行轨迹上。在该类中，Trail 实例通过保存一些最新的位置，使得能够使用位置信息构建拖尾。
它们用一个四元组存储在 Float32Array 中，每个四元组包含 x、y 和 z 坐标以及一个为0的占位符，占位符在后面的代码中没有用到。
该类公开了 spawn()、append()、setParameters() 和 setVisible() 等方法，用于更新拖尾的颜色、位置、可见性等。tick() 方法被用于处理拖尾的更新和渲染。
该类基于 Babylon.js 中的 MeshBuilder 创建了一个 Ground 平面，作为拖尾的渲染对象，同时使用 NodeMaterial 来控制拖尾的材质属性，如颜色、透明度等。
*/
export class Trail {
    private _data;
    private _mesh: Mesh;
    private _trackSampler0Block: Nullable<TextureBlock>;
    private _trackSampler1Block: Nullable<TextureBlock>;
    private _globalAlphaBlock: Nullable<InputBlock>;
    private _colorBlock: Nullable<InputBlock>;
    private _trailU: Nullable<InputBlock>;
    private _trailMaterial: NodeMaterial;
    private _color = new Color3(0, 0, 0);
    private _alpha: number;
    private _valid: boolean;
    private _visible: boolean = false;
    private _currentIndex: number;
    private _trailIndex: number;
    private _side: number = 0;
    private static _tempVec3 = new Vector3();
    /*
    这是 Trail 类的构造函数。该函数接受多个参数：场景对象(scene)、拖尾材质对象(trailMaterial)、拖尾索引(trailIndex)、最大拖尾数量(maxTrails)、位置信息保存数组(data)、拖尾使用的纹理(texture)。
    在该函数内部，先通过 MeshBuilder 创建了一个名为 “trail” 的平面对象，并设置其宽度、高度和细分度(subdivisionsY)。
    然后通过 setBoundingInfo 设置了平面对象的边界信息，即平面的最大坐标和最小坐标。
    接着调用了 NodeMaterial 对象中的一些方法，如 clone() 克隆自身、 getBlockByPredicate() 通过谓词获取特定输入块或输出块等，用于对拖尾的渲染属性进行初始化。
    同时将上面创建的平面对象(mesh)关联到拖尾材质(trailMaterial)中。在后面的代码中，对 _trackSampler0Block 和 _trackSampler1Block 进行了纹理设置，并对其他属性进行了初始化。
    因此，在创建了 Trail 对象后，可以通过该实例的相关方法对拖尾的颜色、位置、可见性等进行修改。
    */
    constructor(scene: Scene, trailMaterial: NodeMaterial, trailIndex: number, maxTrails: number, data: Float32Array, texture: RawTexture) {
        this._data = data;
        this._mesh = MeshBuilder.CreateGround("trail", { width: 0.1, height: 0.010, subdivisionsY: 64 }, scene);
        this._mesh.setBoundingInfo(new BoundingInfo(new Vector3(-1000, -1000, -1000), new Vector3(1000, 1000, 1000)));
        this._trailMaterial = trailMaterial.clone("trailMaterial", true);
        this._trailMaterial.backFaceCulling = false;
        this._mesh.material = this._trailMaterial;
        /*
        根据传入的谓词函数返回第一个符合条件的节点材质块（ NodeMaterialBlock ）。
        在代码中，这个方法的作用是找到名称为"tailSampler0"的 TextureBlock 节点，这个节点用于指定材质中的纹理采样器。通过使用 getBlockByPredicate 方法，可以方便地获取到所需的节点材质块，从而方便地对其进行操作
        */
        this._trackSampler0Block = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "tailSampler0") as TextureBlock;
        this._trackSampler1Block = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "tailSampler1") as TextureBlock;
        this._globalAlphaBlock = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "GlobalAlpha") as InputBlock;
        this._colorBlock = this._trailMaterial.getInputBlockByPredicate((b: NodeMaterialBlock) => b.name === "color");
        let trailV = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "TrailV") as InputBlock;
        this._trailU = this._trailMaterial.getBlockByPredicate((b: NodeMaterialBlock) => b.name === "TrailU") as InputBlock;
        trailV.value = (trailIndex + 0.5) / maxTrails;//使得相邻的Trail之间没有间隙
        this._trailIndex = trailIndex;
        if (this._trackSampler0Block && this._trackSampler1Block) {
            this._trackSampler0Block.texture = texture;
            this._trackSampler1Block.texture = texture;
        }
        this._valid = false;
        this._alpha = 0;
        this._currentIndex = 0;
    }

    public getColor(): Color3 {
        return this._color;
    }

    public getSide(): number {
        return this._side;
    }

    public getAlpha(): number {
        return this._alpha;
    }

    /*
    这是 Trail 类的一个方法，用于添加新的拖尾的位置信息。该方法包含两个参数：拖尾的位置(position)和拖尾的方向(side)。在该方法中，首先计算出当前拖尾的偏移量(offset)，并根据偏移量计算出本地索引(localIndex)。
    然后在循环过程中，对每个时间步长(i)进行计算。
    通过修改数据数组(_data)中的各元素值，在 _data 数组中为拖尾的每个时间步骤添加位置信息。
    这些位置信息保存在 _data 数组连续的四个浮点型数据块中，分别代表 x、y、z 坐标和 alpha 通道（用于拖尾的淡出效果）。
    最后，调用 update() 方法将拖尾的位置信息更新到 NodeMaterial 中进行渲染。同时，设置 _valid 为 true，表示该拖尾可见，并将 _alpha 设置为 1，表示其完全可见。
    最后，将拖尾的方向赋值给 _side 。
    因此，可以使用该方法来动态地添加拖尾的位置信息，从而实现拖尾跟随物体运动的效果。
    */
    public spawn(position: Vector3, side: number): void {
        const offset = TRAIL_LENGTH * 4 * this._trailIndex;
        for (let i = 0; i < TRAIL_LENGTH; i++) {
            const localIndex = offset + i * 4;
            this._data[localIndex + 0] = position.x;
            this._data[localIndex + 1] = position.y;
            this._data[localIndex + 2] = position.z + (i - TRAIL_LENGTH) * 0.00001;
            this._data[localIndex + 3] = 0;
        }
        this.update();
        this._valid = true;
        this._alpha = 1;
        this._side = side;
    }

    /*
    这是 Trail 类的一个私有方法，用于在拖尾列表中追加新的位置信息。该方法接受一个参数：一个 Vector3 类型的坐标(position)，表示需要添加的位置信息。
    在该方法中，首先计算出当前拖尾的偏移量(offset)，并根据 offset 和当前索引(this._currentIndex) 计算出本地索引(localIndex)。
    然后在 _data 数组中对应位置上存储当前位置信息，分别存储在 localIndex、localIndex+1、localIndex+2 三个连续的浮点类型数据块中。
    最终将 currentIndex 自增一，方便下一次添加位置信息时使用。因此，可以使用该方法在拖尾序列中添加新的位置信息，实现拖尾的效果。
    */
    private _appendPosition(position: Vector3): void {
        const offset = TRAIL_LENGTH * 4 * this._trailIndex;
        const localIndex = offset + this._currentIndex * 4;
        this._data[localIndex + 0] = position.x;
        this._data[localIndex + 1] = position.y;
        this._data[localIndex + 2] = position.z;
    }

    /*
    这是 Trail 类的一个私有方法，用于获取当前拖尾序列中指定位置的坐标信息。该方法包含一个参数：一个 Vector3 类型的坐标(position)，表示需要获取的位置信息。
    在该方法中，首先计算出当前拖尾的偏移量(offset)，并根据 offset 和当前索引(this._currentIndex) 计算出本地索引(localIndex)。
    然后通过 position 对象的 set() 方法，将数据数组(_data)中对应位置(localIndex, localIndex + 1, localIndex + 2)的数值设置给 position，从而得到该位置的坐标信息。
    因此，可以使用该方法来获取拖尾序列中指定位置的坐标信息，便于进行一些其他操作，比如进行碰撞检测、计算拖尾的长度等。
    */
    private _getPositionToRef(position: Vector3): void {
        const offset = TRAIL_LENGTH * 4 * this._trailIndex;
        const localIndex = offset + this._currentIndex * 4;
        position.set(this._data[localIndex + 0], this._data[localIndex + 1], this._data[localIndex + 2]);
    }

    /*
    这是 Trail 类的一个公共方法，用于在拖尾序列中追加新的位置信息，并更新拖尾的渲染效果。
    该方法包含一个参数：一个 Vector3 类型的坐标(position)，表示需要添加的位置信息。
    在该方法中，首先调用 _appendPosition() 方法，在拖尾序列中追加新的位置信息。
    然后通过调用 update() 方法，将拖尾的位置信息更新到 NodeMaterial 中进行渲染，保证拖尾效果的实时性。
    因此，可以使用该方法来动态地添加拖尾序列中的位置信息，并保证拖尾的实时渲染效果。
    */
    public append(position: Vector3): void {
        this._appendPosition(position);
        this.update();
    }

    public setCurrentIndex(currentIndex: number): void {
        this._currentIndex = currentIndex;
    }

    /*
    这是 Trail 类的一个公共方法，用于更新拖尾的渲染效果。在该方法中，先判断 _globalAlphaBlock 和 _trailU 两个变量是否存在。
    如果 _globalAlphaBlock 存在，则将其 value 属性设置为当前 Trail 实例的 _alpha 属性，用于控制拖尾的透明度。
    如果 _trailU 存在，则将其 value 属性设置为 ((((this._currentIndex + 1) % TRAIL_LENGTH) + 2.5) / TRAIL_LENGTH)，用于控制拖尾 UV 坐标的偏移和缩放。
    其中，(this._currentIndex + 1) % TRAIL_LENGTH) 是为了计算出下一次需要被更新的位置索引，% TRAIL_LENGTH 操作保证了索引值不会超过 TRAIL_LENGTH 的数值。
    然后再通过加上 2.5 并除以 TRAIL_LENGTH 计算出偏移和缩放的值，最终将其赋值给 _trailU 的 value 属性即可。
    因此，可以使用该方法来保证 Trail 实例在每一帧都能根据当前状态及时更新对应的渲染效果，从而呈现出拖尾的实时动态效果。
    */
    public update(): void {
        if (this._globalAlphaBlock) {
            this._globalAlphaBlock.value = this._alpha;
        }
        if (this._trailU) {
            this._trailU.value = (((this._currentIndex + 1) % TRAIL_LENGTH) + 2.5) / TRAIL_LENGTH;
        }
    }

    public setParameters(color: Color3, alpha: number): void {
        this._colorBlock!.value = color;
        this._color = color;
        this._alpha = alpha;
    }

    public setVisible(visible: boolean): void {
        this._visible = visible;
        this.tickEnabled();
    }

    public invalidate(): void {
        this._valid = false;
    }

    public isValid(): boolean {
        return this._valid || this._alpha > 0.001;
    }

    public tickEnabled(): void {
        this._mesh.setEnabled(this.isValid() && this._visible);
    }

    /*
    这是 Trail 类的一个公共方法，用于进行时序更新，并将更新后的位置信息添加到拖尾序列中。该方法包含两个参数：deltaTime 表示两次更新之间的时间间隔，currentIndex 表示当前需要更新的位置索引。
    在该方法中，首先调用 _getPositionToRef() 方法获取当前 Trail 实例的位置信息，并将其保存至 Trail 类的静态变量 Trail._tempVec3 中。
    然后将 currentIndex 赋值给 Trail 实例的 _currentIndex 属性，用于控制拖尾序列的长度。
    接着调用 _appendPosition() 方法，将 _tempVec3 存储的位置信息追加到拖尾序列中。
    如果 Trail 实例的 _valid 属性为 false，则说明该实例已经失效，需要逐渐消失。
    此时，通过对 _alpha 属性进行逐渐减小的处理，控制拖尾的透明度，并通过调用 update() 方法，将渲染效果更新到 NodeMaterial 中。
    最后调用 tickEnabled() 方法，用于启用下一轮时序更新。因此，可以使用该方法来实现 Trail 类的实时更新和拖尾效果的动态展示。
    */
    public tick(deltaTime: number, currentIndex: number): void {
        this._getPositionToRef(Trail._tempVec3);
        this._currentIndex = currentIndex;
        this._appendPosition(Trail._tempVec3);
        if (!this._valid) {
            this._alpha = Math.max(this._alpha - deltaTime * 0.0003, 0);
            this._globalAlphaBlock!.value = this._alpha;
            this.update();
        }
        this.tickEnabled();
    }

    public dispose(): void {
        this._mesh.dispose();
    }
}

export class TrailManager {

    private _trails: Array<Trail> = new Array<Trail>();
    private _currentIndex: number = TRAIL_LENGTH - 1;
    private _data;
    private _texture: RawTexture;

    /*
    这是 TrailMesh 类的构造函数，用于创建一组拖尾效果。该构造函数包含三个参数：scene 表示当前场景实例、trailMaterial 表示用于渲染拖尾效果的材质实例、maxTrails 表示需要创建的拖尾数量。
    在该方法中，首先根据 maxTrails 和 TRAIL_LENGTH 计算出需要预分配的 Float32Array 数组长度，并使用 new 操作符创建一个新的 Float32Array 实例 this._data，用于存储所有拖尾的位置和透明度信息。
    同时，通过调用 RawTexture.CreateRGBATexture() 方法，创建一个新的 RGBA 纹理实例 this._texture，并将其初始化为指定大小，并连带关联至创建出来的 Float32Array 实例中，用于后续进行动态的位置和透明度渲染。
    最后，通过循环 maxTrails 次，依次创建 Trail 类实例，并将其保存到数组 this._trails 中，用于管理每个拖尾的状态更新和渲染效果。
    因此，可以使用该构造函数来初始化 TrailMesh 类，并创建指定数量的拖尾对象，方便后续进行动态的拖尾效果展示。
    */
    /*
    Babylon.js 的裸纹理（RawTexture）适用于以下场景：

    动态生成纹理：如果你需要在运行时动态生成纹理，而不是使用静态的图像文件作为纹素信息，那么裸纹理是一个不错的选择。例如，通过程序生成特定效果的纹理或实时渲染的图形效果。

    自定义渲染：当你需要完全控制渲染过程时，可以使用裸纹理。它允许你以自己的方式处理纹理数据，实现非标准的渲染效果。

    特殊效果：对于一些特殊效果，如拖尾效果、粒子效果等，裸纹理提供了更灵活的选项。你可以根据需求动态更新纹理数据，实现各种独特的视觉效果。

    然而，在以下场景中可能不适合使用裸纹理：

    静态纹理：如果你只需要使用已有的图片文件作为纹理，并且不需要在运行时进行修改或动态生成，那么使用普通的纹理类型即可满足需求，无需使用裸纹理。

    标准渲染：对于常规的图形渲染，使用内置的纹理类型和材质效果即可，这样更加简单和高效。

    请根据你的需求和特定场景，综合考虑是否需要使用裸纹理，选择适合的纹理类型。
    */

    /*
    在 Babylon.js 中，纹理（Texture）对象有一些属性可以用来控制纹理的包裹模式（wrapping mode）。包裹模式指定了当纹理坐标超出了 0 到 1 的范围时，如何处理纹理的重复和拉伸。
    其中 wrapU 是用于控制水平方向上的包裹模式，而 wrapV 则是用于控制垂直方向上的包裹模式。下面是可能的包裹模式选项：
    Texture.WRAP_ADDRESSMODE：该模式下，纹理坐标在水平或垂直方向上会被循环重复。
    Texture.CLAMP_ADDRESSMODE：该模式下，纹理坐标会被夹在 0 和 1 之间，超出范围的部分会被截断为最近的边缘颜色。
    Texture.MIRROR_ADDRESSMODE：该模式下，纹理坐标在超出 0 到 1 范围时会被翻转，形成镜像效果。
    在给定的代码中，通过将 this._texture.wrapU 和 this._texture.wrapV 设置为 Texture.WRAP_ADDRESSMODE，使用的是默认的包裹模式，即当纹理坐标超出 0 到 1 的范围时，在水平和垂直方向上都进行循环重复，使纹理无限重复地覆盖在几何体上。
    这样可以确保纹理在使用过程中没有明显的边缘或分割线，使得渲染效果更加平滑和连续。然而，具体使用哪种包裹模式取决于你的需求和预期效果，在不同场景中可能会选择不同的包裹模式来获得期望的渲染结果。
    */
    constructor(scene: Scene, trailMaterial: NodeMaterial, maxTrails: number) {
        this._data = new Float32Array(maxTrails * TRAIL_LENGTH * 4);
        this._texture = RawTexture.CreateRGBATexture(this._data, TRAIL_LENGTH, maxTrails, scene, false, false, Texture.NEAREST_NEAREST, Engine.TEXTURETYPE_FLOAT);//用于创建一个裸纹理（Raw Texture）的方法
        this._texture.wrapU = Texture.WRAP_ADDRESSMODE;
        this._texture.wrapV = Texture.WRAP_ADDRESSMODE;

        for (let i = 0; i < maxTrails; i++) {
            this._trails.push(new Trail(scene, trailMaterial, i, maxTrails, this._data, this._texture));
        }
    }
    /*
    这段代码是一个 TrailSystem 类的构造函数，用于创建一组拖尾。现在来逐行解释一下该构造函数的代码：
    1. `constructor(scene: Scene, trailMaterial: NodeMaterial, maxTrails: number) { ... }`：TrailSystem 类的构造函数。传入场景对象 scene、用于创建材质的节点材质 trailMaterial 和最大拖尾数目 maxTrails。
    2. `this._data = new Float32Array(maxTrails * TRAIL_LENGTH * 4);`：创建一个指定长度的浮点数数组，并将其赋值给 `_data`。其中，TRAIL_LENGTH 是预定义的常量，表示每个拖尾的顶点数目，这里将其乘以 4 是因为我们需要存储每个顶点的 xyzw 四个分量。
    3. `this._texture = RawTexture.CreateRGBATexture(this._data, TRAIL_LENGTH, maxTrails, scene, false, false, Texture.NEAREST_NEAREST, Engine.TEXTURETYPE_FLOAT);`：使用 `_data` 数据创建一个 RGBA 纹理，并将其赋值给 `_texture`。
    4. `this._texture.wrapU = Texture.WRAP_ADDRESSMODE;`：将 `_texture` 的水平方向的寻址模式设置为 WRAP。
    5. `this._texture.wrapV = Texture.WRAP_ADDRESSMODE;`：将 `_texture` 的垂直方向的寻址模式设置为 WRAP。
    6. `for (let i = 0; i < maxTrails; i++) { ... }`：循环 maxTrails 次，每次创建一个 Trail 类的实例，并将其添加到 `_trails` 数组中。
    7. `this._trails.push(new Trail(scene, trailMaterial, i, maxTrails, this._data, this._texture));`：创建一个 Trail 类的实例，并将其添加到 `_trails` 数组中。传入场景对象 scene、用于创建材质的节点材质 trailMaterial、当前拖尾的索引 i、最大拖尾数目 maxTrails、用于保存顶点数据的浮点数数组 data（即上面创建的 `_data`）以及用于渲染的纹理 texture（即上面创建的 `_texture`）。
    */

    /*
    这是 TrailMesh 类的一个公共方法，用于进行时序更新，对所有拖尾实例进行更新，并更新当前拖尾序列的位置索引和渲染效果。
    在该方法中，首先使用 forEach() 方法遍历 this._trails 数组中的每个 Trail 实例，并依次调用它们的 tick() 方法，传入 deltaTime 和当前拖尾序列的位置索引 _currentIndex。
    这个 _currentIndex 是用于控制 Trail 实例中拖尾序列长度的属性。之后，将 _currentIndex 的值加 1，并通过取模运算符 % 控制其值在 [0, TRAIL_LENGTH) 的范围内循环，用于实现循环更新拖尾序列的功能。
    最后，调用 update() 方法，将 TrailMesh 实例的渲染效果更新到 NodeMaterial 中。因此，可以使用该方法来实现 TrailMesh 对象的动态更新和拖尾效果的实时展示。
    */
    public tick(deltaTime: number): void {
        this._trails.forEach((trail) => {
            trail.tick(deltaTime, this._currentIndex);
        });
        this._currentIndex++;
        this._currentIndex %= TRAIL_LENGTH;
        this.update();
    }

    /*
    这是 TrailMesh 类的一个公共方法，用于产生一个新的拖尾效果实例。该方法有两个参数：position 表示拖尾的起始位置， side 表示拖尾的方向（-1 表示左侧，1 表示右侧）。
    在该方法中，首先使用 for 循环遍历所有的 Trail 实例，判断当前的 Trail 实例是否处于可用状态，如果某个 Trail 实例可用，调用它的 spawn() 方法，并将其状态设置为已占用，同时返回该 Trail 实例。
    如果所有 Trail 实例都处于不可用状态，则返回 null。因此，可以使用该方法来创建新的拖尾实例，并添加到 TrailMesh 中进行动态渲染和展示。
    */
    public spawnTrail(position: Vector3, side: number): Nullable<Trail> {
        for (let i = 0; i < this._trails.length; i++) {
            if (!this._trails[i].isValid()) {
                this._trails[i].spawn(position, side);
                return this._trails[i];
            }
        }
        return null;
    }

    public getCurrentIndex(): number {
        return this._currentIndex;
    }

    public setCurrentIndex(currentIndex: number): void {
        this._currentIndex = currentIndex;
        this._trails.forEach((trail) => {
            trail.setCurrentIndex(currentIndex);
        });
    }

    public getData(): Float32Array {
        return this._data;
    }

    public update(): void {
        this._texture.update(this._data);
    }

    public getTrails(): Array<Trail> {
        return this._trails;
    }

    public dispose(): void {
        this._trails.forEach((trail) => {
            trail.dispose();
        });
        this._texture.dispose();
    }
}