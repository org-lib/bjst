import { Nullable } from "@babylonjs/core";
import { Control, Grid, StackPanel, Button, Image } from "@babylonjs/gui";
import { GameDefinition } from "../Game";
import { Parameters } from "../Parameters";
import { BattleSelect } from "./BattleSelect";
import { Diorama } from "./Diorama";
import { State } from "./State";
import { States } from "./States";
import { Assets } from "../Assets";
import { GuiFramework } from "../GuiFramework";

export class Main extends State {

    public static diorama: Nullable<Diorama> = null;
    public static playButton: Nullable<Button> = null;
    public exit() {
        super.exit();
    }
    /*
    这是一个使用了 BabylonJS 库创建 WebGL 3D 场景和UI界面的代码。该代码实现了一个主界面，包含了多个按钮，分别对应游戏选项、开始游戏、显示制作者信息等功能。
    其中，"Main.enter"为控制台输出的日志信息，通过super.enter()调用了父类的 enter 方法。
    代码中使用了 GuiFramework 对象，该对象封装了BabylonJS的UI控件，并提供了一些简洁的方法来创建按钮、面板等控件。
    在手机屏幕宽度较小的情况下，页面使用了 StackPanel 和 Image 控件布局。如果屏幕宽度较大，则使用了 Grid 布局。点击按钮会进行相应的状态转换，以启动相应的游戏模式。
    总体来说，该代码实现了一个简单的游戏主界面，为玩家提供了多种游戏选择。
    */
    public enter() {
        console.log("Main.enter")
        super.enter();

        if (!this._adt) {
            return;
        }

        Main.diorama?.setEnable(this._adt);

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);

            let logo = new Image("spacePirates", "/src/assets/UI/spacePiratesLogo.svg");
            logo.width = 0.7;
            logo.fixedRatio = 340 / 1040;
            logo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            logo.top = "100px";
            grid.addControl(logo, 0, 1);

            Main.playButton = GuiFramework.addButton("Play", panel);
            Main.playButton.isVisible = Assets.loadingComplete;

            Main.playButton.onPointerDownObservable.add(function (info) {
                const gameDefinition = new GameDefinition();
                gameDefinition.humanAllies = 1;
                gameDefinition.aiEnemies = Parameters.enemyCount;
                gameDefinition.aiAllies = Parameters.allyCount;
                BattleSelect.gameDefinition = gameDefinition;
                State.setCurrent(States.battleSelect);
            });

            if (Parameters.allowSplitScreen) {
                GuiFramework.addButton("Two Player Co-op", panel).onPointerDownObservable.add(function (info) {
                    const gameDefinition = new GameDefinition();
                    gameDefinition.humanAllies = 2;
                    gameDefinition.aiEnemies = Parameters.enemyCount;
                    gameDefinition.aiAllies = Parameters.allyCount;
                    BattleSelect.gameDefinition = gameDefinition;
                    State.setCurrent(States.battleSelect);
                });

                GuiFramework.addButton("Two Players Vs", panel).onPointerDownObservable.add(function (info) {
                    const gameDefinition = new GameDefinition();
                    gameDefinition.humanAllies = 1;
                    gameDefinition.humanEnemies = 1;
                    gameDefinition.aiEnemies = Parameters.enemyCount;
                    gameDefinition.aiAllies = Parameters.allyCount;
                    BattleSelect.gameDefinition = gameDefinition;
                    State.setCurrent(States.battleSelect);
                });
            }

            GuiFramework.addButton("Options", panel).onPointerDownObservable.add(function (info) {
                States.options.backDestination = States.main;
                State.setCurrent(States.options);
            });

            GuiFramework.addButton("Credits", panel).onPointerDownObservable.add(function (info) {
                State.setCurrent(States.credits);
            });
            this._adt.addControl(grid);
        } else {
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            panel.paddingBottom = "100px";

            let logo = new Image("spacePirates", "/src/assets/UI/spacePiratesLogo.svg");
            logo.width = 0.8;
            logo.fixedRatio = 340 / 1040;
            logo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            logo.top = "150px";
            this._adt.addControl(logo);

            Main.playButton = GuiFramework.addButton("Play", panel);
            Main.playButton.isVisible = Assets.loadingComplete;

            Main.playButton.onPointerDownObservable.add(function (info) {
                const gameDefinition = new GameDefinition();
                gameDefinition.humanAllies = 1;
                gameDefinition.aiEnemies = Parameters.enemyCount;
                gameDefinition.aiAllies = Parameters.allyCount;
                BattleSelect.gameDefinition = gameDefinition;
                State.setCurrent(States.battleSelect);
            });

            if (Parameters.allowSplitScreen) {
                GuiFramework.addButton("Two Player Co-op", panel).onPointerDownObservable.add(function (info) {
                    const gameDefinition = new GameDefinition();
                    gameDefinition.humanAllies = 2;
                    gameDefinition.aiEnemies = Parameters.enemyCount;
                    gameDefinition.aiAllies = Parameters.allyCount;
                    BattleSelect.gameDefinition = gameDefinition;
                    State.setCurrent(States.battleSelect);
                });

                GuiFramework.addButton("Two Players Vs", panel).onPointerDownObservable.add(function (info) {
                    const gameDefinition = new GameDefinition();
                    gameDefinition.humanAllies = 1;
                    gameDefinition.humanEnemies = 1;
                    gameDefinition.aiEnemies = Parameters.enemyCount;
                    gameDefinition.aiAllies = Parameters.allyCount;
                    BattleSelect.gameDefinition = gameDefinition;
                    State.setCurrent(States.battleSelect);
                });
            }

            GuiFramework.addButton("Options", panel).onPointerDownObservable.add(function (info) {
                States.options.backDestination = States.main;
                State.setCurrent(States.options);
            });

            GuiFramework.addButton("Credits", panel).onPointerDownObservable.add(function (info) {
                State.setCurrent(States.credits);
            });
            this._adt.addControl(panel);
        }

    }
    /*
    该代码段是 Babylon.js 中的一段 TypeScript 代码，作为 Main 类的一个方法，用于在游戏主界面中添加各种元素和交互逻辑。下面是逐行解释：
    
    1. `public enter() {`: 进入该函数。
    2. `console.log("Main.enter")`: 输出一条日志信息。
    3. `super.enter();`: 调用父类的 enter 方法。
    4. `if (!this._adt) { return; }`: 如果 ADT 为空，则直接返回。
    5. `Main.diorama?.setEnable(this._adt);`: 设置 diorama 的 enable 属性。
    6. `if (GuiFramework.isLandscape) {`: 如果是横屏模式，则执行以下语句块。
    7. `GuiFramework.createBottomBar(this._adt);`: 创建底部工具栏。
    8. `var panel = new StackPanel();`: 创建一个 StackPanel。
    9. `panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;`: 设置该 StackPanel 的垂直对齐方式为底部。
    10. `let grid = new Grid();`: 创建一个 Grid。
    11. `grid.paddingBottom = "100px";`: 设置 Grid 的底部内边距为 100px。
    12. `grid.paddingLeft = "100px";`: 设置 Grid 的左侧内边距为 100px。
    13. `GuiFramework.formatButtonGrid(grid);`: 调整 Grid 的样式。
    14. `grid.addControl(panel, 0, 0);`: 将 Panel 添加到 Grid 中。
    15. `let logo = new Image("spacePirates", "/src/assets/UI/spacePiratesLogo.svg");`: 创建一个 Image，设置其图片和名称。
    16. `logo.width = 0.7;`: 设置 logo 的宽度为 70%。
    17. `logo.fixedRatio = 340 / 1040;`: 设置 logo 的高宽比为 340:1040。
    18. `logo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP`: 设置 logo 的垂直对齐方式为顶部。
    19. `logo.top = "100px";`: 设置 logo 距离顶部为 100px。
    20. `grid.addControl(logo, 0, 1);`: 将 logo 添加到 Grid 中。
    21. `Main.playButton = GuiFramework.addButton("Play", panel);`: 创建一个 Play 按钮，并将其添加到 Panel 中。
    22. `Main.playButton.isVisible = Assets.loadingComplete;`: 设置 Play 按钮是否可见。
    23. `Main.playButton.onPointerDownObservable.add(function (info) { ... });`: 当 Play 按钮被按下时，执行传入的函数。
    24. 在该函数中创建一个 GameDefinition 实例，设置其各项参数，设置当前状态为 States.battleSelect。
    25. `if (Parameters.allowSplitScreen) { ... }`: 如果允许分屏，则执行以下语句块。
    26. 创建两个分别为 "Two Player Co-op" 和 "Two Players Vs" 的按钮，并在按钮被按下时执行相应操作。
    27. `GuiFramework.addButton("Options", panel).onPointerDownObservable.add(function (info) { ... });`: 创建一个 Options 按钮，并将其添加到 Panel 中。当该按钮被按下时，设置当前状态为 States.options。
    28. `GuiFramework.addButton("Credits", panel).onPointerDownObservable.add(function (info) { ... });`: 创建一个 Credits 按钮，并将其添加到 Panel 中。当该按钮被按下时，设置当前状态为 States.credits。
    29. `this._adt.addControl(grid);`: 将 Grid 添加到 ADT 中。
    30. `} else {`: 如果是竖屏模式，则执行以下语句块。
    31. 创建一个 StackPanel，设置其垂直对齐方式为底部，设置 paddingBottom 为 100px。
    32. `let logo = new Image("spacePirates", "/src/assets/UI/spacePiratesLogo.svg");`: 创建一个 Image，设置其图片和名称。
    33. `logo.width = 0.8;`: 设置 logo 的宽度为 80%。
    34. `logo.fixedRatio = 340 / 1040;`: 设置 logo 的高宽比为 340:1040。
    35. `logo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP`: 设置 logo 的垂直对齐方式为顶部。
    36. `logo.top = "150px";`: 设置 logo 距离顶部为 150px。
    37. `this._adt.addControl(logo);`: 将 logo 添加到 ADT 中。
    38. `Main.playButton = GuiFramework.addButton("Play", panel);`: 创建一个 Play 按钮，并将其添加到 Panel 中。
    39. `Main.playButton.isVisible = Assets.loadingComplete;`: 设置 Play 按钮是否可见。
    40. `Main.playButton.onPointerDownObservable.add(function (info) { ... });`: 当 Play 按钮被按下时，执行传入的函数。
    41. 在该函数中创建一个 GameDefinition 实例，设置其各项参数，设置当前状态为 States.battleSelect。
    42. `if (Parameters.allowSplitScreen) { ... }`: 如果允许分屏，则执行以下语句块。
    43. 创建两个分别为 "Two Player Co-op" 和 "Two Players Vs" 的按钮，并在按钮被按下时执行相应操作。
    44. `GuiFramework.addButton("Options", panel).onPointerDownObservable.add(function (info) { ... });`: 创建一个 Options 按钮，并将其添加到 Panel 中。当该按钮被按下时，设置当前状态为 States.options。
    45. `GuiFramework.addButton("Credits", panel).onPointerDownObservable.add(function (info) { ... });`: 创建一个 Credits 按钮，并将其添加到 Panel 中。当该按钮被按下时，设置当前状态为 States.credits。
    46. `this._adt.addControl(panel);`: 将 Panel 添加到 ADT 中。
    47. `}`: 结束 if-else 语句块。
    48. `}`: 结束函数。
    */
}