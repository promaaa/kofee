import { serve } from "akanjs/service";

export class VisionService extends serve("vision" as const, ({ use, service, env, signal }) => ({})) {}
