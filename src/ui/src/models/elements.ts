import { defineStore } from "pinia";
import { BaseClass } from "./BaseModel";
import { logger } from "../utils/logger";

class BaseElementData extends BaseClass {
  type: string = "BaseElementData";
  id: string = crypto.randomUUID();
  label: string | ((...args: any[]) => string) = "";
  value: string | number = "";
  tooltip: string | ((...args: any[]) => string) = "";
  paretnt: AllBaseElementsData = [];

  // 處理序列化，轉換方法為字符串標識
  toJSON(): Record<string, any> {
    // 建立物件的淺拷貝
    const json: Record<string, any> = { ...this };

    // 處理方法屬性
    for (const key in json) {
      const value = json[key];

      if (typeof value === "function") {
        json[key] = value.name; // 使用函數名稱作為標識
      }
    }

    return json;
  }
}

export function initElementsData(
  elementsData: AllBaseElementsData
): AllBaseElementsData {
  return elementsData.map((elementData) => {
    // elementData.paretnt = elementsData;
    if (allBaseElementsData.includes(elementData.constructor)) {
      return elementData;
    }
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
export const methodRegistry: Record<string, any> = {
  call_tt: function call_tt() {
    logger.info(this);
  },
};

// 雙向註冊及綁定方法
function registerBindMethods(data: Record<PropertyKey, any>): void {
  // 對於每個屬性，檢查是否為函數
  for (const key in data) {
    const value = data[key];

    // 如果屬性是函數，則將其註冊到方法註冊表中
    if (typeof value === "function" && !(key in methodRegistry)) {
      methodRegistry[value.name || crypto.randomUUID] = value;
    }

    // 如果註冊表中有該名稱，綁定其為實例方法
    else if (value in methodRegistry) {
      data[key] = methodRegistry[value];
    }
  }
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
    action?: string | ((...args: any[]) => any);
    visible?: boolean | ((...args: any[]) => boolean);
    disabled?: boolean | ((...args: any[]) => boolean);
    [_: string]: any;
  }) {
    super();
    registerBindMethods(data);
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
    registerBindMethods(data);
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
    registerBindMethods(data);
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
    registerBindMethods(data);
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
    let initedElements = initElementsData(data.children || []);

    super();
    this._init({ ...data, children: initedElements });
  }
}

export type AllBaseElementsData = (
  | Button
  | InputRange
  | InputText
  | Selection
  | Container
)[];
const allBaseElementsData = [
  Button,
  InputRange,
  InputText,
  Selection,
  Container,
];
