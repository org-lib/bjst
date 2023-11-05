import { Scene,Engine } from "@babylonjs/core";
class Playground {
    /**
     * CreateScene
     */
    public static CreateScene(engine: Engine, assetsHostUrl: string, canvas: HTMLCanvasElement): Scene {
        var scene = new Scene(engine);
        return scene;
    }
}

export function CreatePlaygroundScene(engine: Engine, assetsHostUrl: string, canvas: HTMLCanvasElement): Scene {
    return Playground.CreateScene(engine, assetsHostUrl, canvas);
}
