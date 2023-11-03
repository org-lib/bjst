import { Control, Grid, StackPanel, TextBlock, Image } from "@babylonjs/gui";
import { State } from "./State";
import { States } from "./States";
import { GuiFramework } from "../GuiFramework";

export class Credits extends State {

    public exit() {
        super.exit();
    }

    /*
    这段代码是一个基于 Babylon.js 引擎的游戏的 Credits 界面的实现代码。这个界面会根据屏幕方向的不同，分别采取不同的布局方式。
    在横屏模式下，这个界面会创建一个底部工具栏，并在工具栏上添加一个“Back”按钮。然后在中央区域创建一个网格控件，其中包含一个用于显示 Credits 信息的文本块和一个用于显示标题的文本块。
    文本块具有字体大小、颜色、阴影等样式属性。最后，将这个网格控件添加到一个高级可交互控件 ADT 中。
    在竖屏模式下，这个界面会创建一个类似于列表的布局方式，其中包含一个标题文本块和一个 Credits 信息文本块。还会在界面底部添加一个“Back”按钮。同样地，这些控件会被添加到一个 ADT 中。
    这段代码主要使用了 Babylon.js 引擎中的 GUI 控件，包括 StackPanel、Grid、TextBlock 等，以及一些自定义函数。
    */
    public enter() {
        console.log("Credits.enter")
        super.enter();
        if (!this._adt) {
            return;
        }

        if (GuiFramework.isLandscape) {
            GuiFramework.createBottomBar(this._adt);
            let creditBlock = GuiFramework.createRecapGrid();
            var panel = new StackPanel();
            panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            let grid = new Grid();
            grid.paddingBottom = "100px";
            grid.paddingLeft = "100px";
            GuiFramework.formatButtonGrid(grid);
            grid.addControl(panel, 0, 0);
            let panelGrid: Grid = GuiFramework.createTextPanel(grid);
            GuiFramework.createPageTitle("Credits", panelGrid);
            grid.addControl(creditBlock, 0, 1);

            var textBlock = new TextBlock();
            textBlock.text = "This demo was made by some members of the Babylon.js core team, @PatrickCRyan, @skaven_, and @DarraghBurke_, " +
                "to celebrate the release of Babylon.js 5.0.\n\n" +
                "The mission of our Babylon.js team is to create one of the most powerful, beautiful, " +
                "and simple web rendering engines in the world. Our passion is to make it completely open and free for everyone. As you may have guessed, " +
                "Babylon.js was named with a deep love and admiration of one of the greatest sci-fi shows of all time.\n\n" +
                "To get  the code of this demo on: https://github.com/BabylonJS/SpacePirates \n" +
                "To learn about Babylon.js: https://doc.babylonjs.com \n" +
                "To connect with the community: https://forum.babylonjs.com";
            textBlock.textWrapping = true;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            textBlock.shadowOffsetX = 2;
            textBlock.shadowOffsetY = 2;
            textBlock.shadowColor = "black";
            textBlock.shadowBlur = 0;
            textBlock.width = 0.7;
            textBlock.height = 1.0;
            textBlock.color = "white";
            textBlock.fontSize = 24;
            GuiFramework.setFont(textBlock, false, true);
            creditBlock.addControl(textBlock, 1, 0);

            GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function (info) {
                State.setCurrent(States.main);
            });

            this._adt.addControl(grid);

        } else {
            var grid = new Grid();
            grid.addRowDefinition(0.2, false);
            grid.addRowDefinition(0.6, false);
            grid.addRowDefinition(0.2, false);
            grid.addColumnDefinition(1.0, false);
            let textBlock = new TextBlock("", "CREDITS");
            GuiFramework.setFont(textBlock, true, true);
            textBlock.fontSize = 35;
            textBlock.color = "#a6fffa";
            textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            grid.addControl(textBlock, 0, 0);

            var creditText = new TextBlock();
            creditText.text = "This demo was made by some members of the Babylon.js core team, @PatrickCRyan, @skaven_, and @DarraghBurke_, " +
                "to celebrate the release of Babylon.js 5.0.\n\n" +
                "The mission of our Babylon.js team is to create one of the most powerful, beautiful, " +
                "and simple web rendering engines in the world. Our passion is to make it completely open and free for everyone. As you may have guessed, " +
                "Babylon.js was named with a deep love and admiration of one of the greatest sci-fi shows of all time.\n\n" +
                "To get  the code of this demo on: https://github.com/BabylonJS/SpacePirates \n" +
                "To learn about Babylon.js: https://doc.babylonjs.com \n" +
                "To connect with the community: https://forum.babylonjs.com";
            creditText.textWrapping = true;
            creditText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            creditText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            creditText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            creditText.shadowOffsetX = 2;
            creditText.shadowOffsetY = 2;
            creditText.shadowColor = "black";
            creditText.shadowBlur = 0;
            creditText.width = 0.7;
            creditText.height = 1.0;
            creditText.color = "white";
            creditText.fontSize = 24;
            GuiFramework.setFont(creditText, false, true);
            grid.addControl(creditText, 1, 0);

            let panel = new StackPanel();
            GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function (info) {
                State.setCurrent(States.main);
            });
            grid.addControl(panel, 2, 0);

            this._adt.addControl(grid);
        }
    }
    /*
    这段代码是 BabylonJS 游戏引擎的 JavaScript 代码，主要实现了游戏 Credits 页面的 UI 布局和相关功能。下面我来逐行解释一下这个函数：
    1. `public enter() {`：进入 Credits 页面的函数，定义为公有方法。
    2. `console.log("Credits.enter")`：打印输出日志信息。
    3. `super.enter();`：调用父类的 enter() 方法。
    4. `if (!this._adt) { return; }`：如果 `_adt` 对象不存在，则返回。
    5. `if (GuiFramework.isLandscape) {`：如果当前屏幕是横屏模式，则执行以下代码块。
    6. `GuiFramework.createBottomBar(this._adt);`：创建 Credits 页面底部的工具栏。
    7. `let creditBlock = GuiFramework.createRecapGrid();`：创建一个名为 `creditBlock` 的表格。
    8. `var panel = new StackPanel();`：创建一个名为 `panel` 的垂直堆栈面板。
    9. `panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;`：设置堆栈面板在垂直方向上的对齐方式为底部对齐。
    10. `let grid = new Grid();`：创建一个名为 `grid` 的网格布局。
    11. `grid.paddingBottom = "100px";`：设置网格布局底部内边距为 100 像素。
    12. `grid.paddingLeft = "100px";`：设置网格布局左侧内边距为 100 像素。
    13. `GuiFramework.formatButtonGrid(grid);`：设置网格布局的按钮样式。
    14. `grid.addControl(panel, 0, 0);`：将垂直堆栈面板添加到网格布局的第一行第一列。
    15. `let panelGrid: Grid = GuiFramework.createTextPanel(grid);`：创建一个名为 `panelGrid` 的文本面板，并将其添加到网格布局的第一行第二列。
    16. `GuiFramework.createPageTitle("Credits", panelGrid);`：创建名为“Credits”的页面标题，并将其添加到文本面板中。
    17. `grid.addControl(creditBlock, 0, 1);`：将 `creditBlock` 添加到网格布局的第一行第二列。
    18. `var textBlock = new TextBlock();`：创建名为 `textBlock` 的文本块。
    19. `textBlock.text = "..."`：设置文本块的文字内容。
    20. `textBlock.textWrapping = true;`：启用文本自动换行。
    21. `textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;`：设置文本块在垂直方向上的对齐方式为顶部对齐。
    22. `textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;`：设置文本块在水平方向上的对齐方式为左侧对齐。
    23. `textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;`：设置文本块在垂直方向上的对齐方式为顶部对齐。
    24. `textBlock.shadowOffsetX = 2;`：设置文本块的阴影在水平方向上的偏移量为 2 像素。
    25. `textBlock.shadowOffsetY = 2;`：设置文本块的阴影在垂直方向上的偏移量为 2 像素。
    26. `textBlock.shadowColor = "black";`：设置文本块的阴影颜色为黑色。
    27. `textBlock.shadowBlur = 0;`：设置文本块的阴影模糊程度为 0。
    28. `textBlock.width = 0.7;`：设置文本块的宽度为 0.7。
    29. `textBlock.height = 1.0;`：设置文本块的高度为 1.0。
    30. `textBlock.color = "white";`：设置文本块的颜色为白色。
    31. `textBlock.fontSize = 24;`：设置文本块的字体大小为 24 像素。
    32. `GuiFramework.setFont(textBlock, false, true);`：设置文本块的字体样式。
    33. `creditBlock.addControl(textBlock, 1, 0);`：将文本块添加到 `creditBlock` 的第二行第一列。
    34. `GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function (info) { State.setCurrent(States.main); });`：创建一个名为“Back”的按钮，并将其添加到垂直堆栈面板中，添加指针按下观察器以执行返回主菜单的操作。
    35. `this._adt.addControl(grid);`：将网格布局添加到当前场景的高级UI层级节点中。
    36. `else {`：如果当前屏幕是竖屏模式，则执行以下代码块。
    37. `var grid = new Grid();`：创建一个名为 `grid` 的网格布局。
    38. `grid.addRowDefinition(0.2, false);`：添加一行，高度为 0.2 倍网格布局的总高度。
    39. `grid.addRowDefinition(0.6, false);`：添加一行，高度为 0.6 倍网格布局的总高度。
    40. `grid.addRowDefinition(0.2, false);`：添加一行，高度为 0.2 倍网格布局的总高度。
    41. `grid.addColumnDefinition(1.0, false);`：添加一列，宽度为 1.0 倍网格布局的总宽度。
    42. `let textBlock = new TextBlock("", "CREDITS");`：创建一个名为 `textBlock` 的文本块，并设置其文字内容为“CREDITS”。
    43. `GuiFramework.setFont(textBlock, true, true);`：设置文本块的字体样式。
    44. `textBlock.fontSize = 35;`：设置文本块的字体大小为 35 像素。
    45. `textBlock.color = "#a6fffa";`：设置文本块的颜色为浅蓝绿色。
    46. `textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;`：设置文本块在水平方向上的对齐方式为中央对齐。
    47. `textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP`：设置文本块在垂直方向上的对齐方式为顶部对齐。
    48. `textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;`：设置文本块在水平方向上的对齐方式为中央对齐。
    49. `textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;`：设置文本块在垂直方向上的对齐方式为中央对齐。
    50. `grid.addControl(textBlock, 0, 0);`：将文本块添加到网格布局的第一行第一列。
    51. `var creditText = new TextBlock();`：创建名为 `creditText` 的文本块。
    52. `creditText.text = "..."`：设置文本块的文字内容。
    53. `creditText.textWrapping = true;`：启用文本自动换行。
    54. `creditText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;`：设置文本块在垂直方向上的对齐方式为顶部对齐。
    55. `creditText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;`：设置文本块在水平方向上的对齐方式为左侧对齐。
    56. `creditText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;`：设置文本块在垂直方向上的对齐方式为顶部对齐。
    57. `creditText.shadowOffsetX = 2;`：设置文本块的阴影在水平方向上的偏移量为 2 像素。
    58. `creditText.shadowOffsetY = 2;`：设置文本块的阴影在垂直方向上的偏移量为 2 像素。
    59. `creditText.shadowColor = "black";`：设置文本块的阴影颜色为黑色。
    60. `creditText.shadowBlur = 0;`：设置文本块的阴影模糊程度为 0。
    61. `creditText.width = 0.7;`：设置文本块的宽度为 0.7。
    62. `creditText.height = 1.0;`：设置文本块的高度为 1.0。
    63. `creditText.color = "white";`：设置文本块的颜色为白色。
    64. `creditText.fontSize = 24;`：设置文本块的字体大小为 24 像素。
    65. `GuiFramework.setFont(creditText, false, true);`：设置文本块的字体样式。
    66. `grid.addControl(creditText, 1, 0);`：将文本块添加到网格布局的第二行第一列。
    67. `let panel = new StackPanel();`：创建一个名为 `panel` 的垂直堆栈面板。
    68. `GuiFramework.addButton("Back", panel).onPointerDownObservable.add(function (info) { State.setCurrent(States.main); });`：创建一个名为“Back”的按钮，并将其添加到垂直堆栈面板中，添加指针按下观察器以执行返回主菜单的操作。
    69. `grid.addControl(panel, 2, 0);`：将垂直堆栈面板添加到网格布局的第三行第一列。
    70. `this._adt.addControl(grid);`：将网格布局添加到当前场景的高级UI层级节点中。
    */
}