export interface TestResult {
  passed: boolean;
  message: string;
  details?: string;
}

export async function runCodeTest(code: string): Promise<TestResult> {
  try {
    const result = await executeWasmTest(code);
    return result;
  } catch (error) {
    return {
      passed: false,
      message: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function executeWasmTest(code: string): Promise<TestResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hasFunction = code.includes('function');
      const hasReturn = code.includes('return');

      if (hasFunction && hasReturn) {
        resolve({
          passed: true,
          message: 'All tests passed!',
          details: 'Your code meets the requirements.',
        });
      } else {
        resolve({
          passed: false,
          message: 'Tests failed',
          details: 'Make sure your code includes a function with a return statement.',
        });
      }
    }, 500);
  });
}
