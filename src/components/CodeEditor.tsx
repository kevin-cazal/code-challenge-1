import { Editor } from '@monaco-editor/react';
import { useRef } from 'react';

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
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any) {
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

export function getEditorValue(editorRef: React.RefObject<any>): string {
  if (editorRef.current) {
    return editorRef.current.getValue();
  }
  return '';
}
