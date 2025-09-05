// Minimal type re-export to satisfy TS when resolution hiccups occur.
// Prefer real @types/react which is already installed; this file should be temporary.
import type * as ReactTypes from 'react';
declare module 'react' { export = ReactTypes; }
declare module 'react/jsx-runtime' {
	export const jsx: any;
	export const jsxs: any;
	export const Fragment: any;
}