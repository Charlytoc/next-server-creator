import { FormState } from "@/types/tutorial";

export const createLearnJson = (courseInfo: FormState) => {
  const expectedPreviewUrl = `https://${courseInfo.slug}.learn-pack.com/preview.png`;

  const language = courseInfo.language || "en";

  const learnJson = {
    slug: courseInfo.slug,
    title: {
      [language]: courseInfo.title,
    },
    technologies: courseInfo.technologies || [],
    difficulty: "beginner",
    description: {
      [language]: courseInfo.description,
    },
    grading: "isolated",
    telemetry: {
      batch: "https://breathecode.herokuapp.com/v1/assignment/me/telemetry",
    },
    preview: expectedPreviewUrl,
  };
  return learnJson;
};

