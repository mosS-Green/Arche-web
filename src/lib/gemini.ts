import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const client = new GoogleGenAI({ apiKey });

export interface CategorizationResult {
  categories: string[];
  reasoning: string;
}

/**
 * Step 1: Categorize the captured media and optional comment.
 * Returns an array of target database tables.
 */
export async function categorizeContent(
  mediaType: 'image' | 'audio' | 'none',
  mediaBase64: string | null,
  comment: string
): Promise<CategorizationResult> {
  const inputs: any[] = [];

  if (mediaBase64) {
    const rawData = mediaBase64.includes(',') ? mediaBase64.split(',')[1] : mediaBase64;
    const mimeType = mediaType === 'image' ? 'image/jpeg' : 'audio/mp3';
    inputs.push({
      type: mediaType,
      data: rawData,
      mime_type: mimeType
    });
  }

  const promptText = `You are a categorization assistant for Arché. The user has provided media (image or audio) and/or a comment.
Analyze the provided content and determine which database tables it should be categorized into.
The possible categories are:
- 'personal_tasks': Tasks related to wellness, habits, chores, personal life.
- 'personal_reminders': Reminders for daily, weekly, or monthly personal events.
- 'ideas': Ideas, concept drafts, creativity, maker project concepts.
- 'quotes': Musings, philosophical ideas, saved quotes with reflections (My Musings).
- 'goals_plans': Personal goals with timelines/milestones.
- 'musings': Journal logs, mood logs, diaries (Journal Logs).
- 'media': Books, movies, music backlogs.
- 'hobbies': Logs of hobby practices like duration, notes.
- 'work_tasks': Professional/work-related tasks, queues.
- 'work_reminders': Work-related reminders/alarms.
- 'work_notes': Work notes, project documents, logs.

Choose ALL that apply. For example, if a user captures a whiteboard and comments "Remember to send layout update to team and buy milk", that belongs to both 'work_tasks' and 'personal_tasks'.
Provide the output strictly matching the required JSON schema.`;

  inputs.push({
    type: "text",
    text: promptText
  });

  if (comment) {
    inputs.push({
      type: "text",
      text: `User Comment/Context: ${comment}`
    });
  }

  const response = await client.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: inputs,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
        properties: {
          categories: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "personal_tasks",
                "personal_reminders",
                "ideas",
                "quotes",
                "goals_plans",
                "musings",
                "media",
                "hobbies",
                "work_tasks",
                "work_reminders",
                "work_notes"
              ]
            }
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of why these categories were selected."
          }
        },
        required: ["categories"]
      }
    },
    generation_config: {
      thinking_level: "medium"
    }
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("Empty response received from categorization agent.");
  }

  return JSON.parse(text) as CategorizationResult;
}

/**
 * Step 2: Extract structured data objects for each category.
 * Dynamically builds the JSON response schema for the chosen categories.
 */
export async function structureContent(
  categories: string[],
  mediaType: 'image' | 'audio' | 'none',
  mediaBase64: string | null,
  comment: string
): Promise<Record<string, any[]>> {
  // Define schemas for all possible tables
  const schemas: Record<string, any> = {
    personal_tasks: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
        deadline: { type: "string", description: "Format: YYYY-MM-DD" },
        status: { type: "string", enum: ["To Do", "In Progress", "Done"] },
        energy_required: { type: "string", enum: ["Low", "Medium", "High"] },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "category", "priority", "status", "energy_required"]
    },
    personal_reminders: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        type: { type: "string", enum: ["One Time", "Daily", "Weekly", "Monthly"] },
        date: { type: "string", description: "Format: YYYY-MM-DD" },
        time: { type: "string", description: "Format: HH:MM:SS" },
        repeat_until: { type: "string", description: "Format: YYYY-MM-DD" }
      },
      required: ["title", "type", "date"]
    },
    ideas: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        excitement: { type: "integer", description: "1 to 5 rating" },
        difficulty: { type: "integer", description: "1 to 5 rating" },
        status: { type: "string", enum: ["Draft", "Refined", "Active", "Completed", "Shelved"] },
        related_hobby: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "category", "excitement", "difficulty", "status"]
    },
    quotes: {
      type: "object",
      properties: {
        quote: { type: "string", description: "The quote text or general musing text" },
        author: { type: "string", description: "Author of the quote or source thought (optional)" },
        source: { type: "string", description: "Source book, site, or reference (optional)" },
        category: { type: "string" },
        personal_thoughts: { type: "string", description: "My own personal thoughts or reflections on this" },
        tags: { type: "array", items: { type: "string" } },
        favourite: { type: "boolean" }
      },
      required: ["quote", "category"]
    },
    goals_plans: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        target_date: { type: "string", description: "Format: YYYY-MM-DD" },
        progress: { type: "integer", description: "0 to 100 percentage" },
        status: { type: "string", enum: ["Not Started", "In Progress", "Achieved", "Paused"] },
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              completed: { type: "boolean" }
            },
            required: ["text", "completed"]
          }
        },
        related_hobby: { type: "string" }
      },
      required: ["title", "target_date", "progress", "status"]
    },
    musings: {
      type: "object",
      properties: {
        title: { type: "string", description: "Optional journal log title" },
        body: { type: "string", description: "Journal body text" },
        mood: { type: "string", description: "Overall mood (e.g. Calm, Reflective, Stressed)" },
        tags: { type: "array", items: { type: "string" } },
        favourite: { type: "boolean" }
      },
      required: ["body", "mood"]
    },
    media: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string", enum: ["Music", "Book", "Series", "Movie", "Game"] },
        status: { type: "string", enum: ["Backlog", "Consuming", "Completed", "Abandoned"] },
        rating: { type: "integer", description: "1 to 5 rating" },
        progress: { type: "integer" },
        genre: { type: "string" },
        thoughts: { type: "string" },
        recommendation_source: { type: "string" }
      },
      required: ["title", "type", "status"]
    },
    hobbies: {
      type: "object",
      properties: {
        hobby: { type: "string" },
        duration: { type: "integer", description: "Duration in minutes" },
        notes: { type: "string" },
        enjoyment: { type: "integer", description: "1 to 5 rating" },
        difficulty: { type: "integer", description: "1 to 5 rating" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["hobby", "duration", "enjoyment", "difficulty"]
    },
    work_tasks: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
        status: { type: "string", enum: ["To Do", "In Progress", "Done"] },
        deadline: { type: "string", description: "Format: YYYY-MM-DD" },
        time: { type: "string", description: "Format: HH:MM:SS" },
        estimated_duration: { type: "integer", description: "Duration in minutes" },
        notes: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "priority", "status"]
    },
    work_reminders: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        type: { type: "string", enum: ["One Time", "Daily", "Weekly", "Monthly"] },
        date: { type: "string", description: "Format: YYYY-MM-DD" },
        time: { type: "string", description: "Format: HH:MM:SS" },
        repeat_until: { type: "string", description: "Format: YYYY-MM-DD" }
      },
      required: ["title", "type", "date"]
    },
    work_notes: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        project: { type: "string" },
        pin: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title"]
    }
  };

  const systemInstructions: Record<string, string> = {
    personal_tasks: "Extract details for personal_tasks: determine a title, category, priority, energy level, optional deadline (YYYY-MM-DD), and status.",
    personal_reminders: "Extract details for personal_reminders: determine a title, frequency type, date (YYYY-MM-DD), and optional time.",
    ideas: "Extract details for ideas: determine an idea title, details, category, excitement rating (1-5), difficulty rating (1-5), and status.",
    quotes: "Extract details for quotes (Musing): extract the quote itself, author, source book, category, personal thoughts/reflections, and tags.",
    goals_plans: "Extract details for goals_plans: determine goal title, target date, progress percentage, status, and sub-milestones checklist.",
    musings: "Extract details for musings (Journal Log): extract journal title, entry body, mood, and tags.",
    media: "Extract details for media: extract title, media type, status, rating, progress, genre, and thoughts.",
    hobbies: "Extract details for hobbies: extract hobby name, practice duration, notes, enjoyment rating (1-5), and difficulty rating (1-5).",
    work_tasks: "Extract details for work_tasks: determine title, priority, status, deadline, estimated duration, and notes.",
    work_reminders: "Extract details for work_reminders: determine title, repeat type, date, time.",
    work_notes: "Extract details for work_notes: extract title, note body, project name, and pin status."
  };

  // Compile prompt and schema properties for ONLY the selected categories
  const responseProperties: Record<string, any> = {};
  let systemPromptCombined = `You are an intelligent data structuring assistant for Arché. The user has provided an image or audio and/or comments, which have been categorized. Your job is to extract the content and convert it into fully formed data objects that can be direct inserts into the database. Make sure to generate all required fields. Multiple entries can be outputted at once inside their respective arrays.\n\n`;

  for (const cat of categories) {
    if (schemas[cat]) {
      responseProperties[cat] = {
        type: "array",
        items: schemas[cat]
      };
      systemPromptCombined += `- For '${cat}': ${systemInstructions[cat]}\n`;
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  systemPromptCombined += `\nToday's date is: ${todayStr}. Use this as a reference to calculate relative dates (e.g. "tomorrow" is ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}, "next Monday", "daily", etc.).`;

  const inputs: any[] = [];
  if (mediaBase64) {
    const rawData = mediaBase64.includes(',') ? mediaBase64.split(',')[1] : mediaBase64;
    const mimeType = mediaType === 'image' ? 'image/jpeg' : 'audio/mp3';
    inputs.push({
      type: mediaType,
      data: rawData,
      mime_type: mimeType
    });
  }

  inputs.push({
    type: "text",
    text: systemPromptCombined
  });

  if (comment) {
    inputs.push({
      type: "text",
      text: `User Comments/Context: ${comment}`
    });
  }

  const response = await client.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: inputs,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
        properties: responseProperties
      }
    },
    generation_config: {
      thinking_level: "high"
    }
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("Empty response received from data structuring agent.");
  }

  return JSON.parse(text) as Record<string, any[]>;
}
