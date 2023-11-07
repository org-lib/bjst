import { ContainerAssetTask, TransformNode, AbstractMesh, Tools, Scene, TextFileAssetTask, MeshAssetTask, Nullable, NodeMaterial, Texture, NodeMaterialBlock, TextureBlock, Vector3, CubeTexture, Sound, AssetContainer, Color3, InputBlock, AssetsManager, Material } from "@babylonjs/core";

declare var _native: any;
declare var Canvas: any;
declare var _CanvasImpl: any;

export class Assets {
    public starfield: Nullable<AbstractMesh> = null;//表示游戏中的星空网格。

    public static loadingComplete: boolean = false;//表示游戏是否加载完成。

    constructor(scene: Scene, assetsHostUrl: string, whenReady: (assets: Assets) => void, whenLoadingComplete: (assets: Assets) => void) {
        var _this = this;

        // MINIMAL loading
        var assetsManagerMinimal = new AssetsManager(scene);
        var starsGeoTask = assetsManagerMinimal.addMeshTask("starsGeoTask", "", assetsHostUrl + "/src/assets/", "fish(SplitTexture).gltf");
        starsGeoTask.onSuccess = function (task: MeshAssetTask) {
            _this.starfield = task.loadedMeshes[0];
            if (_this.starfield) {
                _this.starfield.scaling = new Vector3(10, 10, 10);
                _this.starfield.visibility = 0;
                console.log(_this.starfield)
                var count: number = 0
                _this.starfield.getChildTransformNodes().forEach((m: TransformNode) => {
                    console.log(m._scene.materials)
                    count++
                    m._scene.materials.forEach((m1: Material) => {  
                        console.log(m1.name)
                    });
                });

            }
        };

        assetsManagerMinimal.onTasksDoneObservable.add(() => { 
            console.log("onTasksDoneObservable++")
        });
        assetsManagerMinimal.load();
    }
    async loadAssets() {
        return new Promise((resolve, reject) => {
        });
    }

    dispose() {
    }
}
