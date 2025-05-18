// 舊版本使用方式
import { onKeys as oldOnKeys, MODIFIER_KEYS } from "./keyEvents";

// 舊版本用法
const oldListenerHandle = oldOnKeys({
  a: {
    id: "my-a-press", // 在舊版中 id 會被自動覆蓋
    type: "onPress",
    callback: () => console.log("按下了 A"),
    modifiers: [MODIFIER_KEYS.Control],
    preventDefault: true,
  },
  b: [
    {
      type: "onPress",
      callback: () => console.log("按下了 B"),
    },
    {
      type: "onRelease",
      callback: () => console.log("釋放了 B"),
    },
  ],
});

// 新版本使用方式
import { onKeys as newOnKeys, MODIFIER_KEYS } from "./keyEvents.new";

// 新版本用法
const newListenerHandle = newOnKeys([
  {
    key: "a",
    type: "onPress",
    callback: () => console.log("按下了 A"),
    modifiers: [MODIFIER_KEYS.Control],
    preventDefault: true,
  },
  {
    key: "b",
    type: "onPress",
    callback: () => console.log("按下了 B"),
  },
  {
    key: "b",
    type: "onRelease",
    callback: () => console.log("釋放了 B"),
  },
]);

// 在兩個版本中，都可以通過調用返回的函數來移除監聽器
// oldListenerHandle();  // 移除舊版本的所有監聽器
// newListenerHandle();  // 移除新版本的所有監聽器
