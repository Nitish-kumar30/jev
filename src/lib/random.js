/** Small seeded PRNG so a race can be reproduced from its seed. */
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randBetween = (rng, min, max) => min + rng() * (max - min);
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
