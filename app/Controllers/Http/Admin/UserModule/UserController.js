"use strict";

const User = use("App/Models/Admin/UserModule/User");
const Query = use("Query");
const { validate } = use("Validator");
const moment = require("moment");
const Mail = use("Mail");
const Env = use("Env");
const searchInFields = ["users.id", "users.name"];
class UserController {
  async index({ request, response, view }) {
    const query = User.query();

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.select("users.*");
    query.select("roles.name as role");

    query.leftJoin("roles", "roles.id", "users.role_id");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "role":
            query.whereRaw(`roles.name LIKE '%${filter.value}%'`);
            break;
          case "created_at":
            query.whereRaw(
              `DATE(users.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              `DATE(users.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          default:
            query.whereRaw(`users.${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    var result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }

  async store({ request, response }) {
    const query = new User();
    query.role_id = request.input("role_id");
    query.name = request.input("name");
    query.email = request.input("email");
    query.mobile = request.input("mobile");
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = await User.findOrFail(params.id);
    const role = await query.role().fetch();
    query.role = role.name;
    return response.status(200).send(query);
  }

  async update({ params, request, response }) {
    let query = await User.findOrFail(params.id);
    query.role_id = request.input("role_id");
    query.name = request.input("name");
    query.email = request.input("email");
    query.mobile = request.input("mobile");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await User.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async changePassword({ params, request, response }) {
    let query = await User.findOrFail(params.id);
    query.password = request.input("password");
    await query.save();
    return response
      .status(200)
      .send({ message: "Password update successfully" });
  }

  async getProfile({ auth, response }) {
    const user = await auth.getUser();
    return response.status(200).send(user);
  }

  async updateProfile({ request, auth, response }) {
    const user = await auth.getUser();

    const rules = {
      name: "required",
      email: `required|unique:users,email,id,${user.id}`,
      password: "required",
    };
    const validation = await validate(request.all(), rules);

    if (validation.fails()) {
      return response.status(422).send(validation.messages());
    }

    user.name = request.input("name");
    user.email = request.input("email");
    user.mobile = request.input("mobile");
    user.password = request.input("password");
    await user.save();
    return response
      .status(200)
      .send({ message: "Profile update successfully" });
  }

  async forgotpassword({ request, auth, response }) {
    const email = request.input("email");

    let query = User.query();
    query.where("email", email);
    let result = await query.fetch();
    let [user] = result.toJSON();
    if (user) {
      //Send Password
      let accessToken = await auth.authenticator("jwt").generate(user);
      await this.sendForgotPasswordMail(user.id, email, accessToken);

      return response.status(200).send({
        message: "We have sent link to reset your password over email",
        token: accessToken,
      });
    } else {
      let msg = "Invalid Email ID.";

      throw new Error(msg);
    }
  }

  async forgot_resetpassword({ request, auth, response }) {
    const password = request.input("password");

    const user = await auth.authenticator("jwt").getUser();

    user.password = password;
    await user.save();

    return response.status(200).send({
      message: "Your new password is updated",
    });
  }

  async sendForgotPasswordMail(id, mail, access_token) {
    const user = await User.query().where("id", id).first();
    const subject = `ITMAP - Forgot Password`;
    const name = user.name ? user.name : "";
    // const details = `Dear ${
    //   name
    // } please use below link to reset your password.`;
    const details = `Please use below link to reset your password.`;
    const link = `${process.env.ADMIN_FORGOTPASSWORD}/auth/forgot_resetpassword?token=${access_token.token}`;
    console.log("link", link);
    await Mail.send(
      "forgotPassword",
      { title: subject, name, details: details, link: link },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(mail);
      }
    );
  }
}

module.exports = UserController;
