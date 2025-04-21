import { BaseClass, Required } from "./BaseModel";

export class Button extends BaseClass {
  id: string = crypto.randomUUID();
  label: string | Symbol = Required;
  icon: string | Symbol = Required;
  action: (() => void) | undefined = undefined;
  visible: boolean = true;

  constructor(data: Record<string, any>) {
    super();
    this._init(data);
  }
}
