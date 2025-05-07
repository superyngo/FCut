import { BaseClass } from "./BaseModel";

export class Button extends BaseClass {
  id: string = crypto.randomUUID();
  label: string | (() => String) = "";
  icon?: string;
  action?: () => any;
  visible: boolean | (() => boolean) = true;
  disabled: boolean | (() => boolean) = false;
  constructor(data: {
    id?: string;
    label: string | (() => String);
    icon?: string;
    action?: () => any;
    visible?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
  }) {
    super();
    this._init(data);
  }
}

export class InputRange extends BaseClass {
  id: string = crypto.randomUUID();
  type: string = "range";
  value: number = 2;
  min: number = 1;
  max: number = 100;
  step: number = 1;
  label: string = "";
  constructor(data: {
    id?: string;
    type?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
  }) {
    super();
    this._init(data);
  }
}

export class InputText extends BaseClass {
  value: string = "";
  type: string = "text";
  label: string = "";
  constructor(data: { value?: string; type?: string; label: string }) {
    super();
    this._init(data);
  }
}
