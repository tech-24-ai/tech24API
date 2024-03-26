"use strict";

class StoreAcquisition {
  get rules() {
    return {
      type: "required",
      value: "required",
      name: "required",
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreAcquisition;
