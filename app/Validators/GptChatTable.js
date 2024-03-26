"use strict";

class GptChatTable {
  get rules() {
    return {
      visitor: "required",
      prompt_id: "required",
      chat_id: "required",
      input_question: "required",
      gpt_response: "required",
      itmap_response: "required",
    };
  }
  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response
      .status(422)
      .send({ message: "All fields are required" });
  }
}

module.exports = GptChatTable;
