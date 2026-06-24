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
      inlineData: {
        data: rawData,
        mimeType: mimeType
      }
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

  inputs.push(promptText);

  if (comment) {
    inputs.push(`User Comment/Context: ${comment}`);
  }

  const response = await client.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: inputs,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "OBJECT",
        properties: {
          categories: {
            type: "ARRAY",
            items: {
              type: "STRING",
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
            type: "STRING",
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
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        category: { type: "STRING" },
        priority: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
        deadline: { type: "STRING", description: "Format: YYYY-MM-DD" },
        status: { type: "STRING", enum: ["To Do", "In Progress", "Done"] },
        energy_required: { type: "STRING", enum: ["Low", "Medium", "High"] },
        tags: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "category", "priority", "status", "energy_required"]
    },
    personal_reminders: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        type: { type: "STRING", enum: ["One Time", "Daily", "Weekly", "Monthly"] },
        date: { type: "STRING", description: "Format: YYYY-MM-DD" },
        time: { type: "STRING", description: "Format: HH:MM:SS" },
        repeat_until: { type: "STRING", description: "Format: YYYY-MM-DD" }
      },
      required: ["title", "type", "date"]
    },
    ideas: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        category: { type: "STRING" },
        excitement: { type: "INTEGER", description: "1 to 5 rating" },
        difficulty: { type: "INTEGER", description: "1 to 5 rating" },
        status: { type: "STRING", enum: ["Draft", "Refined", "Active", "Completed", "Shelved"] },
        related_hobby: { type: "STRING" },
        tags: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "category", "excitement", "difficulty", "status"]
    },
    quotes: {
      type: "OBJECT",
      properties: {
        quote: { type: "STRING", description: "The quote text or general musing text" },
        author: { type: "STRING", description: "Author of the quote or source thought (optional)" },
        source: { type: "STRING", description: "Source book, site, or reference (optional)" },
        category: { type: "STRING" },
        personal_thoughts: { type: "STRING", description: "My own personal thoughts or reflections on this" },
        tags: { type: "ARRAY", items: { type: "STRING" } },
        favourite: { type: "BOOLEAN" }
      },
      required: ["quote", "category"]
    },
    goals_plans: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        target_date: { type: "STRING", description: "Format: YYYY-MM-DD" },
        progress: { type: "INTEGER", description: "0 to 100 percentage" },
        status: { type: "STRING", enum: ["Not Started", "In Progress", "Achieved", "Paused"] },
        milestones: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING" },
              completed: { type: "BOOLEAN" }
            },
            required: ["text", "completed"]
          }
        },
        related_hobby: { type: "STRING" }
      },
      required: ["title", "target_date", "progress", "status"]
    },
    musings: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Optional journal log title" },
        body: { type: "STRING", description: "Journal body text" },
        mood: { type: "STRING", description: "Overall mood (e.g. Calm, Reflective, Stressed)" },
        tags: { type: "ARRAY", items: { type: "STRING" } },
        favourite: { type: "BOOLEAN" }
      },
      required: ["body", "mood"]
    },
    media: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        type: { type: "STRING", enum: ["Music", "Book", "Series", "Movie", "Game"] },
        status: { type: "STRING", enum: ["Backlog", "Consuming", "Completed", "Abandoned"] },
        rating: { type: "INTEGER", description: "1 to 5 rating" },
        progress: { type: "INTEGER" },
        genre: { type: "STRING" },
        thoughts: { type: "STRING" },
        recommendation_source: { type: "STRING" }
      },
      required: ["title", "type", "status"]
    },
    hobbies: {
      type: "OBJECT",
      properties: {
        hobby: { type: "STRING" },
        duration: { type: "INTEGER", description: "Duration in minutes" },
        notes: { type: "STRING" },
        enjoyment: { type: "INTEGER", description: "1 to 5 rating" },
        difficulty: { type: "INTEGER", description: "1 to 5 rating" },
        tags: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["hobby", "duration", "enjoyment", "difficulty"]
    },
    work_tasks: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        priority: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
        status: { type: "STRING", enum: ["To Do", "In Progress", "Done"] },
        deadline: { type: "STRING", description: "Format: YYYY-MM-DD" },
        time: { type: "STRING", description: "Format: HH:MM:SS" },
        estimated_duration: { type: "INTEGER", description: "Duration in minutes" },
        notes: { type: "STRING" },
        tags: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title", "priority", "status"]
    },
    work_reminders: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        type: { type: "STRING", enum: ["One Time", "Daily", "Weekly", "Monthly"] },
        date: { type: "STRING", description: "Format: YYYY-MM-DD" },
        time: { type: "STRING", description: "Format: HH:MM:SS" },
        repeat_until: { type: "STRING", description: "Format: YYYY-MM-DD" }
      },
      required: ["title", "type", "date"]
    },
    work_notes: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        body: { type: "STRING" },
        project: { type: "STRING" },
        pin: { type: "BOOLEAN" },
        tags: { type: "ARRAY", items: { type: "STRING" } }
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
        type: "ARRAY",
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
      inlineData: {
        data: rawData,
        mimeType: mimeType
      }
    });
  }

  inputs.push(systemPromptCombined);

  if (comment) {
    inputs.push(`User Comments/Context: ${comment}`);
  }

  const response = await client.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: inputs,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "OBJECT",
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
