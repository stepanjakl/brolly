// SVGR (see next.config.ts / vitest.config.ts) turns these imports into React
// components. Scoped to the icon package so it outranks next/image-types'
// generic `*.svg: any` (longest wildcard prefix wins).
declare module "@material-symbols/svg-700/rounded/*.svg" {
  import type { FC, SVGProps } from "react";
  const Icon: FC<SVGProps<SVGSVGElement>>;
  export default Icon;
}
