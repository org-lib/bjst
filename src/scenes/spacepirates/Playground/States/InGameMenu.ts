import { Control, Button, Grid, StackPanel } from "@babylonjs/gui";
import { InputManager } from "../Inputs/Input";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Parameters } from "../Parameters";
import { GuiFramework } from "../GuiFramework";

export class InGameMenu extends State {
  public exit() {
    super.exit();
  }

  /*
  这段代码是一个“进入游戏菜单”的方法，根据屏幕方向不同展示不同的菜单样式。其中使用了 Babylon.js 中的 GUI 控件来实现视觉效果。
  
  具体来说，它完成以下操作：
  
  1. 在控制台输出 "InGameMenu.enter"；
  2. 调用父类的 enter() 方法；
  3. 如果没有创建 AdvancedDynamicTexture 对象 _adt，则直接返回，否则继续执行下面的逻辑；
  4. 暂停游戏（GameState.gameSession?.pause()）；
  5. 如果屏幕方向为横屏，则创建一个 StackPanel（垂直排列子元素的容器）和一个 Grid（网格布局），并将 Grid 添加到 _adt 中；
  6. 在 StackPanel 中添加四个按钮，分别是“继续”、“选项”、“拍照模式”和“返回主菜单”，并为每个按钮添加响应函数；
  7. 如果屏幕方向为竖屏，则创建一个 StackPanel 和一个 Grid，并将 StackPanel 添加到 Grid 的第二行中，并将 Grid 添加到 _adt 中；
  8. 在 StackPanel 中添加三个按钮（不包括拍照模式按钮），并为每个按钮添加响应函数。
  
  使用时需要调用 InGameMenu 类的 enter() 方法，其中还需提供一个 AdvancedDynamicTexture 对象 _adt。菜单的具体样式和按钮的响应逻辑可以根据实际需求进行修改。
  */
  public enter() {
    console.log("InGameMenu.enter")
    super.enter();

    if (!this._adt) {
      return;
    }

    GameState.gameSession?.pause();

    if (GuiFramework.isLandscape) {
      GuiFramework.createBottomBar(this._adt);
      var panel = new StackPanel();
      panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      let grid = new Grid();
      grid.paddingBottom = "100px";
      grid.paddingLeft = "100px";
      GuiFramework.formatButtonGrid(grid);
      grid.addControl(panel, 0, 0);

      GuiFramework.addButton("Continue", panel).onPointerDownObservable.add(
        function (info) {
          InputManager.setupPointerLock();
          State.setCurrent(States.gameState);
        }
      );

      GuiFramework.addButton("Options", panel).onPointerDownObservable.add(
        function (info) {
          States.options.backDestination = States.inGameMenu;
          State.setCurrent(States.options);
        }
      );

      const game = GameState.gameSession?.getGame();
      if (
        game &&
        game.humanPlayerShips.length == 1 &&
        Parameters.recorderActive
      ) {
        GuiFramework.addButton("Photo mode", panel).onPointerDownObservable.add(
          function (info) {
            State.setCurrent(States.photoMode);
          }
        );
      }

      GuiFramework.addButton("Back to menu", panel).onPointerDownObservable.add(
        function (info) {
          GameState.gameSession?.stop();
          State.setCurrent(States.main);
        }
      );

      this._adt.addControl(grid);

    } else {
      var panel = new StackPanel();
      panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      panel.paddingBottom = "100px";
      let grid = new Grid();
      grid.addRowDefinition(0.2, false);
      grid.addRowDefinition(0.8, false);
      grid.addControl(panel, 1, 0);

      GuiFramework.addButton("Continue", panel).onPointerDownObservable.add(
        function (info) {
          InputManager.setupPointerLock();
          State.setCurrent(States.gameState);
        }
      );

      GuiFramework.addButton("Options", panel).onPointerDownObservable.add(
        function (info) {
          States.options.backDestination = States.inGameMenu;
          State.setCurrent(States.options);
        }
      );

      const game = GameState.gameSession?.getGame();
      if (
        game &&
        game.humanPlayerShips.length == 1 &&
        Parameters.recorderActive &&
        GuiFramework.isLandscape
      ) {
        GuiFramework.addButton("Photo mode", panel).onPointerDownObservable.add(
          function (info) {
            State.setCurrent(States.photoMode);
          }
        );
      }

      GuiFramework.addButton("Back to menu", panel).onPointerDownObservable.add(
        function (info) {
          GameState.gameSession?.stop();
          State.setCurrent(States.main);
        }
      );

      this._adt.addControl(grid);
    }

  }
}
