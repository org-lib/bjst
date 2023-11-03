import { Control, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GameState } from "./GameState";
import { Nullable } from "@babylonjs/core";
import { Ship, Statistics } from "../Ship";
import { InputManager } from "../Inputs/Input";
import { GuiFramework } from "../GuiFramework";

export class Dead extends State {
    public ship: Nullable<Ship> = null;
    public exit() {
        super.exit();
    }
    /*
    这段代码是使用babylonjs框架编写的一个游戏场景中显示玩家失败后的界面。当玩家失败后，会创建一个显示该玩家在游戏中的统计数据的面板和两个按钮的界面，这个界面可以根据设备是否为横屏进行不同的布局。
    其中使用了 babylonjs 中的 GUIFramework 组件来方便的创建控件。
    具体实现中，首先判断是否有GUIFramework的实例，如果没有则直接返回；然后禁用指针锁定；接着根据是否是横屏，选择不同的界面布局方式。
    如果是横屏，则创建底部导航栏、统计数据网格、按钮等控件，最后将这些控件添加到 GUIFramework 对象的控制中；
    如果是竖屏，则创建一个包含标题和统计数据网格的网格，并添加两个按钮到底部，最后同样将这些控件添加到 GUIFramework 对象的控制中。
    该函数被定义在一个名为 Dead 的类中，通过继承父类实现了 State 的状态管理。在玩家失败后调用此函数即可显示失败界面。
    */
    public enter() {
        console.log("Dead.enter")
        super.enter();
        if (!this._adt) {
            return;
        }

        InputManager.disablePointerLock();

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            let stats = GuiFramework.createRecapGrid();
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            let panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Defeat", panelGrid);
            grid.addControl(stats, 0, 1);

            const splashText = GuiFramework.createSplashText("Wasted!!!");
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

            GuiFramework.addButton("Try again", panel).onPointerDownObservable.add(function (info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.gameState);
            });

            GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function (info) {
                GameState.gameSession?.stop();
                State.setCurrent(States.main);
            });

            this._adt.addControl(grid);

        } else {
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            panel.paddingBottom = "100px";
            let grid = new Grid();
            grid.addRowDefinition(0.2, false);
            grid.addRowDefinition(0.5, false);
            grid.addRowDefinition(0.3, false);
            grid.addControl(panel, 2, 0);

            let textBlock = new TextBlock("", "DEFEAT");
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

            GuiFramework.addButton("Try again", panel).onPointerDownObservable.add(function (info) {
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
    这段代码是一个 enter 函数，作用是在游戏失败时显示一些统计信息，并提供两个按钮，一个是 Try again，一个是 Main menu，点击后分别可以再次尝试游戏或返回主菜单。
    
    具体逐行解释如下：
    - `console.log("Dead.enter")`: 输出字符串 "Dead.enter" 到控制台。
    - `super.enter()`: 调用父类（即基类）的 enter 函数。
    - `if (!this._adt) {...}`: 如果 `_adt` 属性不存在或为空，则直接返回。
    - `InputManager.disablePointerLock();`: 禁用鼠标指针锁定功能。
    - `if (GuiFramework.isLandscape) {...} else {...}`: 如果当前为横屏模式，则执行 if 语句块中的代码，否则执行 else 语句块中的代码。
    - `GuiFramework.createBottomBar(this._adt);`: 创建底部菜单栏并添加到 `_adt` 控件中。
    - `let stats = GuiFramework.createRecapGrid();`: 创建一个叫做 `stats` 的网格控件。
    - `var panel = new StackPanel();`: 创建一个垂直排列的面板控件并将其赋值给变量 `panel`。
    - `panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;`: 将 `panel` 控件的垂直对齐方式设置为底部对齐。
    - `let grid = new Grid();`: 创建一个网格控件并将其赋值给变量 `grid`。
    - `grid.paddingBottom = "100px";`: 定义 `grid` 控件的底部内边距为 100 像素。
    - `grid.paddingLeft = "100px";`: 定义 `grid` 控件的左侧内边距为 100 像素。
    - `GuiFramework.formatButtonGrid(grid);`: 格式化 `grid` 控件中的按钮。
    - `grid.addControl(panel, 0, 0);`: 将 `panel` 控件添加到 `grid` 控件的第一行第一列。
    - `let panelGrid: Grid = GuiFramework.createTextPanel(grid);`: 创建一个用于显示游戏统计信息的网格控件，并将其赋值给变量 `panelGrid`。
    - `GuiFramework.createPageTitle("Defeat", panelGrid);`: 在 `panelGrid` 控件中添加一个 "Defeat" 的页面标题。
    - `grid.addControl(stats, 0, 1);`: 将 `stats` 控件添加到 `grid` 控件的第一行第二列。
    - `const splashText = GuiFramework.createSplashText("Wasted!!!");`: 创建一个叫做 `splashText` 的闪屏文本控件，内容为字符串 "Wasted!!!"。
    - `stats.addControl(splashText, 0, 0);`: 将 `splashText` 控件添加到 `stats` 控件的第一行第一列。
    - `const statsGrid = GuiFramework.createStatsGrid();`: 创建一个叫做 `statsGrid` 的网格控件，用于显示游戏统计信息。
    - `stats.addControl(statsGrid, 1, 0);`: 将 `statsGrid` 控件添加到 `stats` 控件的第二行第一列。
    - `if (this.ship && this.ship.statistics) {...}`: 如果 `ship` 对象和 `ship.statistics` 对象都存在，则执行 if 语句块中的代码。
    - `const s = this.ship.statistics;`: 将 `ship.statistics` 对象赋值给变量 `s`。
    - `GuiFramework.createParameter(statsGrid, "Damage dealt", GuiFramework.createStatText(s.damageDealt as unknown as string));`: 在 `statsGrid` 控件中添加一项 "Damage Dealt" 的统计信息，并将 `s.damageDealt` 的值转换为字符串并显示出来。
    - `...`: 同样的方式创建其它的统计信息，如 "Damage taken"、"Ships destroyed"、"Time of battle"、"Shots fired"、"Accuracy"、"Missiles fired"、"Allies Asteroid Crash" 和 "Enemies Asteroid Crash"。
    - `GuiFramework.addButton("Try again", panel).onPointerDownObservable.add(function (info) {...});`: 创建一个 "Try again" 的按钮，并在点击后执行指定的函数，停止当前游戏会话并设置状态为 `States.gameState` 或 `States.main`。
    - `GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function (info) {...});`: 创建一个 "Main menu" 的按钮，并在点击后执行指定的函数，停止当前游戏会话并设置状态为 `States.gameState` 或 `States.main`。
    - `this._adt.addControl(grid);`: 将 `grid` 控件添加到 `_adt` 控件中。
    - `panel.paddingBottom = "100px";`: 定义 `panel` 控件的底部内边距为 100 像素。
    - `let textBlock = new TextBlock("", "DEFEAT");`: 创建一个叫做 `textBlock` 的文本块控件，内容为字符串 "DEFEAT"。
    - `GuiFramework.setFont(textBlock, true, true);`: 将 `textBlock` 控件的字体设置为 GuiFramework 中定义的字体，并启用粗体和斜体。
    - `textBlock.fontSize = 35;`: 设置 `textBlock` 控件的字体大小为 35。
    - `textBlock.color = "#a6fffa";`: 设置 `textBlock` 控件的字体颜色为 "#a6fffa"。
    - `textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;`: 将 `textBlock` 控件的水平对齐方式设置为居中。
    - `textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP`: 将 `textBlock` 控件的垂直对齐方式设置为顶部对齐。
    - `textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;`: 将 `textBlock` 控件的文本水平对齐方式设置为居中。
    - `textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;`: 将 `textBlock` 控件的文本垂直对齐方式设置为居中。
    - `grid.addControl(textBlock, 0, 0);`: 将 `textBlock` 控件添加到 `grid` 控件的第一行第一列。
    - `const statsGrid = GuiFramework.createStatsGrid();`: 创建一个叫做 `statsGrid` 的网格控件，用于显示游戏统计信息。
    - `grid.addControl(statsGrid, 1, 0);`: 将 `statsGrid` 控件添加到 `grid` 控件的第二行第一列。
    - `if (this.ship && this.ship.statistics) {...}`: 如果 `ship` 对象和 `ship.statistics` 对象都存在，则执行 if 语句块中的代码。
    - `const s = this.ship.statistics;`: 将 `ship.statistics` 对象赋值给变量 `s`。
    - `GuiFramework.createParameter(statsGrid, "Damage dealt", GuiFramework.createStatText(s.damageDealt as unknown as string));`: 在 `statsGrid` 控件中添加一项 "Damage Dealt" 的统计信息，并将 `s.damageDealt` 的值转换为字符串并显示出来。
    - `...`: 同样的方式创建其它的统计信息，如 "Damage taken"、"Ships destroyed"、"Time of battle"、"Shots fired"、"Accuracy"、"Missiles fired"、"Allies Asteroid Crash" 和 "Enemies Asteroid Crash"。
    - `GuiFramework.addButton("Try again", panel).onPointerDownObservable.add(function (info) {...});`: 创建一个 "Try again" 的按钮，并在点击后执行指定的函数，停止当前游戏会话并设置状态为 `States.gameState` 或 `States.main`。
    - `GuiFramework.addButton("Main menu", panel).onPointerDownObservable.add(function (info) {...});`: 创建一个 "Main menu" 的按钮，并在点击后执行指定的函数，停止当前游戏会话并设置状态为 `States.gameState` 或 `States.main`。
    - `this._adt.addControl(grid);`: 将 `grid` 控件添加到 `_adt` 控件中。
    */
}