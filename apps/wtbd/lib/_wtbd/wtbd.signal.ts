import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class WtbdInternal extends internal(srv.wtbd, () => ({})) {}

export class WtbdEndpoint extends endpoint(srv.wtbd, () => ({})) {}
