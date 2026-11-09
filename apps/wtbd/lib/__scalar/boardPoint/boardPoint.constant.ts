import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class BoardPoint extends via((field) => ({
  x: field(Float, { default: 0 }),
  y: field(Float, { default: 0 }),
})) {}
