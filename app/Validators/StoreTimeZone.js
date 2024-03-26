"use strict";

class StoreTimeZone {
  get rules() {
    return {
      name: "required",
      offset: "required",
      zone: "required",
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreTimeZone;
