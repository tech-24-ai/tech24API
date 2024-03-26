"use strict";

class StoreMISegment {
  get rules() {
    const id = this.ctx.params.id;
    if (id) {
      return {
        name: `required|unique:mi_segments,name,id,${id}`,
      };
    } else {
      return {
        name: "required|unique:mi_segments,name",
      };
    }
  }

  get validateAll() {
    return true;
  }
  get messages() {
    return {
      "order_no.unique": "Sort order already exists",
    };
  }
  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreMISegment;
