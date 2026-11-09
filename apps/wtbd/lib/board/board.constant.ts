import { via } from "akanjs/constant";

export class BoardInput extends via((field) => ({
  name: field(String),
})) {}

export class BoardObject extends via(BoardInput, (field) => ({})) {}

export class LightBoard extends via(BoardObject, ["name"] as const, (resolve) => ({})) {}

export class Board extends via(BoardObject, LightBoard, (resolve) => ({})) {}

export class BoardInsight extends via(Board, (field) => ({})) {}
