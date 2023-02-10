import {
  addComponent,
  hasComponent
} from "bitecs";
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  LoopRepeat
} from "three";
import {
  LoopAnimation,
  LoopAnimationData,
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
type LoopAnimationSata = Map<number, Array<AnimationAction>>;

export type LoopAnimationParams = {
  activeClipIndex: number;
  paused: boolean;
  startOffset: number;
  timeScale: number;
  // TODO: Do we need to keep supporting the following two params?
  // DEPRECATED: Use activeClipIndex instead since animation
  //             names are not unique
  clip?: string;
  // Support for Spoke->Hubs activeClipIndices struct
  activeClipIndices?: Array<number>;
};

const DEFAULTS = {
  activeClipIndex: 0,
  paused: false,
  startOffset: 0,
  timeScale: 1.0
};

const getActiveClips = (animations: Array<AnimationClip>, params: LoopAnimationParams) : Array<AnimationClip> => {
  if (params.activeClipIndices !== undefined &&
      params.activeClipIndices.length > 0) {
    return params.activeClipIndices.map(index => animations[index]);
  } else if (params.clip !== undefined &&
             params.clip !== "") {
    const activeClips = [];
    const clipNames = params.clip!.split(",");
    for (let i = 0; i < clipNames.length; i++) {
      const clipName = clipNames[i];
      const foundClip = animations.find((clip: AnimationClip) => {
        return clip.name === clipName;
      });
      if (foundClip) {
        activeClips.push(foundClip);
      } else {
        console.warn(`Could not find animation names '${clipName}' in `, animations);
      }
    }
    return activeClips;
  } else {
    return [animations[params.activeClipIndex]];
  }
};

export function inflateLoopAnimation(world: HubsWorld, eid: number, params: LoopAnimationParams) : number {
  // Is it possible to guarantee that LoopAnimation
  // inflation happens after Object3DTag and MixerAnimatable
  // set up?
  if (!hasComponent(world, Object3DTag, eid) ||
      !hasComponent(world, MixerAnimatable, eid)) {
    return eid;
  }

  params = Object.assign({}, DEFAULTS, params);

  // const object = Object3DTagMap.get(eid)!;
  const object = world.eid2obj.get(eid)!;
  const { mixer, animations } = MixerAnimatableData.get(eid)!;

  const activeClips = getActiveClips(animations, params);
  const actions = [];
  for (let i = 0; i < activeClips.length; i++) {
    const clip = activeClips[i];

    // Ignore if activeClipIndex is out of range from the animations
    if (!clip) {
      continue;
    }

    const action = mixer.clipAction(activeClips[i], object);
    action.enabled = true;
    action.paused = params.paused;
    action.time = params.startOffset;
    action.timeScale = params.timeScale;
    action.setLoop(LoopRepeat, Infinity)
    action.play();
    actions.push(action);
  }

  addComponent(world, LoopAnimation, eid);

  LoopAnimationData.set(eid, actions);

  return eid;
}

export function cleanupLoopAnimation(eid: number) : void {
  const actions = LoopAnimationData.get(eid)!;
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    action.enabled = false;
    action.stop();
    // TODO: Check Three.js Animation API to know
    //       whether any other clean up needed.
  }
  LoopAnimationData.delete(eid);
}
