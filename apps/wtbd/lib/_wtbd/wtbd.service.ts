import { serve } from "akanjs/service";

export class WtbdService extends serve("wtbd" as const, { serverMode: "batch" }, () => ({})) {}
