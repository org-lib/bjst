import { Nullable } from "@babylonjs/core";
import { Control, Grid, StackPanel, TextBlock } from "@babylonjs/gui";
import { GameDefinition } from "../Game";
import { GameState } from "./GameState";
import { State } from "./State";
import { States } from "./States";
import { Assets } from "../Assets";
import { GuiFramework } from "../GuiFramework";
import { InputManager } from "../Inputs/Input";

export class BattleSelect extends State {

    public static gameDefinition: Nullable<GameDefinition> = null;
    private static missions: any = null;

    public exit() {
        super.exit();
    }
    /*
    这段代码是使用Babylon.js引擎开发的一个游戏场景中的功能，用于显示“Mission Select”界面以供玩家选择游戏关卡。
    具体来说， enter() 函数包含了大量的UI元素创建和事件绑定。
    该函数首先判断屏幕方向，如果是横屏模式，则使用 GuiFramework 工具创建了一系列的UI元素，
    如底部栏、标题、关卡按钮、文字说明等等，并且给每个按钮添加了鼠标移动和点击事件的监听器，并根据玩家的操作设置 GameState 的状态，最终将创建好的UI元素添加到了场景对象 _adt 中。
    如果是竖屏模式，则创建了一个网格，并在其上添加了一个标题、关卡按钮、文字说明等UI元素，也添加了相应的事件监听器，最终仍然将创建好的UI元素添加到了场景对象 _adt 中。
    总体来说，这段代码利用了Babylon.js引擎和 GuiFramework 工具快速地实现了一个复杂的UI界面，给游戏玩家提供了友好的交互体验。
    */
    public enter() {
        console.log("BattleSelect.enter")
        super.enter();
        if (!this._adt) {
            return;
        }

        /*
        babylonjs GuiFramework.createRecapGrid 、Grid和createStatsGrid 的解释和使用关系
        `GuiFramework.createRecapGrid`、`Grid`和`createStatsGrid`都是Babylon.js的GUI库中的控件，它们都可以用来创建网格控件。
        `GuiFramework.createRecapGrid`是一个自定义的GUI控件，用于在屏幕上显示一些文本和图标，通常用于显示一些摘要信息或统计数据。该控件的外观可以在CSS文件中进行自定义。
        `Grid`是一个基本的GUI控件，用于创建一个网格布局，可以将其他控件放置在其中。它可以设置行和列的数量，以及每个单元格的大小和位置。
        `createStatsGrid`是一个用于创建性能监视器的函数，该函数会创建一个网格控件，并在其中显示一些性能指标，如帧率、渲染时间等。它使用了`Grid`控件来实现布局。
        这三个控件之间没有直接的使用关系，但是它们都可以用来创建网格控件，可以根据需要选择使用其中的一个或多个。
        */
        if (GuiFramework.isLandscape) {
            console.log("BattleSelect.isLandscape")
            GuiFramework.createBottomBar(this._adt);
            let instructions = GuiFramework.createRecapGrid();
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            const panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Mission Select", panelGrid);
            grid.addControl(instructions, 0, 1);

            const splashText = GuiFramework.createSplashText("");
            instructions.addControl(splashText, 0, 0);

            const inputControls = GuiFramework.createStatsGrid();
            instructions.addControl(inputControls, 1, 0);

            if (InputManager.isTouch) {
                GuiFramework.createParameter(inputControls, "Steer", GuiFramework.createStatText("Virtual Thumbstick"));//在 "inputControls" 上创建一个名为 "Steer" 的文本框，并将其值设置为 "Virtual Thumbstick"。
                GuiFramework.createParameter(inputControls, "Fire Cannons", GuiFramework.createStatText("Fire Button"));
                GuiFramework.createParameter(inputControls, "Fire Missile", GuiFramework.createStatText("Missile Button"));
                GuiFramework.createParameter(inputControls, "Afterburners", GuiFramework.createStatText("Boost Button"));
                GuiFramework.createParameter(inputControls, "Brake", GuiFramework.createStatText("Brake Button"));
                GuiFramework.createParameter(inputControls, "Reverse Course", GuiFramework.createStatText("Flip Button"));
            } else {
                GuiFramework.createParameter(inputControls, "Steer", GuiFramework.createStatText("Mouse"));
                GuiFramework.createParameter(inputControls, "Fire Cannons", GuiFramework.createStatText("Left Mouse Button"));
                GuiFramework.createParameter(inputControls, "Fire Missile", GuiFramework.createStatText("Right Mouse Button"));
                GuiFramework.createParameter(inputControls, "Afterburners", GuiFramework.createStatText("W"));
                GuiFramework.createParameter(inputControls, "Brake", GuiFramework.createStatText("S"));
                GuiFramework.createParameter(inputControls, "Reverse Course", GuiFramework.createStatText("Q"));
            }

            Assets.missions.forEach((scenario: any) => {// 循环遍历 "Assets.missions" 数组中的每一个元素，将当前元素赋值给 "scenario" 变量。
                let button = GuiFramework.addButton(scenario.name, panel)//在 "panel" 上创建一个名为 "scenario.name" 的按钮，并将其赋值给 "button" 变量
                button.onPointerMoveObservable.add(() => {// 当鼠标移动到按钮上时，执行以下代码块。
                    splashText.text = scenario.description;//将 "splashText" 的文本内容设置为当前 "scenario" 的描述。
                });
                button.onPointerDownObservable.add(() => {
                    GameState.gameDefinition = scenario.gameDefinition;//设置 "GameState.gameDefinition" 的值为当前 "scenario" 的游戏定义。
                    State.setCurrent(States.gameState);//将场景状态设置为游戏状态。
                })
            });

            let button = GuiFramework.addButton("Back", panel);//在 "panel" 上创建一个名为 "Back" 的按钮，并将其赋值给 "button" 变量。
            button.onPointerMoveObservable.add(function (info) {
                splashText.text = "";
            });
            button.onPointerDownObservable.add(function (info) {
                State.setCurrent(States.main);
            });

            this._adt.addControl(grid);

        } else {
            console.log("BattleSelect.isLandscape.else")
            let grid = new Grid();
            grid.addRowDefinition(0.2, false);//在 "grid" 上创建一行并设置高度为 0.2。
            grid.addRowDefinition(0.8, false);//在 "grid" 上创建一行并设置高度为 0.8。
            grid.addColumnDefinition(1.0, false);//在 "grid" 上创建一列并设置宽度为 1.0。
            let textBlock = new TextBlock("", "MISSION SELECT");
            GuiFramework.setFont(textBlock, true, true);
            textBlock.fontSize = 35;
            textBlock.color = "#a6fffa";
            textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, 0, 0);

            const splashText = GuiFramework.createSplashText("");
            splashText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            grid.addControl(splashText, 1, 0);

            var panel = new StackPanel();
            panel.paddingBottom = "100px";
            Assets.missions.forEach((scenario: any) => {
                let button = GuiFramework.addButton(scenario.name, panel)
                button.onPointerMoveObservable.add(() => {
                    splashText.text = scenario.description;
                });
                button.onPointerDownObservable.add(() => {
                    GameState.gameDefinition = scenario.gameDefinition;
                    State.setCurrent(States.gameState);
                })
            });

            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let button = GuiFramework.addButton("Back", panel);
            button.onPointerMoveObservable.add(function (info) {
                splashText.text = "";
            });
            button.onPointerDownObservable.add(function (info) {
                State.setCurrent(States.main);
            });
            grid.addControl(panel, 2, 0);

            this._adt.addControl(grid);

        }
    }
}