// Node 24 strips TS types natively but still requires explicit extensions for
// ESM. The story content modules (content/storybooks/*) use extensionless
// relative imports because they are normally bundled by Next/Turbopack. This
// resolve hook retries those as `.ts` so offline scripts can import them.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    const hasModuleExtension = /\.[mc]?[jt]s$/.test(specifier);
    if (isRelative && !hasModuleExtension) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}
