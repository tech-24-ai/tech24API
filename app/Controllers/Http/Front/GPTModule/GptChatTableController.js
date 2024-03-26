"use strict";

const ChatTable = use("App/Models/Front/GPTModule/GptChatsResponse");
const Prompt_Table = use("App/Models/Front/GPTModule/GptChat");
const axios = use("axios");
const Env = use("Env");

const MAX_RETRY = 3;
const RETRY_DELAY_SECONDS = 2;

class GptChatTableController {
  async index() {
    return ChatTable.all();
  }

  async store({ request, response, auth }) {
    // const { messages } = request.post();
    const apiKey = Env.get("OPENAI_API_KEY");
    const url = "https://api.openai.com/v1/chat/completions";
    const model = "gpt-3.5-turbo";
    const temperature = 0.2;
    const visitorId = auth.user.id; // Get the authenticated visitor's ID
    let attempts = 0;
    let result = null;
    const prompt_id = request.input("prompt_id");
    let prompt_text = "";
    let role = request.input("role");

    const input_question = request.input("input_question");

    if (prompt_id) {
      const get_prompt_id = await Prompt_Table.find(prompt_id);
      prompt_text = get_prompt_id.prompt_text;
    }

    const messages = [
      {
        role: "system",
        content: prompt_text,
      },
    ];
    if (role == "user" && input_question != "") {
      messages.push({ role: "user", content: input_question });
    }

    while (attempts < MAX_RETRY) {
      try {
        result = await axios.post(
          url,
          {
            messages,
            max_tokens: 500,
            model,
            temperature,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Exit the loop if the API call was successful
        if (result.status === 200) {
          break;
        }
      } catch (error) {
        // Handle the error response and retry if applicable
        if (error.response.status === 500 || error.response.status === 429) {
          attempts++;
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_SECONDS * 1000)
          );
        } else {
          // Handle other errors as desired
          return response
            .status(error.response.status)
            .send(error.response.data);
        }
      }
    }

    if (result === null) {
      // Handle the case when all retries failed
      return response
        .status(503)
        .json({ message: "Failed to connect to OpenAI API" });
    }

    try {
      const data = await ChatTable.create({
        visitor_id: visitorId,
        prompt_id: request.input("prompt_id"),
        chat_id: request.input("chat_id"),
        input_question:
          role == "system" ? prompt_text : request.input("input_question"),
        gpt_response:
          result.data?.choices.length > 0 &&
          result.data.choices[0].message.content,
        itmap_response:
          result.data?.choices.length > 0 &&
          result.data.choices[0].message.content,
      });

      return response.status(result.status).json(result.data);
    } catch (error) {
      return response
        .status(423)
        .json({ message: "Something went wrong!", error });
    }
  }
}

module.exports = GptChatTableController;
