import { endpoint, internal } from "akanjs/signal";

import * as srv from "../srv";

export class VisionInternal extends internal(srv.vision, () => ({})) {}

export class VisionEndpoint extends endpoint(srv.vision, ({ query, mutation }) => ({})) {}
