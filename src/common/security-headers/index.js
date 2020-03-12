import flowright from 'lodash.flowright';
import DnsPrefetchControl from './dns-prefetch-control';
import Frameguard from './frameguard';
import Hsts from './hsts';

const dnsPrefetchControl = DnsPrefetchControl({ allow: false });
const frameguard = Frameguard();
const hsts = Hsts();

export default () => flowright(hsts, frameguard, dnsPrefetchControl);
