import { Engine, Vector3, Scene, RenderTargetTexture, VolumetricLightScatteringPostProcess, SphereParticleEmitter, SceneLoader, Texture, Color3, Nullable, StandardMaterial, NodeMaterial, MeshBuilder, Mesh, AbstractMesh, Color4, ArcRotateCamera, TextureBlock, Camera, GlowLayer } from "@babylonjs/core";
import { Assets } from "../Assets";

/*
这段代码是一个名为PlanetBaker的类，用于创建一个行星的渲染目标纹理，并在该纹理上渲染行星和大气层。它还包括一个用于创建行星的方法和一个用于创建太阳后处理效果的静态方法。
在构造函数中，它创建了一个名为 renderTargetPlanet 的 RenderTargetTexture ，并将其添加到场景的自定义渲染目标列表中。
它还创建了一个名为 camera 的 ArcRotateCamera ，并将其设置为 renderTargetPlanet 的活动相机。
接下来，它使用 SceneLoader 从外部加载行星和大气层的网格，并将它们添加到 renderTargetPlanet 的渲染列表中。
然后，它使用 NodeMaterial 从外部加载大气层和行星的着色器，并将它们分配给相应的网格。最后，它返回一个 Mesh 对象，该对象使用 renderTargetPlanet 作为其漫反射纹理，并将其添加到 GlowLayer 的排除网格列表中。
静态方法 CreateSunPostProcess 用于创建一个名为 sun 的 VolumetricLightScatteringPostProcess ，该处理效果用于模拟太阳的体积光散射效果。它将太阳的纹理分配给 sun 的网格，并返回 sun 对象。
*/
export class PlanetBaker {
    renderTargetPlanet: RenderTargetTexture;
    sunPosition: any;
    planet: Nullable<AbstractMesh> = null;
    atmosphere: Nullable<AbstractMesh> = null;
    //private _sun: AbstractMesh;
    /*
    这段代码定义了一个构造函数，用于创建一个包含行星和大气层的场景。它使用了 babylonjs 中的很多概念。
    首先在构造函数中创建了一个名为 renderTargetPlanet 的 RenderTargetTexture 对象，用于将行星和大气层渲染到纹理上。并将其添加到场景的自定义渲染目标数组中。同时对 RenderTargetTexture 进行了一些设置，如清空颜色等。
    接下来，创建了一个名为 camera 的 ArcRotateCamera 相机，并将其指定为 renderTargetPlanet 的活动相机。
    然后通过 SceneLoader 的 AppendAsync 方法异步加载一个包含行星和大气层的 glTF 文件，并在加载完成后执行回调函数。在回调函数中，获取了行星和大气层的 Mesh 对象，并将它们添加到 renderTargetPlanet 的渲染列表中，并将它们从场景中移除。另外，对大气层进行了一些缩放和 Billboard 等设置。
    接下来，通过 NodeMaterial 的 ParseFromFileAsync 方法加载了两种着色器的 json 文件，并在加载完成后执行回调函数。在回调函数中，获取了这两种着色器中的各种属性，并将它们赋值到行星的 Material 中。其中，行星的贴图和颜色等属性都是通过 Material 中的 Block 获取的。
    最后，在构造函数中还设置了太阳的位置（sunPosition）。
    */
    constructor(scene: Scene, assetsHostUrl: string, renderTargetSize: number) {

        this.renderTargetPlanet = new RenderTargetTexture('planetRT', renderTargetSize, scene, false, false);//undefined, undefined, TextureFormat.RGBA8Unorm);
        scene.customRenderTargets.push(this.renderTargetPlanet);
        this.renderTargetPlanet.clearColor = new Color4(0, 0, 0, 0);
        var camera = new ArcRotateCamera("planetRTCamera", 0, 0, 2, new Vector3(0, 0, 0), scene);
        this.renderTargetPlanet.activeCamera = camera;

        // planet
        SceneLoader.AppendAsync(assetsHostUrl + "/src/assets/gltf/planet_mesh.glb").then((loadedScene: Scene) => {
            this.planet = scene.getMeshByName("planet_mesh");
            this.atmosphere = scene.getMeshByName("atmosphere_mesh");

            if (this.atmosphere && this.planet && this.renderTargetPlanet && this.renderTargetPlanet.renderList) {
                this.renderTargetPlanet.renderList.push(this.planet);
                this.renderTargetPlanet.renderList.push(this.atmosphere);
                scene.removeMesh(this.planet);
                scene.removeMesh(this.atmosphere);
                /*
                Mesh.BILLBOARDMODE_ALL 是 Babylon.js 中的枚举类型，它指定了 Mesh 的 BillBoard 模式。Billboard 意为「广告牌」，表示模型一直朝向相机，不论相机移动到哪里，模型的朝向都会调整以保证始终朝向相机。
                Mesh.BILLBOARDMODE_ALL 的具体含义是指 Mesh 具有两种旋转变换：它可以围绕自己的 y 轴旋转，也可以在 x 和 z 轴上做平移变换，以保证始终朝向相机，并保持垂直于 y 轴。这意味着 Mesh 会保持面向相机，但是仍然可以在 x 和 z 轴上移动。
                */
                this.atmosphere.billboardMode = Mesh.BILLBOARDMODE_ALL;
                this.atmosphere.scaling.x = 4;
                this.atmosphere.scaling.y = 4;

                this.planet.scaling = new Vector3(3.6, 3.6, 3.6);
                let shadowTexture = new Texture(assetsHostUrl + "/src/assets/textures/planet_shadow.jpg", scene, false, false)

                // with alpha #ZI6R7T
                NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/atmosphereShader.json", scene).then((atmosphereMaterial: NodeMaterial) => {
                    atmosphereMaterial.build(false);
                    atmosphereMaterial.alpha = 0.999;
                    atmosphereMaterial.alphaMode = Engine.ALPHA_COMBINE;
                    NodeMaterial.ParseFromFileAsync("", assetsHostUrl + "/src/assets/shaders/planetLightingShader.json", scene).then((planetLightingMaterial: NodeMaterial) => {
                        planetLightingMaterial.build(false);
                        let planetBaseColor = planetLightingMaterial.getBlockByName("baseColorTex") as TextureBlock;
                        let planetRoughness = planetLightingMaterial.getBlockByName("roughnessTex") as TextureBlock;
                        let planetNormal = planetLightingMaterial.getBlockByName("normalTex") as TextureBlock;
                        let planetShadow = planetLightingMaterial.getBlockByName("shadowTex") as TextureBlock;
                        this.sunPosition = planetLightingMaterial.getBlockByName("sunPosition");
                        if (this.planet && this.planet.material) {
                            planetBaseColor.texture = (this.planet.material as any).albedoTexture;
                            planetRoughness.texture = (this.planet.material as any).metallicTexture;
                            planetNormal.texture = (this.planet.material as any).bumpTexture;
                            planetShadow.texture = shadowTexture;
                            this.sunPosition.value = new Vector3(-2, -10, 20);
                            this.planet.material = planetLightingMaterial;
                        }
                        if (this.atmosphere) {
                            this.atmosphere.material = atmosphereMaterial;
                        }
                    });
                });
            }
        });
    }
    /*
    这段代码定义了一个名为 createPlanet 的函数，用于创建一个行星的 Mesh 对象。
    
    首先，在函数中创建了一个名为 planet 的平面 Mesh 对象，并对其进行了一些设置，如 BillBoard 模式等。然后创建了一个 StandardMaterial 对象 planetMaterial，并对其进行了一些设置，如禁用光照等。将 renderTargetPlanet 赋值给 planetMaterial 的 diffuseTexture，并对其进行透明度相关设置，包括使用 alpha 通道和组合方法。
    
    将 planetMaterial 赋值给 planet 的 material 属性，并设置 planet 的 alphaIndex。
    
    最后，将 planet 添加到 glowLayer 的排除列表中，并将 renderTargetPlanet 的刷新率设置为 0，最终返回 planet。
    */
    public createPlanet(scene: Scene, worldSize: number, glowLayer: GlowLayer): Mesh {
        var planet = MeshBuilder.CreatePlane("planetPlane", { size: worldSize }, scene);
        planet.billboardMode = Mesh.BILLBOARDMODE_ALL | Mesh.BILLBOARDMODE_USE_POSITION;
        var planetMaterial = new StandardMaterial("", scene);
        planetMaterial.backFaceCulling = false;
        planetMaterial.disableLighting = true;
        planetMaterial.diffuseTexture = this.renderTargetPlanet;
        planetMaterial.emissiveColor = new Color3(1, 1, 1);
        planetMaterial.alphaMode = Engine.ALPHA_COMBINE;
        planetMaterial.diffuseTexture.hasAlpha = true;
        planetMaterial.useAlphaFromDiffuseTexture = true;
        planet.material = planetMaterial;
        planet.alphaIndex = 5;
        glowLayer.addExcludedMesh(planet);

        this.renderTargetPlanet.refreshRate = 0;
        return planet;
    }
    /*
    Babylon.js 中的 VolumetricLightScatteringPostProcess（体积光散射后处理）是一种用于实现逼真的光线扩散效果的后处理。它是一种基于屏幕空间的后处理，可以在场景中添加逼真的体积光效果。该后处理使用了深度纹理和颜色纹理，通过对场景中的像素进行采样和计算，来模拟光线在空气中的传播和散射。
    
    使用 VolumetricLightScatteringPostProcess 需要以下步骤：
    
    1. 创建一个 VolumetricLightScatteringPostProcess 实例：
    
    ```javascript
    var vls = new BABYLON.VolumetricLightScatteringPostProcess("vls", 1.0, camera, mesh, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
    ```
    
    其中，参数含义如下：
    
    - "vls"：后处理的名称。
    - 1.0：后处理的权重。
    - camera：相机对象。
    - mesh：体积光效果的源对象。
    - 100：采样次数。
    - BABYLON.Texture.BILINEAR_SAMPLINGMODE：纹理采样模式。
    - engine：渲染引擎对象。
    - false：是否使用屏幕空间的光源。
    
    */
    public static CreateSunPostProcess(camera: Camera, scene: Scene, assets: Assets): VolumetricLightScatteringPostProcess {
        const sun = new VolumetricLightScatteringPostProcess('volumetric', 1.0, camera, undefined, 100, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        // By default it uses a billboard to render the sun, just apply the desired texture
        if (sun.mesh && sun.mesh.material) {
            (sun.mesh.material as any).diffuseTexture = assets.sunTexture;
            (sun.mesh.material as any).diffuseTexture.hasAlpha = true;
            sun.mesh.scaling = new Vector3(150, 150, 150);
        }
        return sun;
    }
}