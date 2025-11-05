import { FatalError } from "workflow";
import Pusher from "pusher";
import { Syllabus } from "@/types/tutorial";
import { createLearnJson } from "@/utils/learnJson";
import { createRigoPackage } from "@/utils/rigo";
import { getBucket, uploadFileToBucket } from "@/utils/storage";
import { createInitialSidebar } from "@/utils/sidebar";
import { slugify } from "@/utils/slugify";
import { getReadmeExtension } from "@/utils/readmeUtils";

const getPusher = () => {
  return new Pusher({
    appId: process.env.PUSHER_APP_ID || "2073209",
    key: process.env.PUSHER_KEY || "609743b48b8ed073d67f",
    secret: process.env.PUSHER_SECRET || "ae0ae03cf538441a9679",
    cluster: process.env.PUSHER_CLUSTER || "us2",
    useTLS: true,
  });
};

const sendNotification = async (
  courseSlug: string,
  type: string,
  message: string,
  lesson?: string,
  status?: string
) => {
  const pusher = getPusher();
  const channel = `tutorial-${courseSlug}`;

  await pusher.trigger(channel, "tutorial-creation", {
    type,
    message,
    lesson,
    status,
    courseSlug,
  });
};

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

  await uploadLearnJsonStep(courseSlug, learnJson);
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
  await uploadSidebarStep(courseSlug, sidebar);
  await sendNotification(
    courseSlug,
    "sidebar_created",
    `Sidebar.json created and uploaded for ${courseSlug}`
  );

  await uploadInitialSyllabusStep(courseSlug, syllabus);
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

  try {
    await createRigoPackage(rigoToken, courseSlug, learnJson);
  } catch (error) {
    throw new FatalError(
      `Failed to create Rigo package: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function uploadLearnJsonStep(courseSlug: string, learnJson: any) {
  "use step";

  try {
    const bucket = getBucket();
    const tutorialDir = `courses/${courseSlug}`;
    await uploadFileToBucket(
      bucket,
      JSON.stringify(learnJson),
      `${tutorialDir}/learn.json`
    );
  } catch (error) {
    throw new Error(
      `Failed to upload learn.json: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function createInitialReadmesStep(
  syllabus: Syllabus,
  tutorialDir: string
) {
  "use step";

  try {
    const bucket = getBucket();

    for (let i = 0; i < syllabus.lessons.length; i++) {
      const lesson = syllabus.lessons[i];
      const exSlug = slugify(lesson.id + "-" + lesson.title);
      const targetDir = `${tutorialDir}/exercises/${exSlug}`;

      const isGeneratingText = `
  \`\`\`loader slug="${exSlug}"
  :rigo
  \`\`\`
      `;
      const readmeFilename = `README${getReadmeExtension(
        syllabus.courseInfo.language || "en"
      )}`;

      await uploadFileToBucket(
        bucket,
        isGeneratingText,
        `${targetDir}/${readmeFilename}`
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to create initial readmes: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function createSidebarStep(syllabus: Syllabus) {
  "use step";

  const slugs = syllabus.lessons.map((lesson) =>
    slugify(lesson.id + "-" + lesson.title)
  );
  return await createInitialSidebar(
    slugs,
    syllabus.courseInfo.language || "en"
  );
}

async function uploadSidebarStep(courseSlug: string, sidebar: any) {
  "use step";

  try {
    const bucket = getBucket();
    const tutorialDir = `courses/${courseSlug}`;
    await uploadFileToBucket(
      bucket,
      JSON.stringify(sidebar),
      `${tutorialDir}/.learn/sidebar.json`
    );
  } catch (error) {
    throw new Error(
      `Failed to upload sidebar: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function uploadInitialSyllabusStep(
  courseSlug: string,
  syllabus: Syllabus
) {
  "use step";

  try {
    const bucket = getBucket();
    const tutorialDir = `courses/${courseSlug}`;

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

    await uploadFileToBucket(
      bucket,
      JSON.stringify(initialSyllabus),
      `${tutorialDir}/.learn/initialSyllabus.json`
    );
  } catch (error) {
    throw new Error(
      `Failed to upload initial syllabus: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

