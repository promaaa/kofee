import { via } from "akanjs/constant";

export class BoardRect extends via((field) => ({
  field: field(String),
})) {}
