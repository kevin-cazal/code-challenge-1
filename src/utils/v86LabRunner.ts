import { Language, getLanguageExtension } from './languages';

export interface TestResult {
  passed: boolean;
  message: string;
  details?: string;
}

import type { V86 } from 'v86';

// Global emulator instance
let emulator: V86 | null = null;
let isEmulatorReady = false;
let serialOutputBuffer = '';
let initializationPromise: Promise<void> | null = null;

// Cleanup function to destroy emulator
export function destroyEmulator() {
  if (emulator) {
    console.log('Destroying global v86 emulator');
    emulator.destroy();
    emulator = null;
    isEmulatorReady = false;
    serialOutputBuffer = '';
    initializationPromise = null;
  }
}

// Initialize v86 emulator
async function initializeEmulator(): Promise<void> {
  if (isEmulatorReady) return;
  
  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = performInitialization();
  return initializationPromise;
}

async function performInitialization(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Dynamically import v86 to avoid SSR issues
      import('v86').then(({ V86 }) => {
        emulator = new V86({
          wasm_path: '/v86.wasm',
          memory_size: 32 * 1024 * 1024,
          vga_memory_size: 0, // Disable VGA
          bios: { url: '/bios/seabios.bin' },
          vga_bios: { url: '/bios/vgabios.bin' },
          cdrom: { url: '/linux4.iso' },
          autostart: true,
          screen_container: null, // No screen output
          serial_container: null,
          network_relay_url: null,
          filesystem: {},
          boot_order: 1, // Boot from CD-ROM
          disable_screen: true, // Disable screen rendering
        });

        emulator.add_listener('emulator-ready', () => {
          console.log('v86 emulator is ready');
          isEmulatorReady = true;
          resolve();
        });

        // Listen for serial output
        emulator.add_listener('serial0-output-byte', (byte: number) => {
          const char = String.fromCharCode(byte);
          
          // Skip carriage returns (like in serial.html)
          if (char === '\r') {
            return;
          }
          
          serialOutputBuffer += char;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emulator.add_listener('emulator-error', (error: any) => {
          const errorObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');
          console.error('v86 emulator error:', errorObj);
          reject(errorObj);
        });

        // Set a timeout for initialization
        setTimeout(() => {
          if (!isEmulatorReady) {
            reject(new Error('Emulator initialization timeout'));
          }
        }, 30000);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

export async function runCodeTest(code: string, language: Language): Promise<TestResult> {
  try {
    await initializeEmulator();
    const result = await executeCodeTest(code, language);
    return result;
  } catch (error) {
    return {
      passed: false,
      message: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function executeCodeTest(code: string, language: Language): Promise<TestResult> {
  try {
    if (!isEmulatorReady || !emulator) {
      return {
        passed: false,
        message: 'Emulator not ready',
        details: 'The v86 emulator is not properly initialized',
      };
    }

    console.log('Executing code test for language:', language);
    console.log('Code:', code);

    // Execute the code using the v86 emulator
    const result = await executeCode(code, language);
    
    // Check if the output contains "Hello, World!"
    const hasHelloWorld = result.stdout.toLowerCase().includes('hello') && 
                         result.stdout.toLowerCase().includes('world');
    
    if (result.exitCode === 0 && hasHelloWorld) {
      return {
        passed: true,
        message: 'All tests passed!',
        details: `Code executed successfully. Output: ${result.stdout}`,
      };
    } else if (result.exitCode === 0) {
      return {
        passed: false,
        message: 'Tests failed',
        details: `Code executed but output doesn't match expected result. Output: ${result.stdout}`,
      };
    } else {
      return {
        passed: false,
        message: 'Tests failed',
        details: `Execution failed with exit code ${result.exitCode}. Error: ${result.stderr}`,
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: 'Execution error',
      details: error instanceof Error ? error.message : 'Unknown execution error',
    };
  }
}

// Helper function to send commands to the emulator
async function sendCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!emulator) {
      reject(new Error('Emulator not initialized'));
      return;
    }

    // Clear the output buffer before sending command
    serialOutputBuffer = '';
    
    const timeout = setTimeout(() => {
      reject(new Error('Command timeout'));
    }, 10000);

    const checkOutput = () => {
      // Check for command completion markers
      if (serialOutputBuffer.includes('$ ') || serialOutputBuffer.includes('# ')) {
        clearTimeout(timeout);
        resolve(serialOutputBuffer);
      } else {
        // Check again in 100ms
        setTimeout(checkOutput, 100);
      }
    };

    emulator.serial0_send(command + '\n');
    checkOutput();
  });
}

// Function to create files in the emulator's filesystem
async function createFile(path: string, content: string): Promise<void> {
  if (!emulator) {
    throw new Error('Emulator not initialized');
  }

  const buffer = new Uint8Array(content.length);
  for (let i = 0; i < content.length; i++) {
    buffer[i] = content.charCodeAt(i);
  }

  await emulator.create_file(path, buffer);
}

// Function to execute code in the emulator
async function executeCode(code: string, language: Language): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  if (!emulator) {
    throw new Error('Emulator not initialized');
  }

  const extension = getLanguageExtension(language);
  const filename = `test.${extension}`;
  
  try {
    // Create the code file
    await createFile(`/tmp/${filename}`, code);
    
    // Execute based on language
    let command = '';
    switch (language) {
      case 'python':
        command = `python3 /tmp/${filename}`;
        break;
      case 'c':
        command = `gcc /tmp/${filename} -o /tmp/test && /tmp/test`;
        break;
      case 'lua':
        command = `lua /tmp/${filename}`;
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    const output = await sendCommand(command);
    
    return {
      exitCode: 0, // Simplified - in reality you'd parse the exit code
      stdout: output,
      stderr: '',
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}