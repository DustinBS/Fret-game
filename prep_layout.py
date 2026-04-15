import os, re

def add_legend(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    if "import { LegendPanel }" not in text:
        text = text.replace("import { useHistory, HistoryPanel } from './History';", "import { useHistory, HistoryPanel } from './History';\nimport { LegendPanel } from './LegendPanel';")
        
    text = text.replace(
        "        <HistoryPanel history={history} onClear={clearHistory} onRestore={(state) => setClickedFrets(state)} />\n      </aside>",
        "        <HistoryPanel history={history} onClear={clearHistory} onRestore={(state) => setClickedFrets(state)} />\n        <LegendPanel />\n      </aside>"
    )
    
    text = text.replace(
        "        <HistoryPanel \n            history={history} \n            onClear={clearHistory} \n            onRestore={(state) => {\n                setQuizData(state.quizData);\n                setInputRoot(state.inputRoot);\n                setInputQuality(state.inputQuality);\n                setInputShape(state.inputShape);\n                setGameState('REVEALED');\n            }} \n        />\n      </aside>",
        "        <HistoryPanel \n            history={history} \n            onClear={clearHistory} \n            onRestore={(state) => {\n                setQuizData(state.quizData);\n                setInputRoot(state.inputRoot);\n                setInputQuality(state.inputQuality);\n                setInputShape(state.inputShape);\n                setGameState('REVEALED');\n            }} \n        />\n        <LegendPanel />\n      </aside>"
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)

add_legend('src/components/SandboxMode.tsx')
add_legend('src/components/ChordQuizMode.tsx')
