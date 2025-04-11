# FFmpeg自動影片剪輯程式實現需求

我需要設計並實現一個可跨平台移植的影片自動剪輯app，名稱FCut，UI使用WEB前端，業務使用python(ffmpeg_toolkit)。
項目需求如下：

## 1. 功能概述

創建一個基於pywebview的跨平台影片自動剪輯app，允許用户:
- 點選不同的剪輯功能
- 使用系統檔案瀏覽器選取影片檔案
- 根據不同的剪輯功能提供不同的可調參數
- 預覽剪輯影片成果
- 將要剪輯的影片放到queue
- 一鍵啟動queue內的影片剪輯，並實時將各影片的剪輯狀態顯示在queue內的影片上

## 2. 技術棧

- **python package管理**: uv
- **UI框架**: pywebview
- **前端核心**: vue
- **UI/Styling**: Tailwind CSS 
- **狀態管理**: Pinia
- **構建工具**: Vite
- **Internationalization**: vue-i18n
- **Backend Integration**: An abstraction layer (backendAPI.ts) to handle communication via pywebview, Tauri invoke, or web APIs, ensuring easy portability.

## 3. 界面佈局

應用界面分為以下幾個主要區域:

1. **頂部導航欄**
   - 應用名稱: "OpenAI Agents Workflow Designer"
   - 生成代碼按鈕
   - 可選: 保存/加載按鈕

2. **左側組件面板**
   - 可拖動的組件類型:
     - Agent節點
     - Runner節點
     - Function Tool節點
   - 每個組件有圖標和名稱
   - 底部可添加簡要使用説明

3. **中央畫布區域**
   - 可拖放區域，用於構建工作流
   - 支持平移和縮放
   - 節點之間可建立連接關係

4. **右側屬性面板**（可選）
   - 顯示當前選中節點的詳細屬性
   - 提供屬性編輯界面

5. **代碼生成彈窗**
   - 展示生成的OpenAI Agents SDK代碼
   - 提供複製按鈕
   - 可選: 代碼高亮顯示

## 4. 組件設計

### 4.1 Agent節點

- **外觀**: 圓角矩形，頂部藍色邊框
- **基本屬性**:
  - name: 文本輸入框
  - instructions: 多行文本輸入框
  - handoff_description: 文本輸入框（可選）
  - output_type: 下拉選擇（無/自定義Pydantic模型）
- **擴展屬性**:
  - handoffs: 顯示已連接的其他Agent
  - tools: 顯示已連接的Function Tools

### 4.2 Runner節點

- **外觀**: 圓角矩形，頂部紅色邊框
- **基本屬性**:
  - input: 文本輸入框
  - 執行模式: 切換按鈕(同步/異步)
  - context: 可選配置
- **注意**: Runner節點應連接到一個Agent節點

### 4.3 Function Tool節點

- **外觀**: 圓角矩形，頂部黃色邊框
- **基本屬性**:
  - name: 文本輸入框
  - parameters: 可添加/刪除的參數列表
  - returnType: 下拉選擇(str, int, float, bool, list, dict, None)
  - implementation: 代碼編輯區

### 4.5 連接關係設計

- Agent → Agent: 表示handoff關係
- Function → Agent: 表示tool關係
- Agent → Runner: 表示執行關係

## 5. 代碼生成器實現

代碼生成器需要根據畫布上的節點和連接關係，生成有效的OpenAI Agents SDK代碼。生成的代碼應包括:

1. 必要的導入語句（agents、asyncio等）
2. Pydantic模型定義（如果需要）
3. Function Tool 定義
4. Agent 定義，包括name、instructions、handoffs、tools
5. Runner執行代碼，根據選擇生成同步或異步版本

代碼生成邏輯示例:

- 對於每個Function Tool節點，生成@function_tool裝飾器函數
- 對於每個Agent節點，生成Agent實例
- 對於連接到Agent的Function節點，添加到Agent的tools參數
- 對於連接到Agent的其他Agent節點，添加到handoffs參數
- 對於Runner節點，生成對應的Runner.run或Runner.run_sync代碼
- 如果有異步執行，添加asyncio.run(main())代碼

## 6. 用户交互設計

1. **組件拖放**:
   - 用户從左側面板拖動組件到畫布
   - 拖放時應顯示可放置位置的提示

2. **節點連接**:
   - 節點有輸入/輸出連接點
   - 用户可以拖動連接線連接不同節點
   - 連接時應驗證是否為有效連接

3. **節點配置**:
   - 點擊節點可選中並顯示配置選項
   - 節點可展開/摺疊以顯示/隱藏詳細選項
   - 節點大小應根據內容自適應

4. **代碼生成**:
   - 點擊"生成代碼"按鈕顯示彈窗
   - 代碼應格式化並高亮顯示
   - 提供複製到剪貼板功能

## 7. 樣式設計

整體風格建議:
- 參考Patreon網站設計，尤其是導航欄
- 簡潔現代的界面
- 柔和的色彩方案
- 充分的留白
- 清晰的視覺層次

節點顏色編碼:
- Agent: 藍色(#3498db)頂部邊框
- Runner: 紅色(#e74c3c)頂部邊框
- Function Tool: 黃色(#f39c12)頂部邊框
- Guardrail: 紫色(#9b59b6)頂部邊框

## 8. 示例參考

參考下面的Agent代碼示例，實現相應的可視化表示:

### 示例1: 基本Agent

python
from agents import Agent, Runner

agent = Agent(name="Assistant", instructions="You are a helpful assistant")
result = Runner.run_sync(agent, "Write a haiku about recursion in programming.")
print(result.final_output)

### 示例2: Handoffs

python
from agents import Agent, Runner
import asyncio

spanish_agent = Agent(
    name="Spanish agent",
    instructions="You only speak Spanish.",
)

english_agent = Agent(
    name="English agent",
    instructions="You only speak English",
)

triage_agent = Agent(
    name="Triage agent",
    instructions="Handoff to the appropriate agent based on the language of the request.",
    handoffs=[spanish_agent, english_agent],
)

async def main():
    result = await Runner.run(triage_agent, input="Hola, ¿cómo estás?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())

### 示例3: Function Tools

python
import asyncio
from agents import Agent, Runner, function_tool

@function_tool
def get_weather(city: str) -> str:
    return f"The weather in {city} is sunny."

agent = Agent(
    name="Hello world",
    instructions="You are a helpful agent.",
    tools=[get_weather],
)

async def main():
    result = await Runner.run(agent, input="What's the weather in Tokyo?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())

### 示例4: Guardrails

python
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from pydantic import BaseModel
import asyncio

class HomeworkOutput(BaseModel):
    is_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about homework.",
    output_type=HomeworkOutput,
)

async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HomeworkOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_homework,
    )

math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent],
    input_guardrails=[
        InputGuardrail(guardrail_function=homework_guardrail),
    ],
)

async def main():
    result = await Runner.run(triage_agent, "who was the first president of the united states?")
    print(result.final_output)

    result = await Runner.run(triage_agent, "what is life")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())

### 示例5: Specialist Agents

python
from agents import Agent, Runner
import asyncio

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent]
)

async def main():
    result = await Runner.run(triage_agent, "What is the capital of France?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())

## 9. 擴展功能（如果可能）

如果時間和資源允許，可以考慮以下擴展功能:

1. **保存/加載**: 允許用户保存工作流為JSON並重新加載
2. **示例模板**: 提供幾個預設的工作流模板
3. **實時預覽**: 在編輯過程中實時更新生成的代碼
4. **導出功能**: 允許導出Python文件
5. **錯誤驗證**: 檢測並提示工作流中的潛在問題
6. **調試視圖**: 提供簡單的調試界面，顯示工作流執行路徑
7. **導入功能**: 從現有Python代碼導入並創建可視化工作流

請根據以上需求實現這個OpenAI Agents可視化工作流設計器。設計應該直觀易用，讓用户能夠輕鬆創建複雜的Agent工作流並生成可用的Python代碼。
