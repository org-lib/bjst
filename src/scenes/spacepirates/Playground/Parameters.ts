import { Engine } from "@babylonjs/core";

export class Parameters {
    public static maxSpeed: number;//控制飞船的最大速度
    public static maxAccel: number;//控制飞船的最大加速度
    public static missileCoolDownTime: number;//控制导弹冷却时间，即发射导弹后需要等待多长时间才能再次发射。

    public static mouseSensitivty: number;//鼠标灵敏度，用于控制视角移动时鼠标的响应速度。

    // time needed with ship on screen to lock missile
    public static timeToLockMissile: number;//玩家在瞄准一个目标并锁定导弹之前需要将目标保持在屏幕上的时间

    // max turn rate
    public static playerTurnRate: number;//玩家飞船的最大转向速率。

    // time in ms for the IMMELMANN maneuver
    public static ImmelmannDuration: number;//IMMELMANN 操作持续的时间（以毫秒为单位），IMMELMANN 是一种特殊的飞行机动操作，可以让玩家快速转向并逃脱敌人的攻击。

    // Cone of perception that enemies can "see"
    // Higher values = wider cone
    public static AIPerceptionCone: number;//敌人感知范围内的锥形区域大小，值越大表示感知范围越广。

    // Distance behind a target ship that enemies will aim to follow
    // Higher values = enemies will keep their distance
    public static AIFollowDistance: number;//敌人跟随目标飞船的距离，值越大表示敌人会保持更远的距离跟随目标。

    public static AIPredictionRange: number;//敌人预测目标未来位置时考虑的时间长度。

    // how fast should they turn?
    public static AITurnRate: number;//敌人飞船的最大转向速率。

    // magnitude of random offset to add to input every frame
    // this prevents AIs from having perfect accuracy
    public static AIInputRandomness: number;//每帧随机添加到敌人输入命令中的偏移量，以避免敌人拥有完美的精度和准确性。
    // how willing the AI is to fire
    // 0 = all the time
    // 1 = only with a perfect shot lined up
    public static AIFirePrecision: number;//敌人开火时的准确度，值越小表示更容易开火。

    // how willing the AI is to when there's a friendly in front
    public static AIFriendlyFirePrecision: number;//当前目标前方有友军时，敌人开火的准确度。

    // how long the AI should evade for when hit (in ms)
    // evade basically means "panic and run away from shots"
    public static AIEvadeTime: number;//被击中后敌人需要逃避并躲避攻击的时间（以毫秒为单位）。

    // if the AI is slower than this, they won't break
    public static AIMinimumSpeed: number;//敌人可以保持的最低速度。如果速度低于此值，则不会采取任何规避行动。

    // if the AI is faster than this, they won't burst
    public static AIMaximumSpeed: number;//敌人可以达到的最高速度。如果速度高于此值，则不会采取加速行动。


    public static AIFireRange: number;//敌人能够发射导弹或者进行远程攻击的距离范围。

    public static AIBreakDistance: number;//如果目标与敌方飞船之间距离小于此值，则飞船将开始闪避操作（如侧滑、上升等），以避免撞击目标或被其攻击。

    public static AIBurstDistance: number;//如果目标与敌方飞船之间距离大于此值，则飞船将加速追击目标。

    public static AIMaxTargets: number;//敌人同时可以攻击的最多目标数量。

    public static AIDebugLabels: boolean;// 是否显示调试信息和标签。

    public static AIImmelmannProbability: number;//敌人进行 IMMELMANN 操作的概率，值越高表示更容易进行该操作。

    /*
    相应阵营的初始数量。
    */
    public static allyCount: number;

    public static enemyCount: number;

    public static recordFrameCount: number; //录制帧数，用于录制游戏回放视频。

    public static allowSplitScreen: boolean;//是否允许分屏模式（即多个玩家在同一台设备上同时游戏）。

    public static recorderActive: boolean;//是否启用游戏回放录制器功能。

    public static enableAudio: boolean;//是否启用音效和音乐播放功能。

    public static starfieldHeavyShader: boolean;//是否启用重型星空渲染器。

    public static guiFont = {//游戏 GUI 字体相关设置
        family: "magistral, sans-serif",
        book: "300",
        bold: "700",
        style: "normal"
    }

    public static setFont(element: any, isBold: boolean) {
        element.fontFamily = Parameters.guiFont.family;
        if (isBold) {
            element.fontWeight = Parameters.guiFont.bold;
        } else {
            element.fontWeight = Parameters.guiFont.book;
        }
        element.fontStyle = Parameters.guiFont.style;
    }

    // paste exported parameters inside this function
    public static initialize() {
        this.maxSpeed = 2;
        this.maxAccel = 0.003;
        this.missileCoolDownTime = 10000;
        this.mouseSensitivty = 0.0003;
        this.timeToLockMissile = 2000;
        this.playerTurnRate = 0.04;
        this.AIPerceptionCone = -0.5;
        this.AIFollowDistance = -10;
        this.AIPredictionRange = 2;
        this.AITurnRate = 0.04;
        this.AIInputRandomness = 0;
        this.AIFirePrecision = 0.98;
        this.AIFriendlyFirePrecision = 0.97;
        this.AIEvadeTime = 3000;
        this.AIMinimumSpeed = 1;
        this.AIMaximumSpeed = 5;
        this.AIFireRange = 550;
        this.AIBreakDistance = 30;
        this.AIBurstDistance = 500;
        this.AIMaxTargets = 4;
        this.AIDebugLabels = false;
        this.AIImmelmannProbability = 0.2;
        this.ImmelmannDuration = 1000;
        this.allyCount = 10;
        this.enemyCount = 10;
        this.recordFrameCount = 2000;
        this.allowSplitScreen = false;
        this.recorderActive = true;
        this.enableAudio = true;
        this.starfieldHeavyShader = true;
    }

    public static getParameters(): (keyof Parameters)[] {
        const exclude = ["length", "name", "prototype", "initialize", "getParameters", "generateCode"];
        return Object.getOwnPropertyNames(Parameters).filter(name => exclude.indexOf(name) === -1) as (keyof Parameters)[];
    }

    public static generateCode(): string {
        let string = "";
        this.getParameters().forEach(param => {
            const value = this[param];
            let output;
            switch (typeof value) {
                case "string":
                    output = `"${value}""`;
                    break;
                case "number":
                    output = `${value}`;
                    break;
                case "boolean":
                    output = value ? "true" : "false";
                    break;
            }
            string += `this.${param} = ${output};\n`;
        })
        return string;
    }
}