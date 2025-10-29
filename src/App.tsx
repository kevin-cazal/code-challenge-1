import { useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Play, CheckCircle2, XCircle, Code2 } from 'lucide-react';
//import { runCodeTest, TestResult } from './utils/wasmRunner';
import { runCodeTest, TestResult } from './utils/v86LabRunner';
import { Language, getLanguageExtension } from './utils/languages';
import { V86Emulator } from './components/V86Emulator';


const defaultCodes: Record<Language, string> = {
  python: `# Coding Challenge: Write code that prints "Hello, Epitech Academy!" to standard output

def main():
    # Write your code here
    # print("Hello, Epitech Academy!")

if __name__ == "__main__":
    main()`,
  c: `// Coding Challenge: Write code that prints "Hello, Epitech Academy!" to standard output

#include <stdio.h>

int main() {
    // Write your code here
    // printf("Hello, Epitech Academy!\\n");
    return 0;
}`,
  lua: `-- Coding Challenge: Write code that prints "Hello, Epitech Academy!" to standard output

function main()
    -- Write your code here
    -- print("Hello, Epitech Academy!")
end

main()`,
};

function App() {
  const editorRef = useRef<any>(null);
  const v86EmulatorRef = useRef<any>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState<Language>('python');

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  function getEditorValue(): string {
    if (editorRef.current) {
      return editorRef.current.getValue();
    }
    return '';
  }


  async function handleRunTests() {
    const code = getEditorValue();
    setIsRunning(true);
    setTestResult(null);

    // Write the code to a file in the emulator
    if (v86EmulatorRef.current && v86EmulatorRef.current.writeFile) {
      if (v86EmulatorRef.current.clearFile) {
        await v86EmulatorRef.current.clearFile(`/tmp/code_challenge/code.*`);
      }
      const filename = `/tmp/code_challenge/code.${getLanguageExtension(language)}`;
      /*
      * TODO: Add a script to the Linux distribution to run the code and test the result.
      * The script should be a shell script that reads a ".code" file and runs the code.
      * ".code" file format is not defined yet.
      * IDEA for an easy to parse format with a shell script:
      * Line 1: Language
      * Line 2: Timeout in seconds
      * Line 4: User code to run (base64 encoded)
      * Line 3: Expected output (base64 encoded) 
      * TODO: Add this shell script to the Linux distribution.
      * TODO: Update Alpine Linux distribution to add the musl-dev package to provide the standard C library headers.
      * TODO: Fix lua support.
      * TODO: NodeJS support. (QuickJS ?)
      * TODO: microPython support ?
      * TODO: replace GCC with TCC (Tiny C Compiler) for C support ?.
      */
      console.log(`Writing code to ${filename}`);
      await v86EmulatorRef.current.writeFile(filename, code);
      await v86EmulatorRef.current.serial0_send(`/opt/detect-language/run_tests.sh\n`);
    }
  }

  function handleLanguageChange(newLanguage: Language) {
    setLanguage(newLanguage);
    setTestResult(null);
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-8 h-8 text-slate-700" />
            <h1 className="text-2xl font-semibold text-slate-800">Code Challenge</h1>
          </div>
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-6 gap-4">
        <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-200">
          <span className="text-sm font-medium text-slate-700">Language:</span>
          <div className="flex gap-2">
            {(['python', 'c', 'lua'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  language === lang
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {/* Python Logo */}
                {lang === 'python' && <i className="devicon-python-plain" style={{ fontSize: '16px' }} />}
                
                {/* C Logo */}
                {lang === 'c' && <i className="devicon-c-plain" style={{ fontSize: '16px' }} />}
                
                {/* Lua Logo */}
                {lang === 'lua' && <i className="devicon-lua-plain" style={{ fontSize: '16px' }} />}
                
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div 
            className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" 
            style={{ height: '600px' }}
          >
            <Editor
              key={language}
              height="600px"
              defaultLanguage={language}
              defaultValue={defaultCodes[language]}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                fontFamily: 'Menlo, Monaco, Courier New, monospace',
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
          
          <V86Emulator 
            ref={v86EmulatorRef}
            onReady={() => {}}
            onError={(error) => console.error('v86 emulator error:', error)}
          />
        </div>

        {testResult && (
          <div
            className={`bg-white rounded-xl shadow-md border-2 p-6 transition-all duration-300 ${
              testResult.passed
                ? 'border-green-400 bg-green-50'
                : 'border-red-400 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-4">
              {testResult.passed ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    testResult.passed ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testResult.message}
                </h3>
                {testResult.details && (
                  <p
                    className={`text-sm ${
                      testResult.passed ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {testResult.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
