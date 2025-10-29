interface V86Config {
  serial_container?: HTMLElement | null;
  wasm_path?: string;
  memory_size?: number;
  bios?: { url: string };
  filesystem?: {
    baseurl?: string;
    basefs?: string;
  };
  autostart?: boolean;
  bzimage_initrd_from_filesystem?: boolean;
  cmdline?: string;
  disable_speaker?: boolean;
  disable_mouse?: boolean;
  disable_keyboard?: boolean;
  initial_state?: { url: string };
  [key: string]: unknown; // Allow additional config properties
}

declare module 'v86' {
  export class V86 {
    constructor(config: V86Config);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    add_listener(event: string, handler: (...args: any[]) => void): void;
    destroy(): void;
    serial0_send(data: string): void;
    create_file(path: string, buffer: Uint8Array): Promise<void>;
    // App-specific augmentation added at runtime
    checkTrigger?: (output: string) => void;
  }
}

// Some bundlers resolve to the concrete module path; map it to the above declarations
declare module 'v86/build/libv86.mjs' {
  export { V86 } from 'v86';
}

declare module '*.wasm?url' {
  const url: string;
  export default url;
}

