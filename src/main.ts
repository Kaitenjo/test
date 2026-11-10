import { loadSignals } from '@xaendar/signals';

// The signals of Xaendar must be installed before @xaendar/core is evaluated, hence the dynamic import
loadSignals();
import('./bootstrap').catch((error: unknown) => console.error(error));
