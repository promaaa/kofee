import { serve } from "akanjs/service";

import * as db from "../db";

export class BoardService extends serve(db.board, ({ use, service }) => ({})) {}
