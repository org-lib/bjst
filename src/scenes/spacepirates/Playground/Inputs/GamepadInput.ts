import { DualShockButton, DualShockPad, Gamepad, GamepadManager, Xbox360Button, Xbox360Pad, _UpdateRGBDAsync } from "@babylonjs/core";
import { Settings } from "../../Settings";
import { Parameters } from "../Parameters";
import { State } from "../States/State";
import { States } from "../States/States";
import { Input, InputManager } from './Input';

//  Gamepad 的意思是操纵杆

/*

GamepadManager.onGamepadConnectedObservable`是Babylon.js中的一个事件，它会在游戏手柄连接到计算机时被触发。
使用该事件，可以监听游戏手柄的连接状态，并在连接或断开时执行相应的操作。


`gamepad.leftStick`是Babylon.js游戏引擎中的一个属性，用于获取连接到计算机的游戏手柄的左摇杆的当前状态。返回值是一个包含`x`和`y`值的二元组，表示左摇杆的当前位置。`x`和`y`的值在-1到1之间，其中-1表示最左或最下，1表示最右或最上，0表示中心。

使用`gamepad.leftStick`属性时，需要先创建一个GamepadManager对象，并在需要的地方调用`GamepadManager.onGamepadConnectedObservable`方法来监听游戏手柄的连接事件。当游戏手柄连接时，Babylon.js会自动创建一个Gamepad对象，并将其添加到GamepadManager中。然后，我们可以在游戏循环中使用`gamepad.leftStick`来获取左摇杆的当前状态，从而控制游戏中的角色或摄像机等。

*/


/*
这段代码定义了一个名为 `GamepadInput` 的类，用于处理游戏手柄输入。下面是各个成员的解释和使用：
- `public static gamepads = new Array<GamepadInput>();` 是 `GamepadInput` 类的静态变量，用于存储所有已连接的游戏手柄的实例。默认值为一个空数组。
- `_gamepad: Gamepad;` 是 `GamepadInput` 类的实例变量，表示与该实例相关联的游戏手柄对象。
- `_input: Input;` 是 `GamepadInput` 类的实例变量，表示该实例要控制的游戏输入对象。
- `public static initialize()` 是一个静态方法，用于初始化类的静态变量并开始监听游戏手柄连接/断开事件。当有游戏手柄连接时，该方法会创建一个新的 `GamepadInput` 实例并将其添加到 `GamepadInput.gamepads` 数组中。
当游戏手柄断开时，该方法会查找并删除与该游戏手柄关联的 `GamepadInput` 实例。
- `constructor(gamepad: Gamepad, input: Input)` 是 `GamepadInput` 类的构造函数。它使用传入的游戏手柄和游戏输入对象来初始化类的实例变量。
- `public tick()` 是 `GamepadInput` 类的实例方法，用于在每一帧更新游戏输入。它检查游戏手柄的状态，并相应地更新游戏输入的各个属性。例如，当左摇杆移动时，它会计算并设置 `dx` 和 `dy` 属性的值。
- `public dispose()` 是 `GamepadInput` 类的实例方法，用于释放类的资源。在这个例子中，该函数为空。
总体来说，这段代码使用了 Babylon.js 的 `GamepadManager` 类来监听游戏手柄连接/断开事件，并通过一个名为 `tick()` 的方法实现了对游戏手柄输入的检测和响应。这个类可以帮助游戏开发者实现对游戏手柄的控制。
*/
export class GamepadInput {
    public static gamepads = new Array<GamepadInput>();
    _gamepad: Gamepad;
    _input: Input;
    public static initialize() {
        const gamepadManager = new GamepadManager();
        // 监听游戏手柄连接事件
        gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
            GamepadInput.gamepads.push(new GamepadInput(gamepad, InputManager.input));
            console.log('gamepad connected');
        })
        // 监听游戏手柄断开事件
        gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state) => [
            GamepadInput.gamepads.forEach(gm => {
                if (gm._gamepad == gamepad) {
                    gm.dispose();
                }
            })
        ])

    }
    // can pass in any input to control here
    constructor(gamepad: Gamepad, input: Input) {
        this._gamepad = gamepad;
        this._input = input;
    }
    /*
    这是一个关于飞行游戏控制器的 tick 函数，该函数在每个游戏循环中被调用以更新游戏状态。该函数使用了输入设备（如手柄）中的信息来更新相应的输入状态，例如飞机的转向、加速和开火等操作。
    在该函数中，首先获取了输入设备的信息（例如左摇杆和右摇杆的位置），然后将其与一些常数值相乘，来得到对应的输入速率，同时还考虑了灵敏度设置。如果设置了反转Y轴操作，则将其dy值反转。在限制输入范围后，根据右摇杆的位置来设置break和burst标志，表示用户是否正在刹车或者加速。
    接下来，如果检测到使用Xbox360Pad手柄，则根据它的不同按钮设置射击、推弹、Immelmann等动作，并通过读取开始按钮来切换到游戏菜单中。而如果检测到使用DualShockPad手柄，则根据其不同按钮进行类似的设置，并通过读取options按钮来切换到游戏菜单中。
    通过调用该tick函数，在游戏循环中更新用户输入状态，使游戏控制器能够快速响应用户的输入动作。该函数提供了一种方便的方式来解析各种不同手柄的输入信息，从而为游戏提供更加可靠的用户输入响应。
    */
    public tick() {
        const input = this._input;
        input.dx = this._gamepad.leftStick.x * Parameters.playerTurnRate * Settings.sensitivity;
        input.dy = this._gamepad.leftStick.y * Parameters.playerTurnRate * Settings.sensitivity;
        if (Settings.invertY) {
            input.dy *= -1;
        }
        input.constrainInput();
        input.breaking = (this._gamepad.rightStick.y > 0.3);
        input.burst = (this._gamepad.rightStick.y < -0.3);
        if (this._gamepad instanceof Xbox360Pad) {
            const pad = this._gamepad as Xbox360Pad;
            input.shooting = pad.rightTrigger != 0;
            input.launchMissile = pad.leftTrigger != 0;
            input.immelmann = pad.buttonLeftStick != 0;
            if (pad.buttonStart) {
                State.setCurrent(States.inGameMenu);
            }
        }
        if (this._gamepad instanceof DualShockPad) {
            const pad = this._gamepad as DualShockPad;
            input.shooting = pad.buttonR1 != 0;
            input.launchMissile = pad.rightTrigger != 0;
            input.immelmann = pad.buttonLeftStick != 0;
            if (pad.buttonOptions) {
                State.setCurrent(States.inGameMenu);
            }
        }
    }
    /*
    这段代码是一个 `tick` 方法，用于每一帧更新游戏中的输入。下面逐行解释它：
    
    ```const input = this._input;```
    该行代码定义了变量 `input`，该变量引用 `_input` 属性上存储的输入信息。
    
    ```
    input.dx = this._gamepad.leftStick.x * Parameters.playerTurnRate * Settings.sensitivity;
    input.dy = this._gamepad.leftStick.y * Parameters.playerTurnRate * Settings.sensitivity;
    ```
    这两行代码根据当前游戏手柄的左摇杆方向设置输入信息。通过将左摇杆在x和y方向上的值与 `playerTurnRate` 和 `sensitivity` 常数相乘得出 `dx` 和 `dy` 的值。
    
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
    input.breaking = (this._gamepad.rightStick.y > 0.3);
    input.burst = (this._gamepad.rightStick.y < -0.3);
    ```
    这两行代码根据右摇杆在y轴方向上的值来设置 `breaking` 和 `burst` 的值，用于刹车和加速。
    
    ```
    if (this._gamepad instanceof Xbox360Pad) {
        // ...
    }
    ```
    这里使用 `instanceof` 判断当前游戏手柄是否是 Xbox 360 手柄类型，如果是则会针对 Xbox 360 手柄上的按键映射设置相应的输入值。
    
    ```
    if (this._gamepad instanceof DualShockPad) {
        // ...
    }
    ```
    同样的，这里使用 `instanceof` 判断当前游戏手柄是否是 DualShock 手柄类型，如果是则会针对 DualShock 手柄上的按键映射设置相应的输入值。
    
    以上即为该段代码的逐行解释。
    */
    public dispose() {

    }
}