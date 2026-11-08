import type { SimSetup } from '../content/types';
import { BodiesSimView } from './BodiesSimView';
import { CircleSimView } from './CircleSimView';
import { InclineSimView } from './InclineSimView';
import { PulleySimView } from './PulleySimView';
import { RampSimView } from './RampSimView';

/** The sim view for a predict step's setup. */
export function SimForSetup({ setup, label, locked }: { readonly setup: SimSetup; readonly label: string; readonly locked: boolean }) {
  switch (setup.sim) {
    case 'energy': return <RampSimView params={setup.ramp} startS={setup.startS} label={label} locked={locked} />;
    case 'collisions':
    case 'com': return <BodiesSimView preset={setup.world} showCom={setup.sim === 'com'} label={label} locked={locked} />;
    case 'incline': return <InclineSimView params={setup.params} startS={setup.startS} startV={setup.startV} label={label} locked={locked} />;
    case 'pulley': return <PulleySimView params={setup.params} label={label} locked={locked} />;
    case 'circle': return <CircleSimView params={setup.params} releaseAt={setup.releaseAt} label={label} locked={locked} />;
  }
}
