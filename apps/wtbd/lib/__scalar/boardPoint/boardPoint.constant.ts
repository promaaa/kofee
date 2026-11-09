import { via } from "akanjs/constant";

export class BoardPoint extends via((field) => ({
  field: field(String),
})) {}
