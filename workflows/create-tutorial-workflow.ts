import { FatalError } from "workflow";
import { Syllabus } from "@/types/tutorial";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\d\s._a-z-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getReadmeExtension(language: string): string {
  return language === "en" || language === "us" ? ".md" : `.${language}.md`;
}

function createLearnJson(courseInfo: Syllabus["courseInfo"]) {
  const expectedPreviewUrl = `https://${courseInfo.slug}.learn-pack.com/preview.png`;
  const language = courseInfo.language || "en";

  return {
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
}

function createInitialSidebar(slugs: string[], initialLanguage: string) {
  const sidebar: Record<string, Record<string, string>> = {};
  for (const slug of slugs) {
    sidebar[slug] = {
      [initialLanguage]: slug,
    };
  }
  return sidebar;
}

async function sendNotification(
  courseSlug: string,
  type: string,
  message: string,
  lesson?: string,
  status?: string
) {
  "use step";

  const response = await fetch(`${getBaseUrl()}/api/internal/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: `tutorial-${courseSlug}`,
      event: "tutorial-creation",
      data: {
        type,
        message,
        lesson,
        status,
        courseSlug,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send notification: ${error.details || error.error}`);
  }
}

export async function createTutorial(
  syllabus: Syllabus,
  rigoToken: string,
  bcToken: string
) {
  "use workflow";

  const courseSlug = syllabus.courseInfo.slug;
  const tutorialDir = `courses/${courseSlug}`;

  await sendNotification(
    courseSlug,
    "started",
    `Tutorial creation started for ${courseSlug}`
  );

  const learnJson = await createLearnJsonStep(syllabus.courseInfo);
  await sendNotification(
    courseSlug,
    "learn_json_created",
    `Learn.json structure created for ${courseSlug}`
  );

  await createRigoPackageStep(rigoToken, courseSlug, learnJson);
  await sendNotification(
    courseSlug,
    "rigo_package_created",
    `Rigo package created for ${courseSlug}`
  );

  await uploadFileStep(courseSlug, "learn.json", JSON.stringify(learnJson));
  await sendNotification(
    courseSlug,
    "learn_json_uploaded",
    `Learn.json uploaded to bucket for ${courseSlug}`
  );

  await createInitialReadmesStep(syllabus, tutorialDir);
  await sendNotification(
    courseSlug,
    "readmes_created",
    `Initial README files created for ${syllabus.lessons.length} lessons`
  );

  const sidebar = await createSidebarStep(syllabus);
  await uploadFileStep(
    courseSlug,
    ".learn/sidebar.json",
    JSON.stringify(sidebar)
  );
  await sendNotification(
    courseSlug,
    "sidebar_created",
    `Sidebar.json created and uploaded for ${courseSlug}`
  );

  const initialSyllabus = {
    ...syllabus,
    lessons: syllabus.lessons.map((lesson, index) => {
      if (index < 1) {
        return { ...lesson, generated: false, status: "GENERATING" };
      }
      return {
        ...lesson,
        generated: false,
        status: "PENDING",
      };
    }),
  };

  await uploadFileStep(
    courseSlug,
    ".learn/initialSyllabus.json",
    JSON.stringify(initialSyllabus)
  );
  await sendNotification(
    courseSlug,
    "syllabus_uploaded",
    `Initial syllabus uploaded for ${courseSlug}`
  );

  await sendNotification(
    courseSlug,
    "completed",
    `Tutorial creation completed successfully for ${courseSlug}`,
    undefined,
    "COMPLETED"
  );

  return {
    status: "completed",
    courseSlug,
  };
}

async function createLearnJsonStep(courseInfo: Syllabus["courseInfo"]) {
  "use step";
  return createLearnJson(courseInfo);
}

async function createRigoPackageStep(
  rigoToken: string,
  courseSlug: string,
  learnJson: any
) {
  "use step";

  const response = await fetch(`${getBaseUrl()}/api/internal/rigo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: rigoToken,
      slug: courseSlug,
      config: learnJson,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new FatalError(
      `Failed to create Rigo package: ${error.details || error.error}`
    );
  }
}

async function uploadFileStep(
  courseSlug: string,
  relativePath: string,
  content: string
) {
  "use step";

  const fullPath = `courses/${courseSlug}/${relativePath}`;

  const response = await fetch(`${getBaseUrl()}/api/internal/storage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: fullPath,
      content: content,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to upload file: ${error.details || error.error}`);
  }
}

async function createInitialReadmesStep(
  syllabus: Syllabus,
  tutorialDir: string
) {
  "use step";

  const language = syllabus.courseInfo.language || "en";
  const readmeExtension = getReadmeExtension(language);

  for (let i = 0; i < syllabus.lessons.length; i++) {
    const lesson = syllabus.lessons[i];
    const exSlug = slugify(lesson.id + "-" + lesson.title);
    const targetDir = `${tutorialDir}/exercises/${exSlug}`;
    const readmeFilename = `README${readmeExtension}`;

    const isGeneratingText = `
  \`\`\`loader slug="${exSlug}"
  :rigo
  \`\`\`
      `;

    await uploadFileStep(
      syllabus.courseInfo.slug,
      `exercises/${exSlug}/${readmeFilename}`,
      isGeneratingText
    );
  }
}

async function createSidebarStep(syllabus: Syllabus) {
  "use step";

  const slugs = syllabus.lessons.map((lesson) =>
    slugify(lesson.id + "-" + lesson.title)
  );
  return createInitialSidebar(slugs, syllabus.courseInfo.language || "en");
}
