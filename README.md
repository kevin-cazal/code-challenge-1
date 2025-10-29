# Code Challenge with v86 Emulator

A React-based coding challenge application that uses the v86 emulator to execute code in a virtualized Linux environment.

## Features

- **Multi-language Support**: Python, C, and Lua
- **v86 Emulator Integration**: Real code execution in a virtualized Linux environment
- **Monaco Editor**: Professional code editing experience
- **Real-time Testing**: Execute code and see results immediately
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## v86 Integration

This project integrates the [v86 emulator](https://github.com/copy/v86) to provide a complete Linux environment for code execution. The emulator includes:

- **BIOS Files**: SeaBIOS and VGA BIOS for proper hardware emulation
- **Linux ISO**: A minimal Linux distribution for code execution
- **WebAssembly**: v86.wasm for browser-based x86 emulation

### Files Structure

```
public/
├── bios/
│   ├── seabios.bin      # SeaBIOS for x86 emulation
│   └── vgabios.bin      # VGA BIOS for graphics
├── linux.iso            # Linux distribution ISO
└── v86.wasm             # v86 WebAssembly binary
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:5173`

## Usage

1. **Select Language**: Choose between Python, C, or Lua
2. **Write Code**: Use the Monaco editor to write your solution
3. **Run Tests**: Click "Run Tests" to execute your code in the v86 emulator
4. **View Results**: See test results and output in real-time

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Code Editor**: Monaco Editor
- **Emulator**: v86 (x86 emulator in WebAssembly)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Development

- **Linting**: `npm run lint`
- **Type Checking**: `npm run typecheck`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## v86 Configuration

The v86 emulator is configured with:
- 32MB RAM
- 2MB VGA memory
- CD-ROM boot (Linux ISO)
- Serial console for I/O
- File system support for code execution

## Code Execution Flow

1. User writes code in the editor
2. Code is sent to the v86 emulator
3. A temporary file is created in the Linux environment
4. Code is compiled/interpreted based on the language
5. Output is captured and returned to the UI
6. Test results are displayed to the user
