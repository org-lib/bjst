import { Button, Grid, Checkbox, Control, RadioButton, Slider, StackPanel, TextBlock, Rectangle } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { ArcRotateCamera, Camera, CreateScreenshot, FreeCamera, KeyboardEventTypes, KeyboardInfo, Nullable, Observer, Quaternion, Scene, Vector2, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { Ship } from "../Ship";
import { InputManager } from "../Inputs/Input";
import { GameState } from "./GameState";
import { Recorder } from "../Recorder/Recorder";
import { PlanetBaker } from "../FX/PlanetBaker";
import { Assets } from "../Assets";
import { World } from "../World";
import { Parameters } from "../Parameters";
import { GuiFramework } from "../GuiFramework";
import { roadProceduralTexturePixelShader } from "@babylonjs/procedural-textures/road/roadProceduralTexture.fragment";

export class PhotoMode extends State {
    public ship: Nullable<Ship> = null;
    private _gameCamera: Nullable<Camera> = null;
    private _zeroCamera: Nullable<Camera> = null;
    private _photoCamera: Nullable<Camera> = null;
    private _photoArcRotateCamera: Nullable<ArcRotateCamera> = null;
    private _photoFreeCamera: Nullable<FreeCamera> = null;
    private _scene: Nullable<Scene> = null;
    private _recorder: Nullable<Recorder> | undefined = null;
    private _canvas: Nullable<HTMLCanvasElement> | undefined = null;
    private _hotkeyObservable: Nullable<Observer<KeyboardInfo>> = null;
    public assets: Nullable<Assets> = null;
    private sunCamera: Nullable<VolumetricLightScatteringPostProcess> = null;

    private _renderObserver: Nullable<Observer<Scene>> = null;
    /*
    这段代码是一个关于退出当前状态的功能实现。它首先调用了父类（可能是某个状态类的父类）的 exit 函数来做必要的清理工作。
    然后，它会清除之前设置的后处理效果 _clearPP，将相机切换回原来的 _gameCamera，并且如果有零摄像机 _zeroCamera 的话，也会将场景的激活相机切换回零摄像机。
    接着，它会检测是否注册过热键事件 _hotkeyObservable，如果注册过，则将其移除。然后，它会获取到当前游戏场景，并且移除渲染观察者函数 _renderObserver。
    在 Babylon.js 框架中，场景是游戏中最重要的部分之一，它负责管理所有的 3D 对象、相机、灯光和纹理等。
    因此，在退出状态时，我们需要恢复场景到进入该状态之前的状态以便继续进行游戏。此外，还可以通过注册键盘观察者函数 _hotkeyObservable 来实现对用户输入的响应，例如按下 ESC 键退出当前状态。
    */
    public exit() {
        super.exit();

        this._clearPP();
        if (this._scene && this._canvas) {
            this._photoCamera?.detachControl();
            this._scene.activeCamera = this._gameCamera;
            if (this._scene.activeCameras?.length && this._zeroCamera) {
                this._scene.activeCameras[0] = this._zeroCamera;
            }
        }
        if (this._scene && this._hotkeyObservable) {
            this._scene.onKeyboardObservable.remove(this._hotkeyObservable);
        }

        const scene = GameState.gameSession?.getScene();
        if (scene) {
            scene.onBeforeRenderObservable.remove(this._renderObserver);
        }
    }
    /*
    这段代码是一个关于清除后处理效果的功能实现。它首先会检测是否存在 _photoCamera 和 sunCamera，如果都存在，则会销毁 sunCamera 的 mesh，并将 sunCamera 从 _photoCamera 中移除并销毁。
    Babylon.js 框架中支持多种后处理效果，例如反走样、高斯模糊、颜色校正、辉光和景深等效果，这些效果可以通过 WebGL 的片段着色器（shader）来实现。
    当需要对场景进行后处理时，我们可以创建一个新的相机 _photoCamera，并将其 attachmentRenderTarger 设为 true，这就可以实现基于像素的后处理技术。
    然而，在切换状态时，我们需要清除之前设置的后处理效果，这就可以通过 _clearPP 函数来实现。
    */
    private _clearPP(): void {
        if (this._photoCamera && this.sunCamera) {
            this.sunCamera.mesh.dispose();
            this.sunCamera.dispose(this._photoCamera);
        }
    }

    /*
    这段代码主要是进入babylonjs的PhotoMode，展示了一些UI元素，提供了一些功能。首先判断了GameState.gameSession对象是否存在，如果不存在，直接返回。
    然后获取当前的场景和游戏对象，保存到变量中。之后创建了一个StackPanel和一个Grid，StackPanel用于垂直放置控件，Grid用于放置其他控件。
    添加了一个“h”键监听事件，按下h键时，控制面板和一些控制元素的透明度进行切换。按下空格键，停止播放回放，按下“-”或者“+”键，可以改变相机的半径大小。
    然后创建了一些控件，例如RadioButton、Slider、Checkbox和Button。其中RadioButton用于切换相机类型，Slider用于控制相机距离、旋转等属性，Checkbox用于控制轨迹显示等，Button则用于执行对应的操作。
    最后将Grid添加到了ADT中。
    */
    public enter() {
        console.log("PhotoMode.enter")
        super.enter();
        if (!this._adt) {
            return;
        }

        const scene = GameState.gameSession?.getScene();
        if (!scene) {
            return;
        }

        const game = GameState.gameSession?.getGame();
        if (!game) {
            return;
        }

        this._scene = scene;
        this._gameCamera = (scene.activeCameras?.length && scene.activeCameras[0]) ? scene.activeCameras[0] : scene.activeCamera;
        this._canvas = GameState.gameSession?.getCanvas();
        this._recorder = GameState.gameSession?.getGame()?.getRecorder();
        if (!this._recorder) {
            return;
        }
        if (scene.activeCameras) {
            this._zeroCamera = scene.activeCameras[0];
        }

        InputManager.disablePointerLock();

        var panel = new StackPanel();
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        const grid = new Grid();
        grid.paddingBottom = "100px";
        grid.paddingLeft = "100px";
        GuiFramework.formatButtonGrid(grid);
        grid.addControl(panel, 0, 0);
        const controlsGrid: Grid = GuiFramework.createScreenshotGrid();
        grid.addControl(controlsGrid, 0, 0)

        var _this = this;

        this._hotkeyObservable = scene.onKeyboardObservable.add((kbInfo: any) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.key == 'h') {
                        panel.alpha = (panel.alpha === 0) ? 1 : 0;
                        controlsGrid.alpha = (controlsGrid.alpha === 0) ? 1 : 0;
                    } else if (kbInfo.event.key == ' ') {
                        _this._recorder?.stop();
                        panel.alpha = 1;
                        controlsGrid.alpha = 1;
                    } else if (kbInfo.event.key == '-') {
                        (_this._photoCamera as ArcRotateCamera).radius *= 0.99;
                    } else if (kbInfo.event.key == '+') {
                        (_this._photoCamera as ArcRotateCamera).radius *= 1.01;
                    }
                    break;
            }
        });

        this._renderObserver = scene.onBeforeRenderObservable.add(() => {
            if (this.sunCamera && this._photoCamera) {
                World.updateSunPostProcess(this._photoCamera.position, this.sunCamera.mesh);
            }
        });

        GuiFramework.createScreenshotText(controlsGrid, new Vector2(0, 1), "'h' to toggle UI", true);
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(1, 1), "Space to stop playback", true);
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(2, 0), "Ally Trails");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(3, 0), "Enemy Trails");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(4, 0), "Rotate Camera");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(5, 0), "Free Camera");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(6, 0), "Distance");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(7, 0), "Roll");
        GuiFramework.createScreenshotText(controlsGrid, new Vector2(8, 0), "Frame");

        const rotateCam: RadioButton = GuiFramework.createRadioButton(true);
        rotateCam.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rotateCam.onIsCheckedChangedObservable.add(function (state) {
            if (state) {
                _this._bindArcRotateCamera();
            }
        });
        controlsGrid.addControl(rotateCam, 4, 1);

        const freeCam: RadioButton = GuiFramework.createRadioButton();
        freeCam.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        freeCam.onIsCheckedChangedObservable.add(function (state) {
            if (state) {
                _this._bindFreeCamera();
            }
        });
        controlsGrid.addControl(freeCam, 5, 1);

        const frameSlider: Slider = GuiFramework.createSlider(2, 50, 10);
        frameSlider.width = 0.9;
        controlsGrid.addControl(frameSlider, 8, 1);
        let framesAvailable = this._recorder.getAvailableFrames();
        framesAvailable = framesAvailable ? framesAvailable : 0;
        frameSlider.maximum = framesAvailable - 1;
        frameSlider.value = framesAvailable - 1;
        frameSlider.step = 1;
        frameSlider.onValueChangedObservable.add(function (value) {
            _this._recorder?.applyFrame(value);
        });

        const distanceSlider: Slider = GuiFramework.createSlider(2, 50, 10);
        distanceSlider.width = 0.9;
        controlsGrid.addControl(distanceSlider, 6, 1);
        distanceSlider.onValueChangedObservable.add(function (value) {
            (_this._photoCamera as ArcRotateCamera).radius = value;
        });

        const rollSlider: Slider = GuiFramework.createSlider(0, Math.PI * 2);
        rollSlider.width = 0.9;
        controlsGrid.addControl(rollSlider, 7, 1);
        rollSlider.onValueChangedObservable.add(function (value) {
            (_this._photoCamera as ArcRotateCamera).upVector = new Vector3(Math.cos(value), Math.sin(value), 0);
        });

        const allyTrailsCheck: Checkbox = GuiFramework.createCheckbox();
        allyTrailsCheck.isChecked = true;
        allyTrailsCheck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        allyTrailsCheck.onIsCheckedChangedObservable.add(function (value) {
            if (_this._recorder) {
                _this._recorder._trailVisibilityMask ^= 1;
                _this._recorder.refreshFrame();
            }
        });
        controlsGrid.addControl(allyTrailsCheck as Checkbox, 2, 1);
        const enemyTrailsCheck: Checkbox = GuiFramework.createCheckbox();
        enemyTrailsCheck.isChecked = true;
        enemyTrailsCheck.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        enemyTrailsCheck.onIsCheckedChangedObservable.add(function (value) {
            if (_this._recorder) {
                _this._recorder._trailVisibilityMask ^= 2;
                _this._recorder.refreshFrame();
            }
        });
        controlsGrid.addControl(enemyTrailsCheck as Checkbox, 3, 1);

        this._addPlaybackButton(1, panel, controlsGrid);
        this._addPlaybackButton(0.5, panel, controlsGrid);
        this._addPlaybackButton(0.25, panel, controlsGrid);
        this._addPlaybackButton(0.125, panel, controlsGrid);
        GuiFramework.addButton("Stop", panel).onPointerDownObservable.add(function (info) {
            _this._recorder?.stop();
        });

        GuiFramework.addButton("Screen shot", panel).onPointerDownObservable.add(function (info) {
            panel.alpha = 0;
            controlsGrid.alpha = 0;
            if (_this._scene && _this._photoCamera) {
                CreateScreenshot(_this._scene.getEngine(), _this._photoCamera, 1920, () => {
                    panel.alpha = 1;
                    controlsGrid.alpha = 1;
                }, "image/png", true);
            }
        });

        GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function (info) {
            State.setCurrent(States.inGameMenu);
        });

        this._adt.addControl(grid);

        // arc rotate camera
        const position = (game.humanPlayerShips.length && game.humanPlayerShips[0]) ? game.humanPlayerShips[0].root.position : new Vector3(0, 0, 0);
        this._photoArcRotateCamera = new ArcRotateCamera("cam", 0.5, 0.5, 10, position, scene);
        this._photoFreeCamera = new FreeCamera("cam", position.clone(), scene);
        this._bindArcRotateCamera();
        this._recorder?.applyFrame(framesAvailable - 1);
    }

    /*
    这段代码是在babylonjs的PhotoMode中添加了一个播放回放的按钮，并且提供了不同速度的选择。_addPlaybackButton是一个私有方法，接收三个参数：speed表示回放速度，panel和controlsGrid是用于UI显示的控制元素。
    在该方法内部，首先创建了一个“Play speed”名字的Button，并添加了点击事件监听。
    当点击该Button时，控制面板和一些控制元素的透明度进行切换，然后调用_recorder对象的playback方法进行回放，传入了回放速度和回调函数。
    回放结束后，再次改变控制元素的透明度，将Button返回。
    使用该方法需要先在PhotoMode中创建对应的控制元素，并且创建_recorder对象。然后根据需求可以调用_addPlaybackButton方法创建不同回放速度的Button，当用户点击Button时，就会执行回放操作。
    */
    private _addPlaybackButton(speed: number, panel: StackPanel, controlsGrid: Grid): Button {
        var _this = this;
        var button = GuiFramework.addButton("Play " + speed, panel);
        button.onPointerDownObservable.add(function (info) {
            panel.alpha = 0;
            controlsGrid.alpha = 0;

            _this._recorder?.playback(speed, () => {
                panel.alpha = 1;
                controlsGrid.alpha = 1;
            });
        });
        return button;
    }

    /*
    这段代码是在babylonjs的 PhotoMode 中绑定 ArcRotateCamera 相机。 _bindArcRotateCamera 方法没有参数，首先调用了 _clearPP 方法，该方法作用是清除之前添加的 PostProcess。
    然后将 _photoCamera 对象指向 _photoArcRotateCamera 对象，表示当前使用的相机类型为 ArcRotateCamera 。如果场景存在，将 _activeCamera 设置为 _photoCamera ，将 _pictureCamera 设置为 _photoCamera 。
    再对 _photoCamera 进行 attachControl 操作，表示允许用户控制相机。最后，根据 _photoCamera 和 assets 对象创建太阳后处理，保存到 sunCamera 对象中。
    使用该方法需要先在 PhotoMode 中创建 _photoArcRotateCamera 对象，并且将该方法添加到对应的控件中。当用户切换相机类型时，就会执行该方法，切换相机类型并进行一些必要的操作。
    */
    private _bindArcRotateCamera(): void {
        this._clearPP();
        this._photoCamera = this._photoArcRotateCamera;
        if (this._scene) {
            this._scene.activeCamera = this._photoCamera;
            if (this._scene.activeCameras?.length && this._photoCamera) {
                this._scene.activeCameras[0] = this._photoCamera;
            }
            (this._photoCamera as ArcRotateCamera).attachControl(this._canvas, true);

            if (this._photoCamera && this.assets) {
                this.sunCamera = PlanetBaker.CreateSunPostProcess(this._photoCamera, this._scene, this.assets);
            }
        }
    }

    /*
    这段代码是在babylonjs的PhotoMode中绑定FreeCamera相机。_bindFreeCamera方法没有参数，首先调用了_clearPP方法，该方法作用是清除之前添加的PostProcess。
    然后将_photoCamera对象指向_photoFreeCamera对象，表示当前使用的相机类型为FreeCamera。如果场景存在，将_activeCamera设置为_photoCamera，将_pictureCamera设置为_photoCamera。
    再对_photoCamera进行attachControl操作，表示允许用户控制相机。最后，根据_photoCamera和assets对象创建太阳后处理，保存到sunCamera对象中。
    使用该方法需要先在PhotoMode中创建_photoFreeCamera对象，并且将该方法添加到对应的控件中。当用户切换相机类型时，就会执行该方法，切换相机类型并进行一些必要的操作。
    */
    private _bindFreeCamera(): void {
        this._clearPP();
        this._photoCamera = this._photoFreeCamera;
        if (this._scene) {
            this._scene.activeCamera = this._photoCamera;
            if (this._scene.activeCameras?.length && this._photoCamera) {
                this._scene.activeCameras[0] = this._photoCamera;
            }
            (this._photoCamera as FreeCamera).attachControl(this._canvas, true);

            if (this._photoCamera && this.assets) {
                this.sunCamera = PlanetBaker.CreateSunPostProcess(this._photoCamera, this._scene, this.assets);
            }
        }
    }
}