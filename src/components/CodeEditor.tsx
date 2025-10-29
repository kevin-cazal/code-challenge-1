import { Editor } from '@monaco-editor/react';
import { useRef } from 'react';
import type * as monaco from 'monaco-editor';

interface CodeEditorProps {
  defaultValue?: string;
  language?: string;
  theme?: string;
  height?: string;
}

export function CodeEditor({
  defaultValue = '// Write your code here\n',
  language = 'javascript',
  theme = 'vs-dark',
  height = '100%',
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
  }

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      defaultValue={defaultValue}
      theme={theme}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: true,
      }}
    />
  );
}

// Export utility function (suppress fast-refresh warning as this is intentional)
// eslint-disable-next-line react-refresh/only-export-components
export function getEditorValue(editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>): string {
  if (editorRef.current) {
    return editorRef.current.getValue();
  }
  return '';
}
