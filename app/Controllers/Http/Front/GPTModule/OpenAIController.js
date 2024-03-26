const axios = use("axios");
const Env = use("Env");
const openAi = use("App/Models/Front/GPTModule/OpenAI");
class OpenAIController {
  async index() {
    return openAi.all();
  }
  async generateCompletion({ request, response }) {
    const { prompt, length } = request.all();

    // const apiKey = "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";
    const apiKey = Env.get("OPENAI_API_KEY");
    const url = "https://api.openai.com/v1/completions";
    const model = "text-davinci-003";

    try {
      const result = await axios.post(
        url,
        {
          prompt,
          max_tokens: length,
          model,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return result.data.choices[0].text;
    } catch (error) {
      response.status(error.response.status).send(error.response.data);
    }
  }
}

module.exports = OpenAIController;
