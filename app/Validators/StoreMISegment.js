"use strict";

class StoreMISegment {
  get rules() {
    const id = this.ctx.params.id;
    if (id) {
      return {
        name: `required|unique:mi_segments,name,id,${id}`,
        order_no: `required|unique:mi_segments,order_no,id,${id}`,
        description: `required`,
      };
    } else {
      return {
        name: "required|unique:mi_segments,name",
        order_no: `required|unique:mi_segments,order_no`,
        description: "required",
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
