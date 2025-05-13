import { BaseClass } from "./BaseModel";

export type AllBaseElementsData = (
  | Button
  | InputRange
  | InputText
  | Selection
  | Container
)[];

export function initBaseElementData(
  elementsData: AllBaseElementsData
): AllBaseElementsData {
  return elementsData.map((elementData) => {
    switch (elementData.type) {
      case "InputRange":
        return new InputRange(elementData as InputRange);
      case "InputText":
        return new InputText(elementData as InputText);
      case "Button":
        return new Button(elementData as Button);
      case "Selection":
        return new Selection(elementData as Selection);
      case "Container":
        return new Container(elementData as Container);
      default:
        throw new Error("Invalid task elementData type");
    }
  });
}

class BaseElementData extends BaseClass {
  type: string = "BaseElementData";
  id: string = crypto.randomUUID();
  label: string | ((...args: any[]) => string) = "";
  value: string | number = "";
  tooltip: string | ((...args: any[]) => string) = "";
}

export class Button extends BaseElementData {
  type: string = "Button";
  icon?: string;
  action?: (...args: any[]) => any;
  visible: boolean | ((...args: any[]) => boolean) = true;
  disabled: boolean | ((...args: any[]) => boolean) = false;
  constructor(data: {
    id?: string;
    label: string | ((...args: any[]) => string);
    tooltip?: string | ((...args: any[]) => string);
    icon?: string;
    action?: (...args: any[]) => any;
    visible?: boolean | ((...args: any[]) => boolean);
    disabled?: boolean | ((...args: any[]) => boolean);
    [_: string]: any;
  }) {
    super();
    this._init(data);
  }
}

export class InputRange extends BaseElementData {
  type: string = "InputRange";
  min: number = 1;
  max: number = 100;
  step: number = 1;
  constructor(data: {
    id?: string;
    label?: string | ((...args: any[]) => string);
    value?: string | number;
    tooltip?: string | ((...args: any[]) => string);
    min?: number;
    max?: number;
    step?: number;
    [_: string]: any;
  }) {
    super();
    this._init(data);
  }
}

export class InputText extends BaseElementData {
  type: string = "InputText";
  constructor(data: {
    id?: string;
    label?: string | ((...args: any[]) => string);
    value?: string | number;
    tooltip?: string | ((...args: any[]) => string);
    [_: string]: any;
  }) {
    super();
    this._init(data);
  }
}

type Option = {
  label: string;
  value: string | number;
};

export class Selection extends BaseElementData {
  type: string = "Selection";
  options: Option[] = [];
  constructor(data: {
    id?: string;
    label?: string | ((...args: any[]) => string);
    value?: string | number;
    tooltip?: string | ((...args: any[]) => string);
    options?: Option[];
    [_: string]: any;
  }) {
    super();
    this._init(data);
  }
}

export class Container extends BaseElementData {
  type: string = "Container";
  children: AllBaseElementsData = [];
  constructor(data: {
    id?: string;
    children?: AllBaseElementsData;
    [_: string]: any;
  }) {
    let initedElements = initBaseElementData(data.children || []);

    super();
    this._init({ ...data, children: initedElements });
  }
}
