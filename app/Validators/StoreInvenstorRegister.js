"use strict";

class StoreInvenstorRegister {
  get rules() {
    return {
      name: "required",
      email: "required|email|unique:investors,email",
      mobile: "required|min:10",
      designation: "required",
      company: "required",
      password: "required",
    };
  }

  get validateAll() {
    return true;
  }

  get messages() {
    return {
      "email.unique": "Email address already register",
      "email.required": "UserId/Email is required",
      "mobile.min": "Mobile number length should be atleast 10 characters",
      "mobile.required": "Mobile number length should be atleast 10 characters",
      "password.required": "Password is required",
      "designation.required": "Designation is required",
      "company.required": "Company is required",
      "name.required": "Name is required",
    };
  }
  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreInvenstorRegister;
