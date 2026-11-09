import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class BoardRect extends via((field) => ({
  x: field(Float, { default: 0 }),
  y: field(Float, { default: 0 }),
  w: field(Float, { default: 0 }),
  h: field(Float, { default: 0 }),
})) {}
