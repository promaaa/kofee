import { via } from "akanjs/constant";

export class EraseTaskInput extends via((field) => ({
  name: field(String),
})) {}

export class EraseTaskObject extends via(EraseTaskInput, (field) => ({})) {}

export class LightEraseTask extends via(EraseTaskObject, ["name"] as const, (resolve) => ({})) {}

export class EraseTask extends via(EraseTaskObject, LightEraseTask, (resolve) => ({})) {}

export class EraseTaskInsight extends via(EraseTask, (field) => ({})) {}
