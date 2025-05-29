import {
  InputText,
  InitElementsData,
  initElementsData,
  createCutCell,
} from "./src/models/elements";
let a = /^\d{2}:\d{2}:\d{3}$/;
let b = new InputText({ regexValidator: a });
let c = createCutCell();
let d = [a, b, c];
JSON.stringify(d, null, 2);
JSON.parse(JSON.stringify(d, null, 2));
let f = initElementsData([c], () => true);
let g = new InitElementsData([c], () => true);
