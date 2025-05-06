import { BaseClass } from "./BaseModel";
import { ref } from "vue";

export class Button extends BaseClass {
  constructor(data: {
    id?: string;
    label: string | (() => String);
    icon?: string;
    action?: () => any;
    visible?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
  }) {
    // merge defaults and user-supplied props
    const normalizedData = {
      id: crypto.randomUUID(),
      visible: true,
      disabled: false,
      ...data,
    };
    super(normalizedData);
  }
}

export class InputRange extends BaseClass {
  constructor(data: {
    type?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
  }) {
    // merge defaults and user-supplied props
    const normalizedData = {
      type: "range",
      value: ref(2),
      min: 1,
      max: 100,
      step: 1,
      ...data,
    };
    super(normalizedData);
  }
}

export class InputText extends BaseClass {
  constructor(data: { value?: string; type?: string; label: string }) {
    // merge defaults and user-supplied props
    const normalizedData = { value: ref(""), type: "text", ...data };
    super(normalizedData);
  }
}
