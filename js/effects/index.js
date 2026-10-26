/**
 * ProStudio Effects Module Index
 * Re-exports unified effect, filter, and transition collections.
 */

import { getAllEffects } from './video-effects.js';
import { Filters } from './filters.js';
import { getAllTransitions } from './transitions.js';
import { AdvancedTools } from '../core/advanced-tools.js';

export const videoEffects = getAllEffects();
export const colorFilters = Filters;
export const basicTransitions = getAllTransitions();
export const aiEffects = AdvancedTools.ai || [];

export default {
    videoEffects,
    colorFilters,
    basicTransitions,
    aiEffects
};
