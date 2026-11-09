import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";

export class EraseTaskFilter extends from(cnst.EraseTask, (filter) => ({
  query: {},
  sort: {},
})) {}

export class EraseTask extends by(cnst.EraseTask) {}

export class EraseTaskModel extends into(EraseTask, EraseTaskFilter, cnst.eraseTask, () => ({})) {}
