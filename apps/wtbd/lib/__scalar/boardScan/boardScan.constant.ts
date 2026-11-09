import { via } from "akanjs/constant";

export class BoardScan extends via((field) => ({
  field: field(String),
})) {}
