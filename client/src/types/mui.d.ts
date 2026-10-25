import "@mui/material/styles";

// custom palette colours registered in customTheme.ts
type Custom = "indigo" | "orange" | "green" | "blue" | "yellow" | "darkRed";

declare module "@mui/material/styles" {
	interface Palette extends Record<Custom, Palette["primary"]> {}
	interface PaletteOptions extends Partial<Record<Custom, PaletteOptions["primary"]>> {}
}

declare module "@mui/material/SvgIcon" {
	interface SvgIconPropsColorOverrides extends Record<Custom, true> {}
}
declare module "@mui/material/Button" {
	interface ButtonPropsColorOverrides extends Record<Custom, true> {}
}
declare module "@mui/material/IconButton" {
	interface IconButtonPropsColorOverrides extends Record<Custom, true> {}
}
