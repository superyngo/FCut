import { BaseClass } from "./BaseModel";
import { useTasks } from "../stores/stores";
import { ACTIONS } from "./tasks";
import { InstanceTypeOf } from "../utils/types";

class BaseElementData extends BaseClass {
  type: string = "BaseElementData";
  id: string = crypto.randomUUID();
  label: string | ((...args: any[]) => string) = "";
  title: string | ((...args: any[]) => string) = "";
  value: string | number = ""; // 處理序列化，轉換方法為字符串標識
  toJSON(): Record<string, any> {
    // 建立物件的淺拷貝
    const json: Record<string, any> = { ...this };

    // 處理方法屬性
    for (const key in json) {
      const value = json[key];

      if (typeof value === "function") {
        json[key] = value.name; // 使用函數名稱作為標識
      } else if (value instanceof RegExp) {
        // 保存 RegExp 的 source 和 flags，而不是完整的字符串
        json[key] = {
          __type: "RegExp",
          source: value.source,
          flags: value.flags,
        };
      }
    }

    return json;
  }
}
export class Button extends BaseElementData {
  type: string = "Button";
  icon?: string;
  action?: ((...args: any[]) => any) | string;
  visible: boolean | ((...args: any[]) => boolean) = true;
  disabled: boolean | ((...args: any[]) => boolean) = false;
  constructor(
    data: Partial<Button> & {
      [_: string]: any;
    },
    register: boolean = false
  ) {
    super();
    register && registerMapMethods(data);
    this._init(data);
  }
}

export class InputRange extends BaseElementData {
  type: string = "InputRange";
  min: number = 1;
  max: number = 100;
  step: number = 1;
  constructor(
    data: Partial<InputRange> & {
      [_: string]: any;
    },
    register: boolean = false
  ) {
    super();
    register && registerMapMethods(data);
    this._init(data);
  }
}
export class InputText extends BaseElementData {
  type: string = "InputText";
  regexValidator?: RegExp | string;
  oldValue?: string;
  constructor(
    data: Partial<InputText> & {
      [_: string]: any;
    },
    register: boolean = false
  ) {
    super();
    register && registerMapMethods(data);
    this._init(data);
  }
}

export class Selection extends BaseElementData {
  type: string = "Selection";
  options: {
    label: string;
    value: string | number;
  }[] = [];
  constructor(
    data: Partial<Selection> & {
      [_: string]: any;
    },
    register: boolean = false
  ) {
    super();
    register && registerMapMethods(data);
    this._init(data);
  }
}

export class Container extends BaseElementData {
  type: string = "Container";
  children: AllBaseElements[] = [];
  constructor(
    data: Partial<Container> & {
      [_: string]: any;
    },
    register: boolean = false
  ) {
    let initedElements = initElementsData(data.children || []);

    super();
    register && registerMapMethods(data);
    this._init({ ...data, children: initedElements });
  }
}

// Callbacl registry
export const methodRegistry: Record<string, any> = {
  call_tt: function call_tt() {
    const taskStore = useTasks();
    const index = taskStore.tempTask!.settings![ACTIONS.CUT].length - 2 + 1; // 等於 arr.length - 1
    taskStore.tempTask!.settings![ACTIONS.CUT].splice(
      index,
      0,
      createCutCell()
    );
  },
  call_removeCutCell: function () {
    const taskStore = useTasks();
    taskStore.tempTask!.settings![ACTIONS.CUT] = taskStore.tempTask!.settings![
      ACTIONS.CUT
    ].filter((setting) => {
      let handle1 = setting.type != "Container";
      let handle2 = "children" in setting && setting.children[2].id != this.id;
      return handle1 || handle2;
    });
  },
};

// 雙向註冊及綁定方法
function registerMapMethods(data: Record<PropertyKey, any>): void {
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

// Helper class to initialize elements
export class InitElementsData extends Array<AllBaseElements> {
  private validator?: (self: any) => { result: boolean; message?: string };
  constructor(
    elementsData: AllBaseElements[] | InitElementsData,
    validator?: (self: any) => { result: boolean; message?: string }
  ) {
    // 確保 elementsData 是陣列，即使它失去了原型鏈
    let dataArray: AllBaseElements[];

    if (Array.isArray(elementsData)) {
      dataArray = elementsData;
    } else if (elementsData && typeof elementsData === "object") {
      // 如果是類似陣列的物件但失去了原型，嘗試轉換
      if ("length" in elementsData) {
        dataArray = Array.from(elementsData as ArrayLike<AllBaseElements>);
      } else {
        // 如果是普通對象，嘗試從其屬性中獲取陣列
        const values = Object.values(elementsData);
        if (values.length > 0 && typeof values[0] === "object") {
          dataArray = values as AllBaseElements[];
        } else {
          dataArray = [];
        }
      }
    } else {
      dataArray = [];
    }

    const initializedElements = dataArray.map((elementData) => {
      if (
        allBaseElements.includes(
          elementData.constructor as AllBaseElementClasses
        )
      ) {
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

    super(...initializedElements);
    this.validator = validator;
  }

  validate(): boolean {
    if (this.validator) {
      return this.validator(this);
    }
    return true;
  }
}

// Keep the original function for backward compatibility
export function initElementsData(
  elementsData: AllBaseElements[],
  validator?: (self: any) => { result: boolean; message?: string }
): AllBaseElements[] {
  return new InitElementsData(elementsData, validator);
}

// template
export function createCutCell() {
  return new Container({
    children: [
      new InputText({
        label: "Start",
        value: "00:00:000",
        oldValue: "00:00:000",
        regexValidator: /^\d{0,2}:\d{0,2}:\d{0,3}$/,
      }),
      new InputText({
        label: "End",
        value: "00:00:123",
        oldValue: "00:00:123",
        regexValidator: /^\d{0,2}:\d{0,2}:\d{0,3}$/,
      }),
      new Button(
        {
          label: "Remove",
          // 使用註冊的方法
          action: "call_removeCutCell",
        },
        true
      ),
    ],
  });
}

// Types
const allBaseElements = [
  Button,
  InputRange,
  InputText,
  Selection,
  Container,
] as const;
type AllBaseElementClasses = (typeof allBaseElements)[number];
export type AllBaseElements = InstanceTypeOf<AllBaseElementClasses>;
