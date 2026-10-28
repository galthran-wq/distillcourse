// The bundle lib/content/figure-svg.ts imports instead of the package entry
// (see there); it exports the same API.
declare module "css-tree/dist/csstree.esm" {
  export * from "css-tree";
}
