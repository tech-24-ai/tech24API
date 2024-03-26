"use strict";
const User = use("App/Models/User");
const Role = use("App/Models/Admin/UserModule/Role");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const PermissionRole = use("App/Models/Admin/UserModule/PermissionRole");
class AuthController {
  async register({ request, auth, response }) {
    const email = request.input("email");
    const password = request.input("password");

    let query = new User();
    query.role_id = 1;
    query.email = email;
    query.password = password;
    await query.save();
    const result = await User.findByOrFail("email", query.email);
    let accessToken = await auth.generate(result);
    return response.status(200).send({
      message: "Create successfully",
      data: { user: result, access_token: accessToken },
    });
  }

  async login({ request, auth, response }) {
    const email = request.input("email");
    const password = request.input("password");

    if (await auth.attempt(email, password)) {
      let user = await User.findByOrFail("email", email);
      const role = await Role.query().where("id", user.role_id).first();
      if (role) {
        user.role = role.name;
      }
      if (role.name == "Consultant") {
        const consultantData = await Consultant.query()
          .where("user_id", user.id)
          .first();
        user.isCompany = consultantData.is_company;
      }
      const query = PermissionRole.query();
      query.where("role_id", user.role_id);
      query.with("permission");
      const permissions = await query.fetch();

      let accessToken = await auth.generate(user);
      return response.status(200).send({
        message: "Login successful",
        data: {
          user: user,
          permissions: permissions,
          access_token: accessToken,
        },
      });
    } else {
      return response
        .status(404)
        .send({ message: "You first need to register!" });
    }
  }
}

module.exports = AuthController;
