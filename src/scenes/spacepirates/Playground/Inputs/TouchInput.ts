import { Nullable, Observable } from "@babylonjs/core";
import {
    AdvancedDynamicTexture,
    Button,
    Container,
    Control,
    Ellipse,
    TextBlock,
    Vector2WithInfo,
} from "@babylonjs/gui";
import { Input, InputManager } from './Input';
import { ShipManager } from "../Ship";
import { Parameters } from "../Parameters";
import { Settings } from "../../Settings";

function makeThumbArea(
    name: string,
    thickness: number,
    color: string,
    background: Nullable<string>
) {
    const rect = new Ellipse();
    rect.name = name;
    rect.thickness = thickness;
    rect.color = color;
    if (background) rect.background = background as string;
    rect.paddingLeft = "0px";
    rect.paddingRight = "0px";
    rect.paddingTop = "0px";
    rect.paddingBottom = "0px";
    return rect;
}
/*
这是一个用于创建触摸按钮的类，使用了 Babylon.js 引擎的 GUI 功能。该类接受几个参数，包括名称、文本和祖先 DynamicTexture 对象（在其中添加按钮）等。该类提供了一些方法来设置按钮的颜色、大小等属性，并且相应地更新底层的控件。
在该类的构造函数中，创建了一个 Container 控件，其中包含了一个 TextBlock 和 Ellipse 控件。使用 Ellipse 控件来绘制圆形按钮，而 TextBlock 用于显示按钮上的文本。然后，设置了一些默认值，例如圆的颜色、位置等等，并将该 Container 控件添加到祖先 DynamicTexture 控件中。最后，为该按钮注册了 PointerDown 和 PointerUp 的 Observable 事件，以对按钮点击进行响应，并改变按钮的大小和颜色等效果。
该类的优点在于，可以很容易地通过简单的代码调用来创建可定制的触摸按钮。该类可以用于在移动设备上实现 UI 控件，例如在游戏中添加虚拟手柄或其他常用的操作按钮。
*/
class TouchButton {
    container: Container;
    text: TextBlock;
    circle: Ellipse;
    onPointerDownObservable: Observable<Vector2WithInfo>;
    onPointerUpObservable: Observable<Vector2WithInfo>;
    constructor(name: string, text: string, adt: AdvancedDynamicTexture) {
        this.container = new Container(name);
        this.container.isPointerBlocker = true;
        this.text = new TextBlock(`${name}Text`, text);
        this.container.addControl(this.text);
        this.text.color = 'white';
        this.circle = new Ellipse(`${name}Circle`);
        this.container.addControl(this.circle);
        this.circle.width = 0.8;
        this.circle.height = 0.8;
        this.circle.color = 'white';
        this.container.left = -10;
        this.container.top = -10;
        this.container.verticalAlignment = Button.VERTICAL_ALIGNMENT_BOTTOM;
        this.container.horizontalAlignment = Button.HORIZONTAL_ALIGNMENT_RIGHT;
        this.container.background = "transparent";
        this.container.color = "white";
        this.onPointerDownObservable = this.container.onPointerDownObservable;
        this.onPointerUpObservable = this.container.onPointerUpObservable;
        this.onPointerDownObservable.add(() => this.circle.width = this.circle.height = 0.7);
        this.onPointerUpObservable.add(() => this.circle.width = this.circle.height = 0.8);
        adt.addControl(this.container);
    }
    public set color(color: string) {
        this.text.color = color;
        this.circle.color = color;
    }
    public get color(): string {
        return this.text.color;
    }
    public setSize(size: number) {
        this.container.widthInPixels = this.container.heightInPixels = size;
    }
}

export class TouchInput {
    _adt: AdvancedDynamicTexture;
    _shipManager: ShipManager;
    _fireButton: TouchButton;
    _missileButton: TouchButton;
    _burstButton: TouchButton;
    _brakeButton: TouchButton;
    _flipButton: TouchButton;
    _leftThumbContainer: Ellipse;
    _leftInnerThumbContainer: Ellipse;
    _leftPuck: Ellipse;
    _xAddPos = 0;
    _yAddPos = 0;
    /*
    这段代码是一个基于 Babylon.js 的虚拟摇杆和触摸按钮的实现，用于控制游戏中的飞船操作。主要实现了以下功能：
    创建一个 AdvancedDynamicTexture 类型的虚拟摇杆（ this._leftThumbContainer ），并设置其颜色、透明度、位置、大小等属性，同时为其绑定 onPointerDownObservable 、 onPointerMoveObservable 和 onPointerUpObservable 事件。
    创建一个 TouchButton 类型的触摸按钮（this._fireButton 、this._missileButton 、this._burstButton 、this._brakeButton 、this._flipButton ），并设置其文字、颜色、位置等属性，同时为其绑定 onPointerDownObservable 和 onPointerUpObservable 事件。
    在程序运行时，通过监听虚拟摇杆、触摸按钮的事件，来获取用户的输入，并将其转化为游戏中的操作指令（如： shooting 、 launchMissile 、 burst 、 breaking 、 immelmann 等）。通过 InputManager.input 对象记录用户的输入状态，并在游戏中使用。
    */
    /*
    name：椭圆形的名称。
    isPointerBlocker：确定椭圆形是否阻止指针事件的传递。
    horizontalAlignment：椭圆形在其父容器内的水平对齐方式。
    verticalAlignment：椭圆形在其父容器内的垂直对齐方式。
    alpha：椭圆形的不透明度（0-1）。
    left：椭圆形相对于其父容器左侧的位置（像素或百分比）。
    top：椭圆形相对于其父容器顶部的位置（像素或百分比）。
    scaleX：椭圆形在水平方向上的缩放比例。
    scaleY：椭圆形在垂直方向上的缩放比例。
    thickness：椭圆形的线框厚度。
    color：椭圆形的颜色。
    background：椭圆形的背景色。
    paddingLeft：椭圆形内容区域左侧的填充空间大小。
    paddingRight：椭圆形内容区域右侧的填充空间大小。
    paddingTop：椭圆形内容区域顶部的填充空间大小。
    paddingBottom：椭圆形内容区域底部的填充空间大小。
    isVisible：确定椭圆形是否可见。
    isHitTestVisible：确定椭圆形是否对点击事件作出响应。

    */
    constructor(adt: AdvancedDynamicTexture, shipManager: ShipManager) {
        this._adt = adt;
        this._shipManager = shipManager;
        this._xAddPos = 0;
        // 自定义
        let screenWidth = this._adt.getScene()?.getEngine().getRenderWidth();
        let screenHeight = this._adt.getScene()?.getEngine().getRenderHeight();
        let sideJoystickOffset = 10;
        let bottomJoystickOffset = -10;
        if (screenWidth !== undefined && screenHeight !== undefined) {
            sideJoystickOffset = screenWidth * 0.14;
            bottomJoystickOffset = -screenHeight * 0.15;
        }
        this._leftThumbContainer = makeThumbArea("this._leftThumb", 5, "blue", null);
        this._leftThumbContainer.isPointerBlocker = true;
        this._leftThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._leftThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._leftThumbContainer.alpha = 0.4;
        this._leftThumbContainer.left = sideJoystickOffset;//X轴坐标点
        this._leftThumbContainer.top = bottomJoystickOffset;//Y轴坐标点
        this._leftThumbContainer.scaleX = 1.3
        this._leftThumbContainer.scaleY = 1.3
        // this._leftInnerThumbContainer = makeThumbArea(
        //     "leftInnerThumb",
        //     1,
        //     "blue",
        //     null
        // );
        // this._leftInnerThumbContainer.height = 0.4;
        // this._leftInnerThumbContainer.width = 0.4;
        // this._leftInnerThumbContainer.isPointerBlocker = true;
        // this._leftInnerThumbContainer.horizontalAlignment =
        //     Control.HORIZONTAL_ALIGNMENT_CENTER;
        // this._leftInnerThumbContainer.verticalAlignment =
        //     Control.VERTICAL_ALIGNMENT_CENTER;

        this._leftPuck = makeThumbArea("this._leftPuck", 0, "blue", "blue");
        this._leftPuck.height = 0.4;
        this._leftPuck.width = 0.4;
        this._leftPuck.isPointerBlocker = true;
        this._leftPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._leftPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        const _this = this;

        let leftPuckFloatLeft,
            leftPuckFloatTop,
            leftPuckIsDown = false;

        this._leftThumbContainer.onPointerDownObservable.add(function (coordinates) {
            _this._leftPuck.isVisible = true;
            leftPuckFloatLeft =
                coordinates.x -
                _this._leftThumbContainer._currentMeasure.width * 0.5 -
                sideJoystickOffset;
            _this._leftPuck.left = leftPuckFloatLeft;
            leftPuckFloatTop =
                (adt as any)._canvas.height -
                coordinates.y -
                _this._leftThumbContainer._currentMeasure.height * 0.5 +
                bottomJoystickOffset;
            _this._leftPuck.top = leftPuckFloatTop * -1;
            leftPuckIsDown = true;
            _this._leftThumbContainer.alpha = 0.9;
        });

        this._leftThumbContainer.onPointerUpObservable.add(function (coordinates) {
            _this._xAddPos = 0;
            _this._yAddPos = 0;
            leftPuckIsDown = false;
            _this._leftPuck.isVisible = false;
            _this._leftThumbContainer.alpha = 0.4;
        });

        this._leftThumbContainer.onPointerMoveObservable.add(function (coordinates) {
            if (leftPuckIsDown) {
                _this._xAddPos =
                    coordinates.x -
                    _this._leftThumbContainer._currentMeasure.width * 0.5 -
                    sideJoystickOffset;
                _this._yAddPos =
                    (adt as any)._canvas.height -
                    coordinates.y -
                    _this._leftThumbContainer._currentMeasure.height * 0.5 +
                    bottomJoystickOffset;
                leftPuckFloatLeft = _this._xAddPos;
                leftPuckFloatTop = _this._yAddPos * -1;
                _this._leftPuck.left = leftPuckFloatLeft;
                _this._leftPuck.top = leftPuckFloatTop;
            }
        });

        adt.addControl(this._leftThumbContainer);
        this._leftThumbContainer.addControl(this._leftInnerThumbContainer);
        this._leftThumbContainer.addControl(this._leftPuck);
        this._leftPuck.isVisible = false;


        this._fireButton = new TouchButton("fireButton", "FIRE", adt);
        this._fireButton.color = "orange";
        this._fireButton.onPointerDownObservable.add(() => {
            InputManager.input.shooting = true;
            this._fireButton.color = "white";
        });
        this._fireButton.onPointerUpObservable.add(() => {
            InputManager.input.shooting = false;
            this._fireButton.color = "orange";
        });

        this._missileButton = new TouchButton("missileButton", "MISSILE", adt);
        this._missileButton.color = "grey";
        this._missileButton.onPointerDownObservable.add(() => {
            InputManager.input.launchMissile = true;
            this._missileButton.color = "white";
        });
        this._missileButton.onPointerUpObservable.add(() => {
            InputManager.input.launchMissile = false;
        });

        this._burstButton = new TouchButton("burstButton", "BURST", adt);
        this._burstButton.color = "blue";
        this._burstButton.onPointerDownObservable.add(() => {
            InputManager.input.burst = true;
        })
        this._burstButton.onPointerUpObservable.add(() => {
            InputManager.input.burst = false;
        })

        this._brakeButton = new TouchButton("brakeButton", "BRAKE", adt);
        this._brakeButton.color = "yellow";
        this._brakeButton.container.horizontalAlignment = Button.HORIZONTAL_ALIGNMENT_LEFT;
        this._brakeButton.container.leftInPixels = 10;
        this._brakeButton.onPointerDownObservable.add(() => {
            InputManager.input.breaking = true;
        })
        this._brakeButton.onPointerUpObservable.add(() => {
            InputManager.input.breaking = false;
        })

        this._flipButton = new TouchButton("flipButton", "FLIP", adt);
        this._flipButton.color = "pink";
        this._flipButton.container.horizontalAlignment = Button.HORIZONTAL_ALIGNMENT_LEFT;
        this._flipButton.container.leftInPixels = 10;
        this._flipButton.onPointerDownObservable.add(() => {
            InputManager.input.immelmann = true;
        })
        this._flipButton.onPointerUpObservable.add(() => {
            InputManager.input.immelmann = false;
        })
    }
    /*
    这段代码是一个基于 Babylon.js 的空战游戏的控制手柄部分的实现。具体解释如下：

    - constructor(adt: AdvancedDynamicTexture, shipManager: ShipManager)

    这是构造函数，接受两个参数，第一个参数 adt 是 AdvancedDynamicTexture 对象，是 Babylon.js 中一个高级的 GUI 组件，用于创建和管理 2D UI 元素。第二个参数 shipManager 是一个船只管理器，用于管理游戏中的所有飞船。

    - this._adt = adt;

    将传入的 AdvancedDynamicTexture 对象保存到当前对象的 _adt 属性中。

    - this._shipManager = shipManager;

    将传入的 ShipManager 对象保存到当前对象的 _shipManager 属性中。

    - this._xAddPos = 0;

    设置当前对象的 _xAddPos 属性为 0。

    - let sideJoystickOffset = 10;

    定义一个名为 sideJoystickOffset 的局部变量，并将其赋值为 10。

    - let bottomJoystickOffset = -10;

    定义一个名为 bottomJoystickOffset 的局部变量，并将其赋值为 -10。

    - this._leftThumbContainer = makeThumbArea("this._leftThumb", 2, "blue", null);

    调用 makeThumbArea 函数，创建一个名为 this._leftThumbContainer 的 UI 控件，表示左侧的操纵杆。其中 2 是指操纵杆的阶段，"blue" 表示操纵杆的颜色，null 则表示该控件没有任何父级容器。

    - this._leftThumbContainer.isPointerBlocker = true;

    设置 this._leftThumbContainer 的 isPointerBlocker 属性为 true，表示该控件会阻止其他控件接收鼠标事件。

    - this._leftThumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

    设置 this._leftThumbContainer 的 horizontalAlignment 属性为 Control.HORIZONTAL_ALIGNMENT_LEFT，表示该控件的水平对齐方式为左对齐。

    - this._leftThumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    设置 this._leftThumbContainer 的 verticalAlignment 属性为 Control.VERTICAL_ALIGNMENT_BOTTOM，表示该控件的垂直对齐方式为底部对齐。

    - this._leftThumbContainer.alpha = 0.4;

    设置 this._leftThumbContainer 的 alpha 属性为 0.4，表示该控件的不透明度为 0.4。

    - this._leftThumbContainer.left = sideJoystickOffset;

    设置 this._leftThumbContainer 的 left 属性为 sideJoystickOffset，表示该控件距离父级容器的左侧边距离为 sideJoystickOffset。

    - this._leftThumbContainer.top = bottomJoystickOffset;

    设置 this._leftThumbContainer 的 top 属性为 bottomJoystickOffset，表示该控件距离父级容器的底部边距离为 bottomJoystickOffset。

    - this._leftThumbContainer.scaleX = 1.3

    设置 this._leftThumbContainer 的 scaleX 属性为 1.3，表示该控件在水平方向上放大了 1.3 倍。

    - this._leftThumbContainer.scaleY = 1.3

    设置 this._leftThumbContainer 的 scaleY 属性为 1.3，表示该控件在垂直方向上放大了 1.3 倍。

    - this._leftPuck = makeThumbArea("this._leftPuck", 0, "blue", "blue");

    调用 makeThumbArea 函数，创建一个名为 this._leftPuck 的 UI 控件，表示左侧的操纵球。其中 0 是指操纵球的阶段，"blue" 表示操纵球的外边框颜色，"blue" 则表示操纵球的填充颜色。

    - this._leftPuck.height = 0.4;

    设置 this._leftPuck 的 height 属性为 0.4，表示操纵球的高度为 0.4。

    - this._leftPuck.width = 0.4;

    设置 this._leftPuck 的 width 属性为 0.4，表示操纵球的宽度为 0.4。

    - this._leftPuck.isPointerBlocker = true;

    设置 this._leftPuck 的 isPointerBlocker 属性为 true，表示该控件会阻止其他控件接收鼠标事件。

    - this._leftPuck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    设置 this._leftPuck 的 horizontalAlignment 属性为 Control.HORIZONTAL_ALIGNMENT_CENTER，表示该控件的水平对齐方式为居中对齐。

    - this._leftPuck.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    设置 this._leftPuck 的 verticalAlignment 属性为 Control.VERTICAL_ALIGNMENT_CENTER，表示该控件的垂直对齐方式为居中对齐。

    - const _this = this;

    创建一个名为 _this 的局部变量，并将当前对象赋值给它。这样在后面的代码中就可以通过 _this 访问当前对象的属性和方法。

    - let leftPuckFloatLeft, leftPuckFloatTop, leftPuckIsDown = false;

    定义三个局部变量，leftPuckFloatLeft 用于保存操纵球的左侧坐标位置，leftPuckFloatTop 用于保存操纵球的顶部坐标位置，leftPuckIsDown 用于标记操纵球是否被按下。

    - this._leftThumbContainer.onPointerDownObservable.add(function (coordinates) { ... })

    为 this._leftThumbContainer 的 onPointerDownObservable 添加一个回调函数，当该控件被按下时会触发该函数。

    - _this._leftPuck.isVisible = true;

    将 this._leftPuck 控件的 isVisible 属性设置为 true，使得操纵球显示出来。

    - leftPuckFloatLeft = coordinates.x - _this._leftThumbContainer._currentMeasure.width * 0.5 - sideJoystickOffset;

    计算操纵球的左侧坐标位置，其中 coordinates.x 表示当前鼠标点击事件的 x 坐标，_this._leftThumbContainer._currentMeasure.width 表示当前控件的宽度，sideJoystickOffset 是一个偏移量，用于微调操纵球的位置。

    - _this._leftPuck.left = leftPuckFloatLeft;

    将操纵球的左侧坐标位置设置为 leftPuckFloatLeft。

    - leftPuckFloatTop = (adt as any)._canvas.height - coordinates.y - _this._leftThumbContainer._currentMeasure.height * 0.5 + bottomJoystickOffset;

    计算操纵球的顶部坐标位置，其中 (adt as any)._canvas.height 表示当前画布的高度，coordinates.y 表示当前鼠标点击事件的 y 坐标，_this._leftThumbContainer._currentMeasure.height 表示当前控件的高度，bottomJoystickOffset 是一个偏移量，用于微调操纵球的位置。

    - _this._leftPuck.top = leftPuckFloatTop * -1;

    将操纵球的顶部坐标位置设置为 leftPuckFloatTop 的相反数乘以 -1。

    - leftPuckIsDown = true;

    将 leftPuckIsDown 标记为 true，表示操纵球被按下。

    - _this._leftThumbContainer.alpha = 0.9;

    将 this._leftThumbContainer 控件的 alpha 属性设置为 0.9，使得操纵杆变为半透明状态。

    - this._leftThumbContainer.onPointerUpObservable.add(function (coordinates) { ... })

    为 this._leftThumbContainer 的 onPointerUpObservable 添加一个回调函数，当该控件被松开时会触发该函数。

    - _this._xAddPos = 0;

    将 _this._xAddPos 属性设置为 0。

    - _this._yAddPos = 0;

    将 _this._yAddPos 属性设置为 0。

    - leftPuckIsDown = false;

    将 leftPuckIsDown 标记为 false，表示操纵球没有被按下。

    - _this._leftPuck.isVisible = false;

    将 this._leftPuck 控件的 isVisible 属性设置为 false，使得操纵球隐藏起来。

    - _this._leftThumbContainer.alpha = 0.4;

    将 this._leftThumbContainer 控件的 alpha 属性设置为 0.4，使得操纵杆变回半透明状态。

    - this._leftThumbContainer.onPointerMoveObservable.add(function (coordinates) { ... })

    为 this._leftThumbContainer 的 onPointerMoveObservable 添加一个回调函数，当光标在该控件上移动时会触发该函数。

    - if (leftPuckIsDown) { ... }

    如果操纵球被按下，则执行下面的操作。

    - _this._xAddPos = coordinates.x - _this._leftThumbContainer._currentMeasure.width * 0.5 - sideJoystickOffset;

    计算相对于操纵杆中心点的 x 坐标偏移量。

    - _this._yAddPos = (adt as any)._canvas.height - coordinates.y - _this._leftThumbContainer._currentMeasure.height * 0.5 + bottomJoystickOffset;

    计算相对于操纵杆中心点的 y 坐标偏移量。

    - leftPuckFloatLeft = _this._xAddPos;

    将操纵球的左侧坐标位置设置为计算出的 x 坐标偏移量。

    - leftPuckFloatTop = _this._yAddPos * -1;

    将操纵球的顶部坐标位置设置为计算出的 y 坐标偏移量的相反数乘以 -1。

    - _this._leftPuck.left = leftPuckFloatLeft;

    将操纵球的左侧坐标位置设置为 leftPuckFloatLeft。

    - _this._leftPuck.top = leftPuckFloatTop;

    将操纵球的顶部坐标位置设置为 leftPuckFloatTop。

    - adt.addControl(this._leftThumbContainer);

    将 this._leftThumbContainer 添加到 AdvancedDynamicTexture 对象中。

    - this._leftThumbContainer.addControl(this._leftInnerThumbContainer);

    将 this._leftInnerThumbContainer 添加到 this._leftThumbContainer 中。

    - this._leftThumbContainer.addControl(this._leftPuck);

    将 this._leftPuck 添加到 this._leftThumbContainer 中。

    - this._leftPuck.isVisible = false;

    将 this._leftPuck 控件的 isVisible 属性设置为 false，使得操纵球最初是隐藏的。

    - this._fireButton = new TouchButton("fireButton", "FIRE", adt); ...

    创建四个名为 this._fireButton、this._missileButton、this._burstButton 和 this._
    */
    /*
    这段代码是一个基于 Babylon.js 的虚拟摇杆和触摸按钮的更新函数，用于在每一帧更新虚拟摇杆和触摸按钮的位置以及读取用户的输入状态。主要实现了以下功能：
    根据当前屏幕尺寸计算出虚拟摇杆和触摸按钮需要占据的屏幕比例，并将其赋值给虚拟摇杆和触摸按钮的大小。同时，为了使按钮排列更加紧凑，还会设置一些按钮之间的相对位置和间距。
    通过计算虚拟摇杆的拖动距离，将其映射到 InputManager.input.dx 和 InputManager.input.dy，分别表示飞船在 x 轴和 y 轴上的速度。由于 Babylon.js 中的坐标系和常见的数学坐标系不同，因此在计算 y 轴速度时需要将其乘以 -1，同时可以根据 Settings.invertY 的值来判断是否需要翻转 y 轴速度。
    根据当前游戏状态，修改触摸按钮的颜色，以便用户更加清晰地了解当前能否执行该操作。比如当玩家的导弹冷却结束、且此时目标与玩家的距离足够近时，导弹按钮就会变成红色。
    注意：本段代码是一个游戏项目的部分实现，如果您想要运行该项目，需要先了解整个项目的框架和结构，并进行必要的配置、资源加载等操作。
    */
    public tick() {
        const thirdOfScreen = Math.min((this._adt.getSize().width - 20) * 0.3, (this._adt.getSize().height - 20) * 0.3);
        this._leftThumbContainer.widthInPixels = this._leftThumbContainer.heightInPixels = thirdOfScreen;
        this._fireButton.setSize(thirdOfScreen);
        this._fireButton.container.heightInPixels = this._fireButton.container.widthInPixels = thirdOfScreen;
        this._missileButton.setSize(thirdOfScreen);
        this._missileButton.container.topInPixels = -30 - thirdOfScreen * 2;
        this._burstButton.setSize(thirdOfScreen);
        this._burstButton.container.topInPixels = -20 - thirdOfScreen;
        this._brakeButton.setSize(thirdOfScreen);
        this._brakeButton.container.topInPixels = -20 - thirdOfScreen;
        this._flipButton.setSize(thirdOfScreen);
        this._flipButton.container.topInPixels = -30 - thirdOfScreen * 2;


        InputManager.input.dx = this._xAddPos / 3000;
        InputManager.input.dy = (this._yAddPos / 3000) * -1;
        if (Settings.invertY) {
            InputManager.input.dy *= -1;
        }
        InputManager.input.constrainInput();
        const player = this._shipManager.ships[0];
        if (
            player.missileCooldown <= 0 &&
            player.bestPreyTime >= Parameters.timeToLockMissile &&
            player.bestPrey >= 0
        ) {
            this._missileButton.color = "red";
        } else {
            this._missileButton.color = "grey";
        }
    }
    /*
    这段代码是一个基于 Babylon.js 的虚拟游戏手柄的更新函数。逐行解释如下：
    
    const thirdOfScreen = Math.min((this._adt.getSize().width - 20) * 0.3, (this._adt.getSize().height - 20) * 0.3);
    计算出手柄需要占据的屏幕比例，取屏幕宽高的0.3倍和20像素的差值的最小值为该比例。
    this._leftThumbContainer.widthInPixels = this._leftThumbContainer.heightInPixels = thirdOfScreen;
    将手柄中左侧的拇指盘的宽度和高度设置为上一步计算得到的比例值。
    this._fireButton.setSize(thirdOfScreen);
    将开火按钮的大小设置为上一步计算得到的比例值。
    this._fireButton.container.heightInPixels = this._fireButton.container.widthInPixels = thirdOfScreen;
    将开火按钮所在的容器的高度和宽度设置为上一步计算得到的比例值。
    this._missileButton.setSize(thirdOfScreen);
    将导弹按钮的大小设置为上一步计算得到的比例值。
    this._missileButton.container.topInPixels = -30 - thirdOfScreen * 2;
    将导弹按钮所在的容器距离顶部的距离设置为-30减去2倍的比例值，即在界面上显示在开火按钮的上方。
    this._burstButton.setSize(thirdOfScreen);
    将突击按钮的大小设置为上一步计算得到的比例值。
    this._burstButton.container.topInPixels = -20 - thirdOfScreen;
    将突击按钮所在的容器距离顶部的距离设置为-20减去比例值。
    this._brakeButton.setSize(thirdOfScreen);
    将刹车按钮的大小设置为上一步计算得到的比例值。
    this._brakeButton.container.topInPixels = -20 - thirdOfScreen;
    将刹车按钮所在的容器距离顶部的距离设置为-20减去比例值。
    this._flipButton.setSize(thirdOfScreen);
    将翻转按钮的大小设置为上一步计算得到的比例值。
    this._flipButton.container.topInPixels = -30 - thirdOfScreen * 2;
    将翻转按钮所在的容器距离顶部的距离设置为-30减去2倍的比例值，即在界面上显示在突击按钮的上方。
    InputManager.input.dx = this._xAddPos / 3000;
    将玩家在屏幕 x 轴上的拖动距离除以 3000，得到一个归一化后的值，赋值给 InputManager 的 input 对象的 dx 属性。
    InputManager.input.dy = (this._yAddPos / 3000) * -1;
    将玩家在屏幕 y 轴上的拖动距离除以 3000，得到一个归一化后的值，并反转正负号，赋值给 InputManager 的 input 对象的 dy 属性。
    if (Settings.invertY) { InputManager.input.dy *= -1; }
    如果设置了反转 y 轴的输入，则将 input 对象的 dy 属性取反。
    InputManager.input.constrainInput();
    执行 constrainInput 函数，用于约束手柄输入的范围和速度。
    const player = this._shipManager.ships[0];
    获取游戏中的第一个飞船实例。
    if (player.missileCooldown <= 0 && player.bestPreyTime >= Parameters.timeToLockMissile && player.bestPrey >= 0) { this._missileButton.color = "red"; } else { this._missileButton.color = "grey"; }
    根据当前游戏状态修改导弹按钮的颜色。如果导弹冷却已经结束、目标与玩家的距离足够近且存在合适的目标，则将导弹按钮的颜色设置为红色，否则将其设置为灰色。
    */
}
