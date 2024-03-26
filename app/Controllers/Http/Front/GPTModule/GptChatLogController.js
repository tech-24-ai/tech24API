"use strict";
const ChatLog = use("App/Models/Front/GPTModule/GptChatLog");
class GptChatLogController {
  async index() {
    return ChatLog.all();
    // return allData.map((item) => item.serialize({ fields: ["input"] }));
  }

  async store({ request, response }) {
    try {
      const data = await ChatLog.create({
        // id: request.input("id"),
        input: request.input("input"),
        request: request.input("request"),
        response: request.input("response"),
      });
      return response.send(data);
    } catch (error) {
      console.log(error);
      return response.status(423).json({ message: "something went wrong !" });
    }
  }
}

module.exports = GptChatLogController;
