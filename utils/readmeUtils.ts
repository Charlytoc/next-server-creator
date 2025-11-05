export const getReadmeExtension = (language: string) => {
  return language === "en" || language === "us" ? ".md" : `.${language}.md`;
};

