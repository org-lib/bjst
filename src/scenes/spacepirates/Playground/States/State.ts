import { AdvancedDynamicTexture, StackPanel, TextBlock } from "@babylonjs/gui";
import { Nullable, Scene } from "@babylonjs/core";
import { GameSession } from "./GameSession";
import { GameState } from "./GameState";
import { Parameters } from "../Parameters";

/*
这段代码定义了一个State类，用于管理游戏中的状态。该类有以下属性和方法：

1. currentState：静态属性，表示当前状态
2. _adt：AdvancedDynamicTexture对象，表示UI画布
3. exit：退出该状态，清除所有UI
4. enter：进入该状态，创建UI，并监听窗口变化事件
5. _addText：添加文本到指定panel
6. _resizeListener：窗口变化事件处理函数

在进入某个状态时，调用enter方法创建对应的UI；在退出某个状态时，调用exit方法清除UI。此外，该类还提供了_addText方法用于方便地向指定的StackPanel添加文本，_resizeListener方法用于处理窗口变化事件。

State类可以作为游戏中任何状态的基类，派生出不同的子类来管理不同的状态。通过静态方法setCurrent来切换当前状态。当切换状态时，会先调用上一个状态的exit方法，然后调用新状态的enter方法。

这段代码是基于Babylon.js游戏引擎创建的一个状态管理类State。它使用了引擎内置的GUI模块，导入了AdvancedDynamicTexture、StackPanel和TextBlock类。

该类实现了以下功能：

1. 管理当前状态：静态属性currentState用于标识当前状态，setCurrent方法用于设置当前状态。
2. 创建UI：进入到新的状态时，通过enter方法创建UI，并监听窗口变化事件以适应不同分辨率。退出状态时，通过exit方法清除所有UI。
3. 辅助函数：提供一个_addText方法用于向指定的StackPanel中添加文本。
4. 响应窗口变化：提供_resizeListener方法用于响应窗口大小变化事件，修改UI适应新的窗口大小。

当调用setCurrent方法时，会先检查是否需要切换状态。如果需要进行状态切换，则先调用上一个状态的exit方法清除UI，然后将当前状态设置为新状态，并调用新状态的enter方法创建新的UI。

可以将State类作为游戏中任何状态的基类，定义不同的子类来管理不同的状态。在子类中重新实现enter和exit方法，同时可以利用_addText方法自定义UI。
*/
export class State {
    static currentState: Nullable<State> = null;
    protected _adt: Nullable<AdvancedDynamicTexture> = null;

    constructor() {
        this._resizeListener = this._resizeListener.bind(this);
    }

    public static setCurrent(newState: State): void {
        if (this.currentState === newState) {
            return;
        }
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = newState;
        if (this.currentState) {
            this.currentState.enter();
        }
    }

    public exit() {
        if (this._adt) {
            this._adt.dispose();
            window.removeEventListener("resize", this._resizeListener);
        }
    }

    public enter() {
        console.log("State.enter")
        const scene = GameState.gameSession?.getScene();
        this._adt = AdvancedDynamicTexture.CreateFullscreenUI("Main", true, scene);
        this._adt.layer!.layerMask = 0x10000000;
        this._adt.idealHeight = 1440;
        window.addEventListener("resize", this._resizeListener);
    }

    // helpers
    protected _addText(text: string, panel: StackPanel): void {
        var textBlock = new TextBlock();
        textBlock.text = text.toUpperCase();
        textBlock.width = 0.6;
        textBlock.height = "20px";
        textBlock.color = "white";
        Parameters.setFont(textBlock, true);
        panel.addControl(textBlock);
    }

    private _resizeListener() {
        if (this._adt && this._adt.getScene()) {
            this._adt.scaleTo(this._adt.getScene()!.getEngine().getRenderWidth(), this._adt.getScene()!.getEngine().getRenderHeight());
        }
    }
}