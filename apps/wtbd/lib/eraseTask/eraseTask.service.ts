import { serve } from "akanjs/service";

import * as db from "../db";

export class EraseTaskService extends serve(db.eraseTask, ({ use, service }) => ({})) {}
