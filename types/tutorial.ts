export interface Lesson {
  id: string;
  uid: string;
  title: string;
  type: "READ" | "CODE" | "QUIZ";
  description: string;
  duration?: number;
  generated?: boolean;
  status?: "PENDING" | "GENERATING" | "DONE" | "ERROR";
  initialContent?: string;
  translations?: {
    [key: string]: {
      completionId: number;
      startedAt: number;
      completedAt?: number;
    };
  };
}

export interface ParsedLink {
  name: string;
  text: string;
}

export type TDifficulty = "easy" | "beginner" | "intermediate" | "hard";

export type FormState = {
  description: string;
  duration: number;
  hasContentIndex: boolean;
  difficulty: TDifficulty;
  contentIndex: string;
  language?: string;
  technologies?: string[];
  isCompleted: boolean;
  variables: string[];
  currentStep: string;
  title: string;
  purpose: string;
  slug: string;
};

export type Syllabus = {
  lessons: Lesson[];
  courseInfo: FormState;
  feedback?: string;
  generationMode?: "next-three" | "continue-with-all";
  used_components?: { [componentName: string]: number };
};

export interface CreateTutorialRequest {
  syllabus: Syllabus;
}

export interface CreateTutorialResponse {
  message: string;
  courseSlug: string;
}

export interface PusherNotification {
  type: string;
  message: string;
  lesson?: string;
  status?: string;
  courseSlug: string;
}

