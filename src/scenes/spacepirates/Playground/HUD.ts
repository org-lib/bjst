import { AdvancedDynamicTexture, Control, StackPanel, TextBlock, Slider, Image, InputText, Checkbox, Button, Rectangle, Grid } from "@babylonjs/gui";
import { Vector3, Vector4, Engine, Camera, Nullable, Scene, Color3, ThinEngine, InputBlock } from "@babylonjs/core";
import { ShipManager, Ship } from './Ship';
import { Parameters } from './Parameters';
import { InputManager } from './Inputs/Input';
import { TouchInput } from "./Inputs/TouchInput";
import { Settings } from "../Settings";
import { GamepadInput } from "./Inputs/GamepadInput";
import { Assets } from "./Assets";
import { GuiFramework } from "./GuiFramework";

class HUDPanel {
    // private _bars: StackPanel;
    private _health: Slider;
    private _missile: Slider
    private _speed: Slider
    private _statsPanel: Rectangle
    private _statsPanelImage: Image;
    private _statsGrid: Grid;
    private _healthIcon: Image;
    private _speedIcon: Image;
    private _reloadIcon: Image;
    private _targets = new Array<Image>();
    private _targetLock: Image;
    private _divisor: number;
    private _index: number;
    //private _fpsCounter: TextBlock;

    /*
    这段代码是使用Babylon.js库创建一个游戏的 UI 界面，界面上包括了一些图像和滑动条。在 constructor 函数中，这个界面的元素被初始化，并通过 AdvancedDynamicTexture（高级动态纹理）添加到屏幕上。

    具体地说:

    assets 参数是一个类，其中包含了各种图像、模型等游戏资源的 URL；
    adt 参数是一个 AdvancedDynamicTexture 实例，用于将各种 UI 元素添加到屏幕上；
    divisor 和 index 参数都是整数，用于确定 UI 界面的位置和大小；
    _fpsCounter 代表一个文本块，但在当前代码中被注释掉了；
    _targets 是一个数组，其中包含多个 Image 实例，用于显示游戏中的目标；
    _targetLock 是一个 Image 实例，用于显示导弹锁定的图像；
    _statsPanel 是一个 Rectangle 实例，表示整个 UI 界面的背景；
    _statsPanelImage 是一个 Image 实例，作为 _statsPanel 的子元素，用于显示一个图片作为背景；
    _statsGrid 是一个 Grid 实例，用于将 _healthIcon、_speedIcon 和 _reloadIcon 三个图标和对应的滑动条组合成一行；
    _health、_speed 和 _missile 都是 Slider 实例，表示分别对应生命值、速度和导弹冷却时间的滑动条。
    整段代码中大量使用了 Babylon.js 库的类和方法，用于方便地创建各种 UI 元素，并对其进行布局和样式的设置。
    */
    constructor(assets: Assets, adt: AdvancedDynamicTexture, divisor: number, index: number) {
        this._divisor = divisor;
        this._index = index;

        /*this._fpsCounter = new TextBlock();
        this._fpsCounter.text= "00000000";
        this._fpsCounter.width = 0.2;
        this._fpsCounter.height = "40px";
        this._fpsCounter.color = "white";
        this._fpsCounter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._fpsCounter.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._fpsCounter.top = "0px";
        this._fpsCounter.left = "0px";
        adt.addControl(this._fpsCounter);
*/
        for (let i = 0; i < 20; i++) {
            var image = new Image("img", assets.assetsHostUrl + "/src/assets/UI/trackerIcon.svg");
            image.height = "32px";
            image.width = "32px";
            image.isVisible = false;
            adt.addControl(image);
            this._targets.push(image);
            image.alpha = 0.4;
        }

        this._targetLock = new Image("img", assets.assetsHostUrl + "/src/assets/UI/missileLockIcon.svg");
        this._targetLock.height = "128px";
        this._targetLock.width = "128px";
        this._targetLock.sourceWidth = 256;
        this._targetLock.sourceLeft = 0;
        this._targetLock.isVisible = false;
        adt.addControl(this._targetLock);

        // this._bars = new StackPanel("bars");
        // this._bars.paddingBottomInPixels = 20;
        // if (index) {
        //     this._bars.leftInPixels = 20;
        //     this._bars.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_RIGHT;
        // } else {
        //     this._bars.leftInPixels = 20;
        //     this._bars.horizontalAlignment = InputManager.isTouch ? StackPanel.HORIZONTAL_ALIGNMENT_CENTER : StackPanel.HORIZONTAL_ALIGNMENT_LEFT;
        // }
        // this._bars.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_BOTTOM;
        // this._bars.width = 0.2;
        // adt.addControl(this._bars);

        this._statsPanel = new Rectangle("statsPanel");
        this._statsPanel.heightInPixels = 185;
        this._statsPanel.thickness = 0;
        if (index) {
            if (InputManager.isTouch) {
                this._statsPanel.width = 1.0;
                this._statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                this._statsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            } else {
                this._statsPanel.widthInPixels = 425;
                this._statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                this._statsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                this._statsPanel.left = "-90px";
                this._statsPanel.top = "-90px";
            }
        } else {
            if (InputManager.isTouch) {
                this._statsPanel.width = 1.0;
                this._statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                this._statsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            } else {
                this._statsPanel.widthInPixels = 425;
                this._statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                this._statsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                this._statsPanel.left = "90px";
                this._statsPanel.top = "-90px";
            }
        }
        adt.addControl(this._statsPanel)

        this._statsPanelImage = new Image("statsPanelImage", "/src/assets/UI/statsPanel.svg");
        this._statsPanelImage.widthInPixels = 300;
        this._statsPanelImage.heightInPixels = 185;
        this._statsPanelImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        if (InputManager.isTouch === false) {
            this._statsPanel.addControl(this._statsPanelImage);
        }

        this._statsGrid = new Grid();
        this._statsGrid.addColumnDefinition(45, true);
        this._statsGrid.addColumnDefinition(1.0, false);
        if (InputManager.isTouch) {
            this._statsGrid.addRowDefinition(15, true);
            this._statsGrid.addRowDefinition(15, true);
            this._statsGrid.addRowDefinition(15, true);
        } else {
            this._statsGrid.addRowDefinition(40, true);
            this._statsGrid.addRowDefinition(40, true);
            this._statsGrid.addRowDefinition(40, true);
            this._statsGrid.top = "38px";
        }
        this._statsGrid.widthInPixels = 200;
        this._statsGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._statsGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._statsPanel.addControl(this._statsGrid);

        let size = (InputManager.isTouch) ? 10 : 35;
        this._healthIcon = new Image("health", "/src/assets/UI/healthIcon.svg");
        this._healthIcon.widthInPixels = size;
        this._healthIcon.heightInPixels = size;
        this._statsGrid.addControl(this._healthIcon, 0, 0);

        this._speedIcon = new Image("health", "/src/assets/UI/speedIcon.svg");
        this._speedIcon.widthInPixels = size;
        this._speedIcon.heightInPixels = size;
        this._statsGrid.addControl(this._speedIcon, 1, 0);

        this._reloadIcon = new Image("health", "/src/assets/UI/reloadIcon.svg");
        this._reloadIcon.widthInPixels = size;
        this._reloadIcon.heightInPixels = size;
        this._statsGrid.addControl(this._reloadIcon, 2, 0);

        this._health = new Slider("health");
        this._health.color = "#af2d0e";
        this._health.background = "#878787";
        this._health.height = 1.0;
        this._health.displayThumb = false;
        this._health.minimum = 0;
        this._health.maximum = 100;
        this._statsGrid.addControl(this._health, 0, 1);

        this._speed = new Slider("Speed");
        this._speed.color = "#e8b410";
        this._speed.background = "#878787";
        this._speed.height = 1.0;
        this._speed.displayThumb = false;
        this._speed.minimum = 0;
        this._speed.maximum = 1;
        this._statsGrid.addControl(this._speed, 1, 1);

        this._missile = new Slider("MissileLoading");
        this._missile.background = "#05d000";
        this._missile.color = "#878787";
        this._missile.rotation = Math.PI;
        this._missile.height = 1.0;
        this._missile.displayThumb = false;
        this._missile.minimum = 0;
        this._missile.maximum = Parameters.missileCoolDownTime;
        this._statsGrid.addControl(this._missile, 2, 1);
    }

    /*
    这段代码是一个名为 tick 的方法，其作用是对游戏的 UI 界面进行更新。在这个方法中，首先隐藏了所有的目标图像，然后根据当前场景中的敌方舰船数量，显示相应的目标图像，并将这些图像的位置计算出来。
    
    接下来，将 player 飞船的导弹冷却时间、速度和生命值分别更新到对应的滑动条中。如果 player.bestPrey 大于 0（表示 player 正在攻击一个目标），则根据该目标与 player 舰船之间的距离计算出插值 interpolate，用于控制导弹锁定图像 _targetLock 的外观；同时也将 _targetLock 的位置计算出来并更新到屏幕上。
    
    最后，将每一帧游戏的 FPS 值更新到 _fpsCounter 文本块中。
    
    这个方法的主要作用是实时更新游戏的 UI 界面，提供给玩家当前游戏状态的反馈信息。其中涉及到的类和方法都是 Babylon.js 库内置的 UI 元素和计算方法。
    */
    public tick(engine: Engine, player: Ship, shipManager: ShipManager): void {
        // hide every image
        this._targets.forEach(image => {
            image.isVisible = false;
        });

        let targetIndex = 0;
        shipManager.ships.forEach((ship) => {
            if (ship.isValid() && ship != player && ship.faction != player.faction) {
                this._computeScreenCoord(engine, player.shipCamera!.getFreeCamera(), ship.root.position, this._targets[targetIndex]);
                targetIndex++;
            }
        });

        this._missile.value = player.missileCooldown;
        this._speed.value = player.speedRatio;
        this._health.value = player.life;

        if (player.bestPrey > 0 && shipManager.ships[player.bestPrey] && player.shipCamera) {
            const interpolate = Math.min(player.bestPreyTime / Parameters.timeToLockMissile, 1);
            this._computeScreenCoord(engine, player.shipCamera.getFreeCamera(), shipManager.ships[player.bestPrey].root.position, this._targetLock, interpolate);
            this._targetLock.rotation = 1. - interpolate;
            // this._targetLock.width = 0.1 - interpolate * 0.075;
            // this._targetLock.height = 0.4 - interpolate * 0.3;
            this._targetLock.isVisible = true;
            if (interpolate > 0.99) {
                this._targetLock.sourceLeft = 256;
                // this._targetLock.color = "red";
                // this._targetLock.alpha = 1;
            } else {
                this._targetLock.sourceLeft = 0;
                // this._targetLock.color = "white";
                // this._targetLock.alpha = 0.5 + interpolate * 0.5;
            }
        } else {
            this._targetLock.isVisible = false;
        }

        //this._fpsCounter.text = engine.getFps().toFixed() + " fps";
    }

    /*
    这段代码是一个名为 setAlpha 的方法，它的作用是设置游戏的 UI 界面的透明度值。在这个方法中，首先将所有目标图像和导弹锁定图像的透明度设置为传入参数 alpha 的 40%（即 alpha*0.4），以使得这些图像能够更加明显地显示在屏幕上。
    
    然后，将 _statsPanel、_missile、_speed 和 _health 这些 UI 元素的透明度全部设置为 alpha，以控制整个 UI 界面的透明度。注释掉的 this._bars.alpha = alpha; 语句似乎没有被使用到。
    
    这个方法主要是用来在游戏进行时根据需要动态地调节 UI 界面的透明度，以使得玩家可以更加清晰地看到游戏场景并进行游戏。实现方式较为简单，其核心是通过 Babylon.js 库提供的 alpha 属性来设置 UI 元素的透明度。
    */
    public setAlpha(alpha: number): void {
        // this._bars.alpha = alpha;
        this._statsPanel.alpha = alpha;
        this._missile.alpha = alpha;
        this._speed.alpha = alpha;
        this._health.alpha = alpha;
        this._targets.forEach(image => {
            image.alpha = alpha * 0.4;
        });
        this._targetLock.alpha = alpha * 0.4;
        //this._fpsCounter.alpha = alpha;
    }

    /*
    这段代码是一个名为 _computeScreenCoord 的私有方法，它的作用是计算出世界坐标系中一个位置在屏幕上对应的 UI 元素的位置，并更新该元素的位置和旋转角度。
    
    在这个方法中，首先通过传入的 engine、camera 和 position（代表目标位置的三维向量）计算出该位置在屏幕上的二维坐标。具体地，该方法使用了一种常见的透视投影方式进行计算，具体实现方式可以参考代码中 Vector4.TransformCoordinates 和 camera.getViewMatrix()、camera.getProjectionMatrix() 等语句。同时，还计算了该元素在屏幕上是否可见的标志。
    
    接下来，根据计算出的二维坐标和屏幕分辨率，计算出该元素在屏幕上的实际位置（以像素为单位），并根据该位置更新该元素的 left 和 top 属性。为了让不同元素之间的位置错开，该方法还需根据 _index 和 _divisor 两个参数进行计算。
    
    最后，该方法根据计算出的坐标值和可见性给该元素设置旋转角度和可见性。
    
    这个方法的主要作用是将游戏场景中的目标位置映射到屏幕上的 UI 元素上，以提供玩家更加直观的视觉反馈信息。其中需要使用到 Babylon.js 库提供的矩阵变换和向量计算等方法。
    */
    private _computeScreenCoord(engine: Engine, camera: Camera, position: Vector3, image: Image, centerInterpolate: number = 1): void {
        const w = (engine.getRenderWidth() * 0.5);
        const h = engine.getRenderHeight() * 0.5;

        var spo0 = Vector4.TransformCoordinates(position, camera.getViewMatrix());
        var spo1 = Vector4.TransformCoordinates(new Vector3(spo0.x, spo0.y, spo0.z), camera.getProjectionMatrix());

        spo1.x /= spo1.w;
        spo1.y /= spo1.w;
        var l = spo1.x * w * centerInterpolate;
        var t = -spo1.y * h * centerInterpolate;
        var visible = spo1.z < 0;

        if (visible && spo1.z < 0) {
            t *= -1000;
            l *= -1000;
        }

        if (l < -w) {
            l = -w + 0.05 * w;
            visible = true;
        }
        else if (l > w) {
            l = w - 0.05 * w;
            visible = true;
        }

        if (t < -h) {
            t = -h + 0.1 * h;
            visible = true;
        }
        else if (t > h) {
            t = h - 0.1 * h;
            visible = true;
        }

        l /= this._divisor;
        l += (this._index * this._divisor - Math.floor(this._divisor / 2)) * w / this._divisor;
        image.left = l;
        image.top = t;
        image.rotation = Math.atan2(spo1.x, spo1.y) + ((spo1.z < 0) ? Math.PI : 0);
        image.isVisible = visible;
    }
    /*
    这段代码是 Babylon.js 游戏开发框架中的一个函数，主要用于计算和更新一个元素（image）在屏幕上的位置、可见性和旋转角度等属性。下面对函数中的每一行进行逐行解释：
    
    1. 声明了一个名为 `_computeScreenCoord` 的私有函数，并传入以下参数：
    - engine: 引擎对象。
    - camera: 相机对象。
    - position: 代表要计算的物体的位置向量。
    - image: 待操作的图像元素对象。
    - centerInterpolate: 在中心点插值时使用的插值因子（默认为 1）。
    ```
    private _computeScreenCoord(engine: Engine, camera: Camera, position: Vector3, image: Image, centerInterpolate: number = 1): void {
    ```
    
    2. 计算画布（canvas）的宽度和高度的一半，并分别赋值给变量 w 和 h。
    ```
    const w = (engine.getRenderWidth() * 0.5);
    const h = engine.getRenderHeight() * 0.5;
    ```
    
    3. 使用相机的视图矩阵和投影矩阵，将物体的世界坐标系中的位置向量 spo0 转化为裁剪空间坐标系中的位置向量 spo1。这里使用了 Vector4.TransformCoordinates 方法进行变换。
    ```
    var spo0 = Vector4.TransformCoordinates(position, camera.getViewMatrix());
    var spo1 = Vector4.TransformCoordinates(new Vector3(spo0.x, spo0.y, spo0.z), camera.getProjectionMatrix());
    ```
    
    4. 按照裁剪空间坐标系的要求，将 spo1 中的 x 和 y 坐标分别除以 w，并将结果覆盖原变量。这里得到的结果是归一化设备坐标系（Normalized Device Coordinates, NDC）中的位置。
    ```
    spo1.x /= spo1.w;
    spo1.y /= spo1.w;
    ```
    
    5. 计算元素在屏幕上的左侧和顶部边缘距离（单位像素），以及元素是否可见（visible）。具体计算方式如下：
    - l = spo1.x * w * centerInterpolate：计算元素左侧边缘距离。
    - t = -spo1.y * h * centerInterpolate：计算元素顶部边缘距离。
    - visible = spo1.z < 0：如果物体的 z 坐标小于 0，则认为元素不可见。
    ```
    var l = spo1.x * w * centerInterpolate;
    var t = -spo1.y * h * centerInterpolate;
    var visible = spo1.z < 0;
    ```
    
    6. 如果元素在屏幕上不可见，则将其左侧和顶部边距扩大一定倍数（这里是乘以 -1000），相当于将元素推远到更远的背景中去。这个操作可以让元素看起来更加自然。
    ```
    if (visible && spo1.z < 0) {
        t *= -1000;
        l *= -1000;
    }
    ```
    
    7. 判断元素是否超出了屏幕的边缘，如果是则重新计算左侧和顶部的边缘距离，并将 visible 设置为 true。
    ```
    if (l < -w) {
        l = -w + 0.05 * w;
        visible = true;
    }
    else if (l > w) {
        l = w - 0.05 * w;
        visible = true;
    }
    
    if (t < -h) {
        t = -h + 0.1 * h;
        visible = true;
    }
    else if (t > h) {
        t = h - 0.1 * h;
        visible = true;
    }
    ```
    
    8. 根据元素所在的位置（画布的哪个子区域）以及中心插值因子计算需要将元素放置在哪个子画布中，并更新元素的位置、旋转角度和可见性属性。
    - l /= this._divisor：获取元素所在子画布的序号。
    - l += (this._index * this._divisor - Math.floor(this._divisor / 2)) * w / this._divisor：根据序号确定元素在整个画布中的位置。其中 this._index 表示元素当前所在子画布的序号，this._divisor 表示子画布数量（这里假设每行有 3 个子画布）。
    - image.left = l：设置元素的左侧边缘距离。
    - image.top = t：设置元素的顶部边缘距离。
    - image.rotation = Math.atan2(spo1.x, spo1.y) + ((spo1.z < 0) ? Math.PI : 0)：计算元素需要旋转的角度，并设置其旋转属性。
    - image.isVisible = visible：设置元素的可见性属性。
    ```
    l /= this._divisor;
    l += (this._index * this._divisor - Math.floor(this._divisor / 2)) * w / this._divisor;
    image.left = l;
    image.top = t;
    image.rotation = Math.atan2(spo1.x, spo1.y) + ((spo1.z < 0) ? Math.PI : 0);
    image.isVisible = visible;
    ```
    */
}

export class HUD {
    private _adt: AdvancedDynamicTexture;
    private _enemiesRemaining: TextBlock;
    private _enemiesRemainingLabel: TextBlock;
    private _alliesRemaining: TextBlock;
    private _alliesRemainingLabel: TextBlock;
    private _shipManager: ShipManager;
    private _hudPanels: Array<HUDPanel>;
    private _parameters: StackPanel;
    private _touchInput: Nullable<TouchInput> = null;
    private _aiCounter: Rectangle;
    private _aiCounterGrid: Grid;
    /*
    这段代码是使用 Babylon.js 框架创建一个游戏的 UI 界面， 主要包括了以下功能：
    创建全屏的高级动态纹理 AdvancedDynamicTexture ，并将它的 layer 属性设置为 0x10000000。
    根据传入的参数 players ，循环创建每个玩家的 HUD 面板 HUDPanel ，并添加到高级动态纹理中。
    创建计数器 Rectangle ，并设置它的大小和位置等属性，然后添加到高级动态纹理中。
    在计数器 Rectangle 中，创建表格 Grid 和多个文字控件 TextBlock ，分别用于显示剩余的友军数量和敌军数量。
    如果开启了 AIDebugLabels 参数，则为每个飞船添加一个调试标签 TextBlock 。
    创建参数面板 StackPanel ，并设置它的大小、位置和可见性等属性，然后添加到高级动态纹理中。
    如果是在移动端上，则创建触摸输入 TouchInput 。
    需要注意的几点：
    高级动态纹理 AdvancedDynamicTexture 是 Babylon.js 框架中用于创建和管理 UI 界面的类。
    计数器 Rectangle 和表格 Grid 是 Babylon.js 框架中用于布局 UI 界面的类。
    文字控件 TextBlock 是 Babylon.js 框架中用于显示文本的类。
    参数面板 StackPanel 是 Babylon.js 框架中用于管理控件、实现布局和显示的类。
    AIDebugLabels 参数是用于开启或关闭飞船调试标签的开关。
    */
    constructor(shipManager: ShipManager, assets: Assets, scene: Scene, players: Array<Ship>) {
        console.log(JSON.stringify(Object.getOwnPropertyNames(Parameters)));
        this._shipManager = shipManager;
        this._adt = AdvancedDynamicTexture.CreateFullscreenUI("HUD", true, scene);
        this._adt.layer!.layerMask = 0x10000000;
        this._resizeListener = this._resizeListener.bind(this);
        window.addEventListener("resize", this._resizeListener);

        this._hudPanels = new Array<HUDPanel>();
        for (let i = 0; i < players.length; i++) {
            this._hudPanels.push(new HUDPanel(assets, this._adt, players.length, i));
        }
        this._aiCounter = new Rectangle("aiCounter");
        this._aiCounter.thickness = 0;
        if (InputManager.isTouch) {
            this._aiCounter.height = 0.1;
            this._aiCounter.width = 1.0;
            this._aiCounter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            this._aiCounter.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        } else {
            this._aiCounter.heightInPixels = 185;
            this._aiCounter.widthInPixels = 445;
            this._aiCounter.left = "80px";
            this._aiCounter.top = "-90px";
            this._aiCounter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._aiCounter.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        }
        this._adt.addControl(this._aiCounter)

        this._aiCounterGrid = new Grid();
        this._aiCounterGrid.addRowDefinition(0.55, false);
        this._aiCounterGrid.addRowDefinition(0.45, false);
        this._aiCounterGrid.addColumnDefinition(0.5, false);
        this._aiCounterGrid.addColumnDefinition(300, true);
        this._aiCounterGrid.addColumnDefinition(0.5, false);
        this._aiCounterGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._aiCounterGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._aiCounterGrid.height = 1.0;
        this._aiCounterGrid.width = 1.0;
        this._aiCounter.addControl(this._aiCounterGrid);

        this._alliesRemaining = new TextBlock("alliesRemaining");
        this._alliesRemaining.color = "white";
        if (InputManager.isTouch) {
            this._alliesRemaining.height = 1.0;
            this._alliesRemaining.fontSize = "15px";
        } else {
            this._alliesRemaining.heightInPixels = 40;
            this._alliesRemaining.fontSize = "30px";
        }
        this._alliesRemaining.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._alliesRemaining.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._alliesRemaining.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._alliesRemaining.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        GuiFramework.setFont(this._alliesRemaining, true, true);
        this._aiCounterGrid.addControl(this._alliesRemaining, 0, 0);

        this._alliesRemainingLabel = new TextBlock("_alliesRemainingLabel");
        this._alliesRemainingLabel.color = "white";
        if (InputManager.isTouch) {
            this._alliesRemainingLabel.height = 1.0;
            this._alliesRemainingLabel.fontSize = "10px";
        } else {
            this._alliesRemainingLabel.heightInPixels = 40;
            this._alliesRemainingLabel.fontSize = "14px";
        }
        this._alliesRemainingLabel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._alliesRemainingLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._alliesRemainingLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._alliesRemainingLabel.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        GuiFramework.setFont(this._alliesRemainingLabel, true, true);
        this._aiCounterGrid.addControl(this._alliesRemainingLabel, 1, 0);

        this._enemiesRemaining = new TextBlock("enemiesRemaining");
        this._enemiesRemaining.color = "white";
        if (InputManager.isTouch) {
            this._enemiesRemaining.height = 1.0;
            this._enemiesRemaining.fontSize = "15px";
        } else {
            this._enemiesRemaining.heightInPixels = 40;
            this._enemiesRemaining.fontSize = "30px";
        }
        this._enemiesRemaining.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._enemiesRemaining.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._enemiesRemaining.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._enemiesRemaining.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        GuiFramework.setFont(this._enemiesRemaining, true, true);
        this._aiCounterGrid.addControl(this._enemiesRemaining, 0, 2);

        this._enemiesRemainingLabel = new TextBlock("_enemiesRemainingLabel");
        this._enemiesRemainingLabel.color = "white";
        if (InputManager.isTouch) {
            this._enemiesRemainingLabel.height = 1.0;
            this._enemiesRemainingLabel.fontSize = "10px";
        } else {
            this._enemiesRemainingLabel.heightInPixels = 40;
            this._enemiesRemainingLabel.fontSize = "14px";
        }
        this._enemiesRemainingLabel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._enemiesRemainingLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._enemiesRemainingLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._enemiesRemainingLabel.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        GuiFramework.setFont(this._enemiesRemainingLabel, true, true);
        this._aiCounterGrid.addControl(this._enemiesRemainingLabel, 1, 2);

        if (Parameters.AIDebugLabels) {
            this._shipManager.ships.forEach(ship => {
                const text = new TextBlock("shiplable");
                this._adt.addControl(text);
                text.linkWithMesh(ship.root);
                text.color = "white";
                text.isVisible = false; // Comment out to see AI debug labels
                text.fontFamily = "'Courier New', monospace";
                ship.debugLabel = text;
            });
        }

        this._parameters = this.makeParametersPanel();
        this._parameters.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_RIGHT;
        this._parameters.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_TOP;
        this._parameters.widthInPixels = 350;
        this._parameters.paddingTopInPixels = 20;
        this._parameters.isVisible = !InputManager.isTouch;
        this._adt.addControl(this._parameters);

        if (InputManager.isTouch) {
            this._touchInput = new TouchInput(this._adt, this._shipManager);
        }
    }
    /*
    这段代码是一个私有方法 _resizeListener，用于监听浏览器窗口的大小变化并调整 ADT（AdvancedDynamicTexture 高级动态纹理）的缩放比例。
    具体功能如下：
    判断 ADT 对象是否存在且关联了场景对象。
    如果 ADT 对象关联了场景对象，则获取场景引擎的渲染宽度并通过 console.log() 打印到控制台。
    将 ADT 对象的缩放比例设置为场景引擎的渲染宽度和高度。
    注意事项：
    ADT 是 Babylon.js 中的一种高级面板，可以用于创建 2D UI 界面。
    在 Babylon.js 中，调整浏览器窗口大小会导致画布的尺寸发生变化，需要重新计算画布的尺寸并调整 ADT 的缩放比例以适应新的尺寸。
    如果 ADT 对象未正确关联场景对象，则不应该进行缩放操作。
    */
    private _resizeListener() {
        if (this._adt && this._adt.getScene()) {
            console.log(this._adt.getScene()!.getEngine().getRenderWidth())
            this._adt.scaleTo(this._adt.getScene()!.getEngine().getRenderWidth(), this._adt.getScene()!.getEngine().getRenderHeight());
        }
    }
    /*
    这段代码是一个名为 tick 的方法，用于更新游戏中的 HUD 界面和计数器等 UI 控件。具体功能如下：
    根据 Settings.showParameters 参数，设置参数面板 StackPanel 的可见性。
    统计所有存活的敌人和友军数量，并将它们分别显示在计数器 Rectangle 中的两个 TextBlock 中。
    如果开启了 AIDebugLabels 参数，则为每个存活的飞船添加调试标签，并在其中显示该飞船的状态、目标和动作等信息。
    根据传入的参数 gameSpeed，设置计数器 Rectangle 的透明度。
    调用每个 HUD 面板 HUDPanel 的 setAlpha 方法，根据传入的参数 gameSpeed，设置它们的透明度。
    如果存在触摸输入 TouchInput，则调用它的 tick 方法更新触摸状态。
    需要注意的几点：
    这段代码是一个用于更新游戏 UI 界面的方法，需要在游戏主循环中不断调用。
    Settings.showParameters 参数是用于显示或隐藏参数面板的开关。
    AIDebugLabels 参数是用于开启或关闭飞船调试标签的开关。
    飞船的状态、目标和动作等信息，是通过更新每个飞船对象的 debugLabel 属性实现的。
    对于移动端，还需要调用触摸输入 TouchInput 对象的 tick 方法，以更新触摸状态。
    */
    tick(engine: Engine, gameSpeed: number, players: Array<Ship>) {
        this._parameters.isVisible = Settings.showParameters;
        let enemyCount = 0, allyCount = 0;

        this._hudPanels.forEach((hudPanel, index) => {
            hudPanel.tick(engine, players[index], this._shipManager);
        });

        this._shipManager.ships.forEach((ship, shipIndex) => {
            if (ship.isValid()) {
                if (ship.faction == 1) {
                    enemyCount++;
                } else if (!ship.isHuman) {
                    allyCount++;
                }
                if (Parameters.AIDebugLabels) {
                    const movement = `${ship.input.burst ? 'bursting' : ''}${ship.input.breaking ? 'breaking' : ''}`;
                    ship.debugLabel!.text = `${ship.state}\nidx: ${shipIndex} tgt: ${ship.bestPrey}\n${movement}`;
                    ship.debugLabel!.isVisible = Parameters.AIDebugLabels;
                }
            }
        });

        this._enemiesRemaining.text = `${enemyCount}`;
        this._alliesRemaining.text = `${allyCount}`;
        this._alliesRemainingLabel.text = "ALLIES";
        this._enemiesRemainingLabel.text = "ENEMIES"

        // tick alpha from game speed, should hide HUD instead
        this._aiCounter.alpha = gameSpeed;

        this._hudPanels.forEach((hudPanel) => {
            hudPanel.setAlpha(gameSpeed);
        });

        if (this._touchInput) {
            this._touchInput.tick();
        }
    }
    /*
    这段代码是一个私有方法 makeParametersPanel，用于创建参数面板 StackPanel。
    具体功能如下：
    遍历 Parameters 对象中的所有属性，为每个属性创建一个包含 Label 和 Input 控件的 StackPanel。
    对于数值类型和字符串类型的属性，使用 InputText 控件创建一个可编辑的文本框。
    对于布尔类型的属性，使用 Checkbox 控件创建一个可选中或取消选中的复选框。
    将创建好的 StackPanel 添加到主面板 StackPanel 中。
    创建一个 Button 控件，用于将当前的参数设置导出为代码并复制到剪贴板中。
    最后返回主面板 StackPanel。
    需要注意的几点：
    Parameters 对象是一个全局的配置对象，其中包含了许多游戏中可调整的参数。
    makeParametersPanel 方法遍历 Parameters 对象中的所有属性，并根据属性的类型分别创建相应的控件。
    对于数值类型和字符串类型的属性，用户可以在输入框中直接输入数值或字符串，然后通过 onTextChangedObservable 事件来更新 Parameters 对象中对应的属性。
    对于布尔类型的属性，用户可以通过选中或取消选中复选框来改变 Parameters 对象中对应的属性。
    创建的参数控件都添加到了主面板 StackPanel 中。
    最后，通过 Button 控件实现了一个导出参数设置为代码并复制到剪贴板的功能。
    */
    private makeParametersPanel() {
        const panel = new StackPanel("parameters");
        Parameters.getParameters().forEach(param => {
            console.log(param);
            const container = new StackPanel(`${param} container`);
            container.isVertical = false;
            container.adaptHeightToChildren = true;
            container.widthInPixels = 350;
            const text = new TextBlock(`param ${param}`, param);
            text.color = 'white';
            text.fontSizeInPixels = 20;
            text.heightInPixels = 20;
            text.widthInPixels = 250;
            container.addControl(text);
            switch (typeof Parameters[param]) {
                case "number":
                case "string":
                    const input = new InputText(`${param} input`, Parameters[param]);
                    input.background = 'black';
                    input.color = 'white';
                    input.widthInPixels = 70;
                    input.onTextChangedObservable.add(() => {
                        let val = Parameters[param] as any;
                        if (typeof val === 'number') {
                            if (!isNaN(parseFloat(input.text))) {
                                val = parseFloat(input.text);
                            }
                        } else {
                            val = input.text;
                        }
                        (Parameters[param] as any) = val;
                    });
                    container.addControl(input);
                    break;
                case "boolean":
                    const checkbox = new Checkbox(`${param} input`);
                    checkbox.isChecked = Parameters[param];
                    checkbox.onIsCheckedChangedObservable.add(() => {
                        (Parameters[param] as any) = checkbox.isChecked;
                    })
                    checkbox.widthInPixels = 20;
                    checkbox.heightInPixels = 20;
                    checkbox.color = 'white';
                    container.addControl(checkbox);
                    break;
            }

            panel.addControl(container);
        })
        const exportButton = Button.CreateSimpleButton("export", "Copy Parameters to Clipboard");
        exportButton.background = "black";
        exportButton.color = "white";
        exportButton.onPointerDownObservable.add(() => {
            navigator.clipboard.writeText(Parameters.generateCode());
        })
        exportButton.widthInPixels = 300;
        exportButton.heightInPixels = 20;
        panel.addControl(exportButton);
        return panel;
    }

    dispose() {
        this._adt.dispose();
        window.removeEventListener("resize", this._resizeListener);
    }
}