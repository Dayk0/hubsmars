import { defineQuery, exitQuery } from "bitecs";
import { AnimationClip, AnimationMixer } from "three";
import {
  MixerAnimatable,
  MixerAnimatableData,
  LoopAnimation
} from "../bit-components";
import { cleanupMixerAnimatable } from "../inflators/mixer-animatable";
import { cleanupLoopAnimation } from "../inflators/loop-animation";
import { HubsWorld } from "../app";

// TODO: This type declaration should be in bit-components
type MixerAnimatableData = Map<number, {
  mixer: AnimationMixer,
  animations: Array<AnimationClip>
}>;

const mixerAnimatableQuery = defineQuery([MixerAnimatable]);
const exitedMixerAnimatableQuery = exitQuery(mixerAnimatableQuery);

const loopAnimationQuery = defineQuery([LoopAnimation]);
const exitedLoopAnimationQuery = exitQuery(loopAnimationQuery);

// Question: Who should have AnimationMixer?
//           MixerAnimatable component or Scene/App?

export function mixerAnimationSystem(world: HubsWorld, delta: number) : void {
  mixerAnimatableQuery(world).forEach(eid => {
    const { mixer } = MixerAnimatableData.get(eid)!;
    mixer.update(delta / 1000.0);
  });

  // Not sure here is the best place to clean up
  // these two components. We might need to revisit.
  exitedLoopAnimationQuery(world).forEach(eid => {
    cleanupLoopAnimation(eid);
  });

  exitedMixerAnimatableQuery(world).forEach(eid => {
    cleanupMixerAnimatable(eid);
  });
}
