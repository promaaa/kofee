import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class NunchiInternal extends internal(srv.nunchi, () => ({})) {}

export class NunchiEndpoint extends endpoint(srv.nunchi, () => ({})) {}
