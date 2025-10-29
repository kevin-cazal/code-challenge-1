import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal, BugOff } from 'lucide-react';
import { destroyEmulator } from '../utils/v86LabRunner';
import { Language, getLanguageExtension } from '../utils/languages';

interface V86EmulatorProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

export const V86Emulator = forwardRef<any, V86EmulatorProps>(({ onReady, onError }, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialOutput, setSerialOutput] = useState<string>('');
  const [serialInput, setSerialInput] = useState<string>('');
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Emulator reference and initialization tracking
  const emulatorRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Function to send data to serial0
  const sendSerialData = (data: string) => {
    if (emulatorRef.current && data.trim()) {
      emulatorRef.current.serial0_send(data);
      setSerialInput('');
    }
  };

  // Function to write a file to the emulator using base64 encoding
  const writeFile = async (path: string, data: string) => {
    if (emulatorRef.current) {
      // Encode the data in base64
      const base64Data = btoa(data);
      
      // Create the command using base64 decode
      const command = `mkdir -p $(dirname ${path}) && echo '${base64Data}' | base64 -d > ${path}\n`;
      
      console.log(`Creating file ${path} using base64 encoding`);
      emulatorRef.current.serial0_send(command);
      return true;
    }
    return false;
  };

  const clearFile = async (path: string) => {
    if (emulatorRef.current) {
      emulatorRef.current.serial0_send(`rm -fr ${path}\n`);
      return true;
    }
    return false;
  };

  // Function to run test command
  const runTest = async (language: Language, code: string) => {
    if (emulatorRef.current && isReady) {
      var buffer = new Uint8Array(code.length);

      buffer.set(code.split("").map(function(chr) { return chr.charCodeAt(0); }));

      const extension = getLanguageExtension(language);
      const filename = `/root/code.${extension}`;
      
      console.log(`Creating file ${filename}`);
      await emulatorRef.current.create_file(filename, buffer);
      if (language === 'python') {
        await emulatorRef.current.serial0_send(`python3 ${filename}\n`);
      }
      if (language === 'c') {
        await emulatorRef.current.serial0_send(`gcc ${filename} -o /root/bin.${extension}\n`);
      }
      if (language === 'lua') {
        await emulatorRef.current.serial0_send(`lua ${filename}\n`);
      }
    }
    return {
      passed: true,
      message: 'Test passed (not implemented)',
      details: 'Test passed (not implemented)',
    };
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    writeFile: writeFile,
    runTest: runTest,
    clearFile: clearFile
  }));

  // Handle Enter key in input
  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendSerialData(serialInput + '\n');
    }
  };

  useEffect(() => {
    // Only initialize once
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeEmulator = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import v86
        const { V86 } = await import('v86');

        const config = {
          serial_container: terminalRef.current,
          wasm_path: "/v86.wasm",
          memory_size: 512 * 1024 * 1024,
          bios: { url: "bios/seabios.bin" },
          filesystem: {
            baseurl: "images/alpine-rootfs-flat",
            basefs: "images/alpine-fs.json",
          },
          autostart: true,
          bzimage_initrd_from_filesystem: true,
          cmdline:
            "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable console=ttyS0",
            disable_speaker: true,
            disable_mouse: true,
            disable_keyboard: true,
            initial_state: { url: "images/alpine-state.bin" }
        };
        
        const emulator = new V86({
          ...config
        });

        // Store emulator reference
        emulatorRef.current = emulator;
        
        // Create checkTrigger function linked to this emulator instance
        emulator.checkTrigger = (output: string) => {
          // Define trigger patterns and their actions
          const triggers = [
            {
              pattern: 'localhost:~# ', // Show full boot process for debugging purposes
              action: () => {
                setIsReady(true);
                setIsLoading(false); // Stop loading when shell prompt is detected
                onReady?.();
              }
            },
            {
              pattern: '#DONE#',
              action: () => {
                console.log('🎉 DONE!');
              }
            }
          ];

          // Check each trigger pattern
          triggers.forEach(trigger => {
            if (output.endsWith(trigger.pattern)) {
              trigger.action();
            }
          });
        };
        
        // Expose emulator globally for console access
        (window as any).emulator = emulator;
        
        // Expose writeFile method to window for debugging
        (window as any).writeFile = writeFile;
        

        emulator.add_listener('emulator-ready', () => {
          console.log('v86 emulator is ready');
          // Keep loading until shell prompt is detected
        });

        // Listen for serial output
        emulator.add_listener('serial0-output-byte', (byte: number) => {
          const char = String.fromCharCode(byte);
          
          // Skip carriage returns (like in serial.html)
          if (char === '\r') {
            return; 
          }
          
          // Update serial output
          setSerialOutput(prev => {
            const newOutput = prev + char;
            emulator.checkTrigger(newOutput);
            return newOutput;
          });
          
          // Auto-scroll terminal
          setTimeout(() => {
            if (terminalRef.current) {
              terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
          }, 10);
        });

        emulator.add_listener('emulator-error', (error: any) => {
          console.error('v86 emulator error:', error);
          setError(error.message || 'Unknown emulator error');
          setIsLoading(false);
          onError?.(error.message || 'Unknown emulator error');
        });


      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize emulator';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    initializeEmulator();

    return () => {
      // Only cleanup on unmount, not on re-renders
      if (emulatorRef.current) {
        console.log('Destroying v86 emulator');
        emulatorRef.current.destroy();
        emulatorRef.current = null;
        isInitializedRef.current = false;
      }
      // Also cleanup the global emulator
      destroyEmulator();
    };
  }, []); // Empty dependency array - only run once


  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-slate-600" />
        <BugOff className="w-5 h-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">v86 Emulator (DEBUG MODE)</span>
        {isLoading && <span className="text-sm text-slate-500">⏳ Loading</span>}
        {isReady && <span className="text-sm text-green-600 font-medium">✅ Emulator Ready</span>}
        {error && <div className="w-2 h-2 bg-red-500 rounded-full" />}
      </div>
      
      <div className="p-4">
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️</div>
            <p className="text-sm text-red-600 mb-1">Emulator Error</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        )}
        
        {!error && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-700 px-3 py-2 border-b border-slate-600">
                  <p className="text-xs text-slate-300 font-mono">Serial Input</p>
                </div>
                <div className="p-3 h-48 flex flex-col gap-2">
                  <textarea
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyPress={handleInputKeyPress}
                    placeholder="Type commands here and press Enter to send..."
                    className="flex-1 w-full bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
                    style={{ 
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      lineHeight: '1.4'
                    }}
                  />
                  <button
                    onClick={() => sendSerialData(serialInput + '\n')}
                    disabled={!serialInput.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white text-xs rounded transition-colors"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => {}}
                    disabled={!isReady}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white text-xs rounded transition-colors"
                  >
                    Run Test
                  </button>
                </div>
              </div>
              
              <div className="bg-black rounded-lg overflow-hidden">
                <div className="bg-slate-800 px-3 py-2 border-b border-slate-700">
                  <p className="text-xs text-slate-300 font-mono">Serial Output</p>
                </div>
                <div
                  ref={terminalRef}
                  className="h-48 overflow-y-auto p-3 font-mono text-sm text-green-400 bg-black"
                  style={{
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {serialOutput || (isLoading ? 'Initializing v86 emulator...' : 'Waiting for output...')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
