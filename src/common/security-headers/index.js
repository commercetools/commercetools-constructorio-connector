import { flowright } from 'lodash';
import DnsPrefetchControl from './dns-prefetch-control';
import Frameguard from './frameguard';
import Hsts from './hsts';

const dnsPrefetchControl = DnsPrefetchControl({ allow: false });
const frameguard = Frameguard();
const hsts = Hsts();

export default () => flowright(hsts, frameguard, dnsPrefetchControl);
