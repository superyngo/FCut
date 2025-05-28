import { BaseClass } from "./BaseModel";
import { useTasks } from "../stores/stores";
import { ACTIONS } from "./tasks";
import { InstanceTypeOf } from "../utils/types";

class BaseElementData extends BaseClass {
  type: string = "BaseElementData";
  id: string = crypto.randomUUID();
  label: string | ((...args: any[]) => string) = "";
  title: string | ((...args: any[]) => string) = "";
  value: string | number = "";
  // 處理序列化，轉換方法為字符串標識
  toJSON(): Record<string, any> {
    // 建立物件的淺拷貝
    const json: Record<string, any> = { ...this };

    // 處理方法屬性
    for (const key in json) {
      const value = json[key];

      if (typeof value === "function") {
        json[key] = value.name; // 使用函數名稱作為標識
      } else if (value instanceof RegExp) {
        json[key] = value.toString(); // 將 RegExp 轉換為字串格式
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

// Helper function to initialize elements
export function initElementsData(
  elementsData: AllBaseElements[]
): AllBaseElements[] {
  return elementsData.map((elementData) => {
    if (
      allBaseElements.includes(elementData.constructor as AllBaseElementClasses)
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
}

// template
export function createCutCell() {
  return new Container({
    children: [
      new InputText({
        label: "Start",
        value: "00:00:000",
        regexValidator: "123",
      }),
      new InputText({
        label: "End",
        value: "00:00:123",
        regexValidator: /^\d{2}:\d{2}:\d{3}$/,
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
