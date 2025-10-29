# Code Challenge with v86 Emulator

A React-based coding challenge application that uses the v86 emulator to execute code in a virtualized Linux environment.

## Features

- **Multi-language Support**: Python, C, and Lua
- **v86 Emulator Integration**: Real code execution in a virtualized Linux environment
- **Monaco Editor**: Professional code editing experience
- **Real-time Testing**: Execute code and see results immediately
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## v86 Integration

This project integrates the [v86 emulator](https://github.com/copy/v86) to provide a complete Linux environment for code execution. The emulator runs an Alpine Linux root filesystem mounted via 9p and communicates over the serial console.

- **BIOS Files**: SeaBIOS and VGA BIOS for hardware initialization
- **Root filesystem**: Alpine Linux rootfs exposed via 9p (served from `public/images`)
- **WebAssembly**: `v86.wasm` and loader `v86.js` for browser-based x86 emulation

### Files Structure

```
public/
├── bios/
│   ├── seabios.bin             # SeaBIOS for x86 emulation
│   └── vgabios.bin             # VGA BIOS (graphics disabled at runtime)
├── images/
│   ├── alpine-fs.json          # Flat FS manifest used by v86 9p host
│   ├── alpine-rootfs-flat/     # Flat Alpine rootfs chunk files
│   └── alpine-state.bin        # Initial emulator state (faster boot)
├── v86.js                      # v86 loader
└── v86.wasm                    # v86 WebAssembly binary
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
- 512MB RAM
- VGA disabled for app flow (serial-first UI)
- Serial console for I/O (`console=ttyS0`)
- Root filesystem via 9p host (`images/alpine-rootfs-flat` + `alpine-fs.json`)
- Fast boot using `images/alpine-state.bin`
- Input devices disabled (keyboard/mouse handled by app)

## Code Execution Flow

1. User writes code in the editor
2. App sends the source to the emulator over the serial console and writes it to `/tmp/code_challenge/code.<ext>`
3. Inside the VM, the script `/opt/detect-language/run_tests.sh` is invoked to compile/interpret and run the code
4. Program output flows back over the serial console
5. UI displays the output and test status in real-time

Notes:
- File extension is resolved from the selected language (Python `.py`, C `.c`, Lua `.lua`).
- The serial terminal is visible immediately during boot; it auto-scrolls as the system initializes.
