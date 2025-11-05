import "server-only";
import axios from "axios";
import { FormState } from "@/types/tutorial";

const RIGOBOT_HOST = process.env.RIGOBOT_HOST || "https://rigobot.herokuapp.com";

export const createRigoPackage = async (
  token: string,
  slug: string,
  config: any
) => {
  const url = `${RIGOBOT_HOST}/v1/learnpack/package`;
  const cleanToken = token.replace(/[\n\r]/g, "");

  try {
    const response = await axios.post(
      url,
      { slug, config },
      {
        headers: {
          Authorization: "Token " + cleanToken,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create Rigo package:", error);
    throw error;
  }
};

