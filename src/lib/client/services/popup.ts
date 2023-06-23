import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
import { storePopup } from '@skeletonlabs/skeleton';

export function initPopups() {
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
}
