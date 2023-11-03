import { Engine } from "@babylonjs/core";

export class Settings {
    private static _volume = 1.0;// 音量
    public static set volume(volume: number) {
        this._volume = volume;
        Engine.audioEngine?.setGlobalVolume(this._volume);
    }
    public static get volume() {
        return this._volume;
    }
    public static sensitivity = 1.0;//灵敏度
    public static showParameters = false;//是否显示参数
    public static invertY = false;//是否反转Y轴
}