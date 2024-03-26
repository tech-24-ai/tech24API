"use strict";

class GptChat {
  get rules() {
    return {
      prompt_text: "required",
      subject: "required",
      user_id: "required",
    };
  }
  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response
      .status(422)
      .send({ message: "Please fill all the details" });
  }
}

module.exports = GptChat;
