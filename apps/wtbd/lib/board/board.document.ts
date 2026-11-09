import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";

export class BoardFilter extends from(cnst.Board, (filter) => ({
  query: {},
  sort: {},
})) {}

export class Board extends by(cnst.Board) {}

export class BoardModel extends into(Board, BoardFilter, cnst.board, () => ({})) {}
