import type { OrbHue } from '../../model/types';

export const HUES: OrbHue[] = ['teal', 'violet', 'amber', 'rose', 'gray'];

const grad = (id: string, a: string, b: string, c: string) =>
  `<radialGradient id="${id}" cx="38%" cy="30%" r="78%">` +
  `<stop offset="0%" stop-color="${a}"/>` +
  `<stop offset="44%" stop-color="${b}"/>` +
  `<stop offset="100%" stop-color="${c}"/></radialGradient>`;

export const DEFS_MARKUP =
  `<radialGradient id="gOrigin" cx="38%" cy="30%" r="78%">` +
  `<stop offset="0%" stop-color="#d2ecff"/><stop offset="42%" stop-color="#5a9fda"/>` +
  `<stop offset="100%" stop-color="#235787"/></radialGradient>` +
  grad('gteal', '#d7fff3', '#3fc2a3', '#1a7765') +
  grad('gviolet', '#eae4ff', '#9277e6', '#553fa6') +
  grad('gamber', '#ffeede', '#f0a86b', '#b06a32') +
  grad('grose', '#ffe0ea', '#e0789a', '#9a3f5e') +
  grad('ggray', '#e9eef4', '#9fb2c6', '#5d6f82') +
  grad('gsuccess', '#d8ffe9', '#46d39a', '#1c8f63') +
  `<filter id="goo">` +
  `<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>` +
  `<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -10"/>` +
  `</filter>`;

