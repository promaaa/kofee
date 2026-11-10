import { serve } from "akanjs/service";

export class NunchiService extends serve("nunchi" as const, { serverMode: "batch" }, () => ({})) {}
