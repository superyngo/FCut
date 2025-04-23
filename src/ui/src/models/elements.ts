import { BaseClass } from "./BaseModel";

export class Button extends BaseClass {
  constructor(data: {
    id?: string;
    label: string;
    icon?: string;
    action?: () => any;
    visible?: boolean;
  }) {
    // merge defaults and user-supplied props
    const normalizedData = {
      id: crypto.randomUUID(),
      visible: true,
      ...data,
    };
    super(normalizedData);
  }
}

export class InputRange extends BaseClass {
  constructor(data: {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    type?: string;
    label?: string;
  }) {
    // merge defaults and user-supplied props
    const normalizedData = {
      value: 2,
      min: 1,
      max: 100,
      step: 1,
      type: "range",
      ...data,
    };
    super(normalizedData);
  }
}

export class InputText extends BaseClass {
  constructor(data: { value?: string; type?: string; label: string }) {
    // merge defaults and user-supplied props
    const normalizedData = { value: "", type: "text", ...data };
    super(normalizedData);
  }
}
