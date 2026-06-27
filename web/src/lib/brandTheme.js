export function applyBrandCssVars(rootStyle, primaryColor) {
  // Keep this as a pure helper in case we refactor layout styles.
  const safePrimary = primaryColor || "#10b981";

  // Expose a small set of CSS vars consumed by components.
  // NOTE: Some tokens are still optional until we migrate fully away from hardcoded classes.
  return {
    ...rootStyle,
    "--brand-primary": safePrimary,
    "--brand-primary-16": `color-mix(in oklab, ${safePrimary} 16%, transparent)`,
  };
}

