// Public name for the alphabet & phonics learning module. The implementation (data tables,
// generators, grade progression) lives in ./phonics; this barrel keeps `@/content/alphabet`
// importers working and free of runtime cross-file value imports.
export * from "./phonics";
