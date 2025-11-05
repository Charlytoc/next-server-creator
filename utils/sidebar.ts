export const createInitialSidebar = async (
  slugs: string[],
  initialLanguage = "en"
) => {
  const sidebar: Record<string, Record<string, string>> = {};
  for (const slug of slugs) {
    sidebar[slug] = {
      [initialLanguage]: slug,
    };
  }

  return sidebar;
};

