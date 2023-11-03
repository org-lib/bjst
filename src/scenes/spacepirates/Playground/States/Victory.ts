import { Control, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GameState } from "./GameState";
import { InputManager } from "../Inputs/Input";
import { Nullable } from "@babylonjs/core";
import { Ship, Statistics } from "../Ship";
import { GuiFramework } from "../GuiFramework";


/*
这段代码是Babylon.js游戏引擎中的一个状态类。该状态名为“Victory”，表示游戏胜利的状态。

在代码中可以看到，它继承了“State”类，并添加了一个名为“ship”的成员变量，类型为“Nullable<Ship>”。可以看出，这个状态类与“Ship”有关。

在enter()方法中，如果已有ADT对象，则会暂停游戏，并禁用输入管理器的指针锁定。然后，该代码使用GuiFramework创建了一个带有胜利统计数据的面板，包括“Damage dealt”、“Time of battle”、“Accuracy”等等。同时，在GUI中也添加了“Next Battle”和“Main menu”按钮，用于进入下一场战斗或回到主菜单。

如果当前设备是横向布局，则创建一个有底部栏的网格面板，并将上述内容添加到其中。如果当前设备是纵向布局，则创建一个与此相似的网格面板，并将内容添加到其中。

此外，还覆盖了基类的exit()方法，在此处没有实现具体的功能。

综上所述，该代码是实现Babylon.js游戏引擎中一个游戏胜利状态所需的GUI相关内容以及与游戏逻辑相关的处理。
*/
export class Victory extends State {
    public ship: Nullable<Ship> = null;
    public exit() {
        super.exit();
    }

    public enter() {
        console.log("Victory.enter")
        super.enter();
        if (!this._adt) {
            return;
        }
        GameState.gameSession?.pause();
        InputManager.disablePointerLock();

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            let stats = GuiFramework.createRecapGrid();
            let panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            let panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Victory", panelGrid);
            grid.addControl(stats, 0, 1);

            const splashText = GuiFramework.createSplashText("All your base are belong to us!");
            stats.addControl(splashText, 0, 0);

            const statsGrid = GuiFramework.createStatsGrid();
            stats.addControl(statsGrid, 1, 0);

            if (this.ship && this.ship.statistics) {
                const s = this.ship.statistics;
                GuiFramework.createParameter(statsGrid, "Damage dealt", GuiFramework.createStatText(s.damageDealt as unknown as string));
                GuiFramework.createParameter(statsGrid, "Damage taken", GuiFramework.createStatText(s.damageTaken as unknown as string));
                GuiFramework.createParameter(statsGrid, "Ships destroyed", GuiFramework.createStatText(s.shipsDestroyed as unknown as string));
                let minutes = Math.floor(Math.round(s.timeOfBattle / 1000) / 60);
                let seconds = Math.floor((Math.round(s.timeOfBattle / 1000) / 60 - minutes) * 60);
                GuiFramework.createParameter(statsGrid, "Time of battle", GuiFramework.createStatText(minutes + " min " + seconds + " sec" as unknown as string));
                GuiFramework.createParameter(statsGrid, "Shots fired", GuiFramework.createStatText(s.shotFired as unknown as string));
                let accuracy: string = (s.shotFired > 0) ? Math.round((s.shotHitting / s.shotFired) * 100) + "%" as unknown as string : "0%";
                GuiFramework.createParameter(statsGrid, "Accuracy", GuiFramework.createStatText(accuracy));
                GuiFramework.createParameter(statsGrid, "Missiles fired", GuiFramework.createStatText(s.missilesFired as unknown as string));
                GuiFramework.createParameter(statsGrid, "Allies Asteroid Crash", GuiFramework.createStatText(Statistics.alliesCrash as unknown as string));
                GuiFramework.createParameter(statsGrid, "Enemies Asteroid Crash", GuiFramework.createStatText(Statistics.enemiesCrash as unknown as string));
            }

            GuiFramework.addButton("Next Battle", panel).onPointerDownObservable.add(function (info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.gameState);
            });

            GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function (info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.main);
            });

            this._adt.addControl(grid);

        } else {
            let panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            panel.paddingBottom = "100px";
            let grid = new Grid();
            grid.addRowDefinition(0.2, false);
            grid.addRowDefinition(0.5, false);
            grid.addRowDefinition(0.3, false);
            grid.addControl(panel, 2, 0);
            let textBlock = new TextBlock("", "VICTORY");
            GuiFramework.setFont(textBlock, true, true);
            textBlock.fontSize = 35;
            textBlock.color = "#a6fffa";
            textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, 0, 0);

            const statsGrid = GuiFramework.createStatsGrid();
            grid.addControl(statsGrid, 1, 0);

            if (this.ship && this.ship.statistics) {
                const s = this.ship.statistics;
                GuiFramework.createParameter(statsGrid, "Damage dealt", GuiFramework.createStatText(s.damageDealt as unknown as string));
                GuiFramework.createParameter(statsGrid, "Damage taken", GuiFramework.createStatText(s.damageTaken as unknown as string));
                GuiFramework.createParameter(statsGrid, "Ships destroyed", GuiFramework.createStatText(s.shipsDestroyed as unknown as string));
                let minutes = Math.floor(Math.round(s.timeOfBattle / 1000) / 60);
                let seconds = Math.floor((Math.round(s.timeOfBattle / 1000) / 60 - minutes) * 60);
                GuiFramework.createParameter(statsGrid, "Time of battle", GuiFramework.createStatText(minutes + " min " + seconds + " sec" as unknown as string));
                GuiFramework.createParameter(statsGrid, "Shots fired", GuiFramework.createStatText(s.shotFired as unknown as string));
                let accuracy: string = (s.shotFired > 0) ? Math.round((s.shotHitting / s.shotFired) * 100) + "%" as unknown as string : "0%";
                GuiFramework.createParameter(statsGrid, "Accuracy", GuiFramework.createStatText(accuracy));
                GuiFramework.createParameter(statsGrid, "Missiles fired", GuiFramework.createStatText(s.missilesFired as unknown as string));
                GuiFramework.createParameter(statsGrid, "Allies Asteroid Crash", GuiFramework.createStatText(Statistics.alliesCrash as unknown as string));
                GuiFramework.createParameter(statsGrid, "Enemies Asteroid Crash", GuiFramework.createStatText(Statistics.enemiesCrash as unknown as string));
            }

            GuiFramework.addButton("Next Battle", panel).onPointerDownObservable.add(function (info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.gameState);
            });

            GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function (info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.main);
            });

            this._adt.addControl(grid);
        }
    }
    /*
这段代码定义了一个名为Victory的类，继承自State类。Victory类中包含了一个可为空的Ship类型的ship变量，并且定义了enter()和exit()两个方法。

当进入Victory状态时，会执行enter()方法。首先打印出“Victory.enter”的信息，并调用父类的enter()方法。如果_adt不存在，则直接返回。然后暂停GameState的gameSession，并禁用InputManager的pointer lock功能。

接下来判断屏幕是否为横屏模式，如果是，则创建底部工具栏（bottom bar），并创建战斗回顾（recap grid）。使用StackPanel和Grid布局将这些控件组合在一起。再创建标题为“Victory”的面板，添加到grid的第二列中。
随后创建控制器的统计数据表格，并添加到stats中。如果存在ship和ship.statistics，则将其属性值显示在统计数据表格中。接着创建“Next Battle”和“Main menu”按钮，并添加到面板中。最后将grid添加到_adt中。

如果屏幕不是横屏模式，则创建一个垂直方向的面板，并将其添加到grid的第三行中。创建一个TextBlock，用于显示“VICTORY”字样，并设置其字体大小和颜色等属性。将textBlock添加到grid的第一行。
接着创建控制器的统计数据表格，并添加到grid的第二行。如果存在ship和ship.statistics，则将其属性值显示在统计数据表格中。最后创建“Next Battle”和“Main menu”按钮，并添加到面板中。最后将grid添加到_adt中。

当退出Victory状态时，会执行exit()方法，该方法调用了父类的exit()方法。
*/

}