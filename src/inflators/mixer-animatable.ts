import {
  addComponent,
  hasComponent
} from "bitecs";
import {
  AnimationClip,
  AnimationMixer
} from "three";
import {
  MixerAnimatable,
  MixerAnimatableData,
  Object3DTag
} from "../bit-components";
import { HubsWorld } from "../app";

// TODO: Type definition should be done in bit-components?
type MixerAnimatableData = Map<number, {
  mixer: AnimationMixer,
  animations: Array<AnimationClip>
}>;

export type MixerAnimatableParams = {
  animations: Array<AnimationClip>;
};

const DEFAULTS = {
  animations: []
};

export function inflateMixerAnimatable(world: HubsWorld, eid: number, params: MixerAnimatableParams) : number {
  // TODO: Is it possible to guarantee that
  //       AnimatableObject is inflated after
  //       Object3DTag set up?
  if (!hasComponent(world, Object3DTag, eid)) { 
    return eid;
  }

  params = Object.assign({}, DEFAULTS, params);

  // We may remove the dependency with Object3DTag
  // if we (guarantee to) set the target object as
  // the second argument of
  // AnimationMixer.clipAction() possibly called
  // in other inflators or systems.
  // In that case, we may pass Scene or dummy
  // Object3D to the AnimationMixer constructor
  // so far?

  // const object = Object3DTagMap.get(eid)!;
  const object = world.eid2obj.get(eid)!;
  const mixer = new AnimationMixer(object);
  const animations = params.animations.slice();

  addComponent(world, MixerAnimatable, eid);

  // use eid as mapId for now. We may revisit later.
  MixerAnimatableData.set(eid, {
    mixer: mixer,
    animations: animations
  });

  return eid;
}

export function cleanupMixerAnimatable(eid: number) : void {
  // TODO: Check Three.js Animation API to know
  //       whether any clean up is needed
  MixerAnimatableData.delete(eid);
}
