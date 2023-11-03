import { Nullable, Vector3, Quaternion, TransformNode } from "@babylonjs/core";
import { Input } from "./Inputs/Input";

/*
这段代码定义了一个名为Agent的类，它是一个基础类，用于表示游戏中的角色或物体。该类包含了一些属性和方法，用于描述和操作这个角色或物体。

该类包含了一些向量属性，例如 forward 、 up 、 right ，分别表示该角色或物体在前进方向、上方向、右方向上的单位向量。另外还有一个四元数属性 quat ，用于表示该物体的旋转状态。同时，还有一个 三维向量属性 position ，用于表示该物体的当前位置。

除此之外，该类中还定义了一个名为 input 的属性，表示该物体的输入状态。该属性的类型是 Input ，是一个自定义的输入类，用于记录该物体的键鼠输入状态。同时，还有一个名为 transformNode 的属性，用于管理该物体的变换节点。
*/
export class Agent {
    forward: Vector3 = new Vector3();
    up: Vector3 = new Vector3();
    right: Vector3 = new Vector3();
    quat: Quaternion = new Quaternion();
    position: Vector3 = new Vector3();

    input: Input = new Input();
    transformNode: Nullable<TransformNode> = null;
    /*
    定义了一个名为 goToward 的方法，用于让该物体朝着某个方向移动。该方法接受两个参数：目标位置和目标方向，以及一个转向比率。该方法会根据目标方向计算出当前应该朝哪个方向前进，并将结果存入输入状态中。同时返回当前物体前进方向与目标方向的点积值。
    */
    // modify input to go toward a direction and return dot product 
    public goToward(aimPos: Vector3, aimAt: Vector3, turnRatio: number) {
        const dif = aimPos.subtract(aimAt);
        dif.normalize();
        const dotTgt = Vector3.Dot(dif, this.forward);
        this.input.dx = Vector3.Dot(dif, this.right) * turnRatio;//0.02;
        this.input.dy = -Vector3.Dot(dif, this.up) * turnRatio;//0.02;
        return dotTgt;
    }
}
