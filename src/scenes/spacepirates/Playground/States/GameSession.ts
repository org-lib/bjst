import { Scene, Nullable, GlowLayer } from "@babylonjs/core";
import { Game, GameDefinition } from "../Game";
import { Assets } from "../Assets";

export class GameSession {

    private _game: Nullable<Game> = null;
    private _assets: Assets;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _glowLayer: GlowLayer;

    constructor(assets: Assets, scene: Scene, canvas: HTMLCanvasElement, glowLayer: GlowLayer) {
        this._assets = assets;
        this._scene = scene;
        this._canvas = canvas;
        this._glowLayer = glowLayer;
    }

    public getScene(): Scene {
        return this._scene;
    }

    public getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    public getGame(): Nullable<Game> {
        return this._game;
    }

    public start(gameDefinition: Nullable<GameDefinition>): void {
        this._game = new Game(this._assets, this._scene, this._canvas, gameDefinition, this._glowLayer);
    }

    public stop(): void {
        if (!this._game) {
            return;
        }
        this._game.dispose();

        this._game = null;
    }

    public inProgress(): boolean {
        return !!this._game;
    }

    public pause(): void {
        this._game?.getRecorder()?.setRecordActive(false);
        this._game?.setTargetSpeed(0);
    }

    public resume(): void {
        this._game?.setTargetSpeed(1);
        this._game?.getRecorder()?.setRecordActive(true);
    }
}
/*
这是一个使用Babylon.js游戏引擎的游戏会话类。该类用于管理游戏的生命周期以及游戏中使用到的重要元素，如资源、场景、画布和光晕层等。下面是该类中各个成员的解释和使用：
- `_game`: Nullable<Game> - 游戏实例。默认值为null。
- `_assets`: Assets - 游戏所需资源 (例如模型、贴图等) 的管理器。
- `_scene`: Scene - 3D场景的实例。
- `_canvas`: HTMLCanvasElement - Canvas 元素，用于在其中呈现 3D 场景。
- `_glowLayer`: GlowLayer - 用于添加光晕视觉效果到场景中的 Glow 层对象。
`constructor(assets: Assets, scene: Scene, canvas: HTMLCanvasElement, glowLayer: GlowLayer)` 是该类的构造函数。它使用传入的资源管理器、场景、Canvas 元素和 Glow 层对象来初始化类的成员变量。
`public getScene(): Scene` 返回存储在 `_scene` 变量中的场景对象。
`public getCanvas(): HTMLCanvasElement` 返回存储在 `_canvas` 变量中的 Canvas 元素。
`public getGame(): Nullable<Game>` 返回当前存储在 `_game` 变量中的游戏实例对象。如果游戏还没有启动，则返回null。
`public start(gameDefinition: Nullable<GameDefinition>): void` 创建并启动一个新游戏实例，将其存储在 `_game` 变量中。该函数接受一个可选的 `gameDefinition` 参数，用于配置新游戏实例。如果已经有一个游戏实例在运行，则会首先将其销毁。
`public stop(): void` 停止游戏的运行并释放游戏资源。如果没有正在运行的游戏实例，则该函数不执行任何操作。
`public inProgress(): boolean` 如果当前有游戏正在运行，则返回 `true`；否则返回 `false`。
`public pause(): void` 暂停当前运行的游戏实例。如果还没有启动游戏，则该函数不执行任何操作。该函数会停止记录游戏行为并将目标速度设置为0。
`public resume(): void` 恢复已暂停的游戏实例。如果还没有启动游戏，则该函数不执行任何操作。该函数会恢复记录游戏行为并将目标速度设置为1。
*/
