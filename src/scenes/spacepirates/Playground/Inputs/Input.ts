import { Nullable, KeyboardInfo, Observer, Scene, KeyboardEventTypes, VirtualJoystick, Tools } from "@babylonjs/core";
import { Agent } from "../Agent";
import { State } from "../States/State";
import { States } from "../States/States";
import { Parameters } from '../Parameters';
import { GamepadInput } from './GamepadInput';
import { Settings } from "../../Settings";
import { useNative } from "../../playgroundRunner";

declare var document: any;

export class Input {
    dx: number = 0;//控制纵向转向的值
    dy: number = 0;//控制水平转向的值
    shooting: boolean = false;//射击
    launchMissile: boolean = false;//发射导弹
    burst: boolean = false;//爆发
    breaking: boolean = false;//制动功能
    /*
    Immelmann 转向是指飞机飞行中的一种特殊转向技术，通常是在飞机从低空向上爬时使用。
    具体来说，它是一种急剧的半卷式转弯，其中飞机开始向上爬升，同时向一侧倾斜并转向，使飞机在一个平面上旋转180度并转向，最终以相反的方向飞行。
    在游戏中，这个功能模拟的是飞行器的一种特定的机动技术，使得飞行器变得更加灵活和机动。
    */
    immelmann: boolean = false;//Imelmann 转向功能

    public constrainInput() {//用于控制坐标以及输入值的范围
        this.dx = Math.max(Math.min(Parameters.playerTurnRate, this.dx), -Parameters.playerTurnRate);// 将 dx 的值限制在 -Parameters.playerTurnRate 和 Parameters.playerTurnRate 范围内
        this.dy = Math.max(Math.min(Parameters.playerTurnRate, this.dy), -Parameters.playerTurnRate);
    }
}

// credit: https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
/*
这是一个用于检测当前设备是否支持触摸屏的函数。在Babylon.js游戏开发中，需要根据不同设备的特性来进行游戏交互控制，例如通过鼠标、键盘或触摸屏等方式来进行游戏操作。
该函数使用了三种常见的检测方式，主要包括：
('ontouchstart' in window)：检测window对象是否支持ontouchstart属性，如果支持，则表示当前设备支持触摸屏。
(navigator.maxTouchPoints > 0)：检测navigator对象的maxTouchPoints属性是否大于0，如果大于0，则表示当前设备支持触摸屏。
(navigator as any).msMaxTouchPoints > 0：检测navigator对象的msMaxTouchPoints属性是否大于0，如果大于0，则表示当前设备支持触摸屏（适用于IE浏览器）。
通过这些检测方式，可以比较全面地判断当前设备是否支持触摸屏，从而在游戏开发中选择合适的交互方式。
*/
function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        ((navigator as any).msMaxTouchPoints > 0));
}

export class InputManager {
    private static _scene: Scene;
    private static _keyboardObserver: Nullable<Observer<KeyboardInfo>> = null;
    public static input: Input = new Input;
    private static _canvas: HTMLCanvasElement;
    public static deltaTime: number = 0;
    public static isTouch = false;

    /*
    这是一个用于处理输入事件的构造函数。在游戏开发中，响应用户的输入操作至关重要。该构造函数使用Babylon.js提供的输入管理模块，对键盘和游戏手柄事件进行了处理。
    在该构造函数中，首先将场景对象和画布元素存储到`InputManager`静态类中，以便后续使用。接着，利用`isTouchDevice()`函数检查当前设备是否为触摸屏，并将检测结果存储到`InputManager.isTouch`变量中。
    调用了`InputManager.setupPointerLock()`函数启用了指针锁定功能，在游戏中，指针锁定通常用于保持鼠标光标在游戏窗口中，方便玩家进行游戏控制。
    使用`scene.onKeyboardObservable.add()`方法监听键盘事件。当键盘事件发生时，会调用回调函数，根据按下的键盘代码(`kbInfo.event.keyCode`)来判断用户进行了哪种操作，并将相应的输入状态存储到`InputManager.input`对象中。例如，当用户按下W键时，会将`InputManager.input.burst`设置为`true`，表示用户正在做加速动作。
    最后，调用`GamepadInput.initialize()`方法初始化游戏手柄输入管理器，以便支持游戏手柄操作。
    通过使用该构造函数，可以对游戏中的键盘和游戏手柄事件进行处理，让玩家可以通过键盘或手柄来进行游戏操作。
    */
    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        InputManager._scene = scene;
        InputManager._canvas = canvas;

        InputManager.isTouch = isTouchDevice();

        InputManager.setupPointerLock();

        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    /*if (kbInfo.event.keyCode == 39) {
                        InputManager.input.shooting = true;
                    } else if (kbInfo.event.keyCode == 40) {
                        InputManager.input.launchMissile = true;
                    } else*/ if (kbInfo.event.keyCode == 87) {
                        InputManager.input.burst = true;
                    } else if (kbInfo.event.keyCode == 83) {
                        InputManager.input.breaking = true;
                    } else if (kbInfo.event.keyCode == 81) {
                        InputManager.input.immelmann = true;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    /*if (kbInfo.event.keyCode == 39) {
                        InputManager.input.shooting = false;
                    } else if (kbInfo.event.keyCode == 40) {
                        InputManager.input.launchMissile = false;
                    } else*/ if (kbInfo.event.keyCode == 87) {
                        InputManager.input.burst = false;
                    } else if (kbInfo.event.keyCode == 83) {
                        InputManager.input.breaking = false;
                    } else if (kbInfo.event.keyCode == 81) {
                        InputManager.input.immelmann = false;
                    }
                    break;
            }
        });

        GamepadInput.initialize();
    }
    /*
    `event.movementX` 是一个 MouseEvent 接口中的只读属性，表示鼠标事件在 X 轴上移动的距离，单位为像素。它通常用于处理鼠标拖拽事件，可以通过监听 `mousemove` 事件来获取鼠标移动的距离。

    `event.buttons` 属性是一个表示当前鼠标按下的按钮状态的数字。它是一个位掩码，每个按下的鼠标按钮都对应一个特定的二进制位。以下是 `event.buttons` 属性的取值及其对应的二进制位：
    
    - 1：左键
    - 2：右键
    - 4：中键
    - 8：第四个按钮（通常是“前进”按钮）
    - 16：第五个按钮（通常是“后退”按钮）
    
    多个按键按下时，它们的二进制位会相加，例如左键和右键同时按下时，`event.buttons` 的值为 3（1 + 2）。
    
    */
    /*
    这是一个处理鼠标移动事件的函数，在每个游戏循环中调用以更新游戏状态。该函数获取了鼠标移动的信息，并将其转换为输入状态，用于控制游戏中的飞机或其他实体。
    在该函数中，首先检查是否当前使用的是触摸屏的输入设备，如果是则返回并不做处理。接着检查是否有游戏手柄被连接，如果有则也返回并不做处理。然后获取输入状态所需的deltaTime值。
    随后，根据鼠标移动的信息，计算出对应的dx和dy值。这里的dx和dy表示鼠标在x轴和y轴上移动的距离，乘上参数mouseSensitivty和deltaTime后成为调整后的速率。如果设置了反转Y轴操作，则将其dy值反转。在限制输入范围后，根据鼠标按钮的状态来设置shooting和launchMissile标志，表示用户是否正在射击或者发射导弹。
    通过注册该函数作为鼠标移动事件的监听器，可以响应鼠标的移动，从而控制游戏实体的移动或者视角的移动等动作。该函数提供了一种方便的方式来解析鼠标移动信息，并将其转化为游戏中的输入状态。
    */
    static mouseMove(e: any) {
        if (InputManager.isTouch) {
            return;
        }
        if (GamepadInput.gamepads.length != 0) {
            return;
        }
        const deltaTime = InputManager.deltaTime;//._scene.getEngine().getDeltaTime();

        var movementX = e.movementX ||
            e.mozMovementX ||
            e.webkitMovementX ||
            0;

        var movementY = e.movementY ||
            e.mozMovementY ||
            e.webkitMovementY ||
            0;

        const input = InputManager.input;
        input.dx = movementX * Parameters.mouseSensitivty * deltaTime;
        input.dy = movementY * Parameters.mouseSensitivty * deltaTime;
        if (Settings.invertY) {
            input.dy *= -1;
        }
        input.constrainInput();
        input.shooting = e.buttons == 1;
        input.launchMissile = e.buttons == 2;
    }
    /*
    这段代码定义了一个静态方法 `mouseMove`，用于处理鼠标移动事件。下面逐行解释它：
    
    ```
    if (InputManager.isTouch) {
        return;
    }
    ```
    如果当前处于触摸设备上，则直接返回。
    
    ```
    if (GamepadInput.gamepads.length != 0) {
        return;
    }
    ```
    如果当前连接了游戏手柄，则也直接返回。
    
    ```
    const deltaTime = InputManager.deltaTime;//._scene.getEngine().getDeltaTime();
    ```
    该行代码获取时间间隔 `deltaTime`，即距离上一帧的时间差。
    
    ```
    var movementX = e.movementX ||
        e.mozMovementX ||
        e.webkitMovementX ||
        0;
    
    var movementY = e.movementY ||
        e.mozMovementY ||
        e.webkitMovementY ||
        0;
    ```
    这两行代码获取了鼠标在当前事件中相对于前一次事件的水平和垂直移动距离，并根据浏览器厂商提供的兼容性属性做了兼容处理。
    
    ```
    const input = InputManager.input;
    input.dx = movementX * Parameters.mouseSensitivty * deltaTime;
    input.dy = movementY * Parameters.mouseSensitivty * deltaTime;
    ```
    这两行代码根据鼠标移动距离和灵敏度常数计算出水平和垂直方向上的输入信息。
    
    ```
    if (Settings.invertY) {
        input.dy *= -1;
    }
    ```
    如果开启了 `Settings` 中的 `invertY`，则将 `dy` 的值取反。
    
    ```
    input.constrainInput();
    ```
    该行代码调用了 `constrainInput()` 方法，用于限定 `dx` 和 `dy` 的值在一个合理的范围内。
    
    ```
    input.shooting = e.buttons == 1;
    input.launchMissile = e.buttons == 2;
    ```
    这两行代码根据鼠标左右键的点击情况设置 `shooting` 和 `launchMissile` 的值，用于射击和发射导弹。
    
    以上即为该段代码的逐行解释。
    */

    /*
    这是一个处理游戏控制器状态变化事件的函数。该函数在控制器进入或离开指针锁定状态时被调用，根据不同状态进行相应的处理。
    在该函数中，首先确认当前浏览器是否支持`pointer`事件，如果不支持则改用`mouse`事件。接着检查当前是否处于指针锁定状态，如果是则注册`mouseMove`函数为`pointermove`、`pointerdown`和`pointerup`事件的监听器，并响应鼠标移动、左键点击和左键释放事件。如果不是，则移除相应的事件监听器，并将当前状态设置为游戏菜单状态（inGameMenu）。
    通过注册该函数作为指针锁定状态改变事件的监听器，可以响应控制器进入或离开指针锁定状态的事件，从而进行相应的处理。该函数提供了一种方便的方式来检测是否处于指针锁定状态，并注册或移除相应的事件监听器。
    */
    static changeCallback(e: any) {
        const pointerEventType = Tools.IsSafari() ? "mouse" : "pointer";
        if (document.pointerLockElement === InputManager._canvas ||
            document.mozPointerLockElement === InputManager._canvas ||
            document.webkitPointerLockElement === InputManager._canvas
        ) {
            // we've got a pointerlock for our element, add a mouselistener
            document.addEventListener(`${pointerEventType}move`, InputManager.mouseMove, false);
            document.addEventListener(`${pointerEventType}down`, InputManager.mouseMove, false);
            document.addEventListener(`${pointerEventType}up`, InputManager.mouseMove, false);
        } else {
            // pointer lock is no longer active, remove the callback
            document.removeEventListener(`${pointerEventType}move`, InputManager.mouseMove, false);
            document.removeEventListener(`${pointerEventType}down`, InputManager.mouseMove, false);
            document.removeEventListener(`${pointerEventType}up`, InputManager.mouseMove, false);

            State.setCurrent(States.inGameMenu);
        }
    };
    /*
    这段代码定义了一个静态方法 `changeCallback`，用于处理指针锁定状态的变化事件。下面逐行解释它：
    
    ```
    const pointerEventType = Tools.IsSafari() ? "mouse" : "pointer";
    ```
    该行代码根据当前浏览器是否为 Safari，设置 `pointerEventType` 为 `"mouse"` 或 `"pointer"`。
    
    ```
    if (document.pointerLockElement === InputManager._canvas ||
        document.mozPointerLockElement === InputManager._canvas ||
        document.webkitPointerLockElement === InputManager._canvas
    ) {
    ```
    如果当前文档中存在指针锁定的元素，且该元素为 `InputManager._canvas`，则执行以下代码块。
    
    ```
    document.addEventListener(`${pointerEventType}move`, InputManager.mouseMove, false);
    document.addEventListener(`${pointerEventType}down`, InputManager.mouseMove, false);
    document.addEventListener(`${pointerEventType}up`, InputManager.mouseMove, false);
    ```
    添加鼠标移动、按下和松开事件的监听器，调用 `InputManager.mouseMove` 来处理这些事件。
    
    ```
    } else {
    ```
    否则，执行以下代码块。
    
    ```
    document.removeEventListener(`${pointerEventType}move`, InputManager.mouseMove, false);
    document.removeEventListener(`${pointerEventType}down`, InputManager.mouseMove, false);
    document.removeEventListener(`${pointerEventType}up`, InputManager.mouseMove, false);
    ```
    移除鼠标移动、按下和松开事件的监听器，不再处理这些事件。
    
    ```
    State.setCurrent(States.inGameMenu);
    ```
    如果指针锁定状态变化后从锁定状态切换到非锁定状态，这一行代码会将游戏状态切换到 `inGameMenu` 状态。不过这段代码中没有给出 `State` 和 `States` 的定义，无法确定具体实现及其效果。
    
    以上即为该段代码的逐行解释。
    */

    /*
    这是一个用于禁用指针锁定功能的函数。在游戏中，指针锁定通常用于保持鼠标光标在游戏窗口中，方便玩家进行游戏控制。但有些情况下，可能需要解除指针锁定。
    在该函数中，首先检查是否启用了原生的指针锁定（即使用浏览器提供的 requestPointerLock 和 exitPointerLock 函数），且当前输入设备不是触摸屏。如果满足条件，则调用 document.exitPointerLock 函数以解除指针锁定。接着，为画布的点击事件设置一个空函数，以抵消浏览器可能会在退出指针锁定后自动执行的默认操作。
    通过调用该函数，可以在游戏中禁用指针锁定功能，让玩家自由掌控鼠标光标。
    */
    public static disablePointerLock() {
        if (!useNative && !InputManager.isTouch) {
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
            var canvas = InputManager._canvas;
            if (canvas) {
                canvas.onclick = function () { };
            }
        }
    }

    /*
    这是一个用于启用指针锁定功能的函数。在游戏中，指针锁定通常用于保持鼠标光标在游戏窗口中，方便玩家进行游戏控制。
    在该函数中，首先检查是否启用了原生的指针锁定（即使用浏览器提供的requestPointerLock和exitPointerLock函数），且当前输入设备不是触摸屏。如果满足条件，则注册InputManager.changeCallback函数作为pointerlockchange、mozpointerlockchange和webkitpointerlockchange事件的监听器。
    接着，为画布的点击事件设置一个函数，该函数会请求指针锁定，并调用浏览器提供的requestPointerLock、mozRequestPointerLock或webkitRequestPointerLock函数来实现。这将引起浏览器向用户显示一条提示消息，询问是否允许锁定指针。
    通过调用该函数，可以在游戏中启用指针锁定功能，让玩家方便地控制鼠标光标，并提供与游戏交互所需的精准度和响应性。
    */
    public static setupPointerLock() {

        if (!useNative && !InputManager.isTouch) {
            // register the callback when a pointerlock event occurs
            document.addEventListener('pointerlockchange', InputManager.changeCallback, false);
            document.addEventListener('mozpointerlockchange', InputManager.changeCallback, false);
            document.addEventListener('webkitpointerlockchange', InputManager.changeCallback, false);

            // when element is clicked, we're going to request a
            // pointerlock
            var canvas = InputManager._canvas;
            canvas.onclick = function () {
                canvas.requestPointerLock =
                    canvas.requestPointerLock ||
                    canvas.mozRequestPointerLock ||
                    canvas.webkitRequestPointerLock
                    ;

                // Ask the browser to lock the pointer)
                canvas.requestPointerLock();
            };
        }
    }

    dispose() {
        InputManager.disablePointerLock();
        InputManager._scene.onKeyboardObservable.remove(InputManager._keyboardObserver);
    }

}