"use strict";
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const auth = require("@adonisjs/auth");
const { complaintMail } = require("../../../../Helper/consultant");

const Complaint = use("App/Models/Admin/ConsultantModule/Complaint");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Role = use("App/Models/Admin/UserModule/Role");
const User = use("App/Models/Admin/UserModule/User");

const requestOnly = ["subject", "message", "complain_by", "ref_id"];
const consultantFields = [
  "id",
  "first_name",
  "middle_name",
  "last_name",
  "avg_rating",
  "image",
];
const visitorFields = [
  "id",
  "name",
  "email",
  "designation",
  "company",
  "profile_pic_url",
];

const searchInFields = ["subject","complain_by", "message"];

class ComplaintController {
  async index({ request, response, view, auth }) {
    const query = Complaint.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const role = await this.getUserRole(auth);
    query.join("consultants", "complaints.ref_id", "consultants.id");
    // if (role === "Consultant") {
    //   query.whereRaw("user_id = ? and complain_by=?", [
    //     auth.user.id,
    //     "consultant",
    //   ]);
    // }
    

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }

    if (search) {
      query.where((builder) => {
        builder.whereHas("consultant", (subQuery) => {
          subQuery.where(function () {
            this.where("first_name", "LIKE", `%${search}%`)
              .orWhere("last_name", "LIKE", `%${search}%`);
          });
        }).orWhere("complain_by", "LIKE", `%${search}%`)
          .orWhere("message", "LIKE", `%${search}%`)
          .orWhere("ref_id", "LIKE", `%${search}%`); 
      });
      query.orWhere(function () {
        this.where("complain_by", "LIKE", `%${search}%`)
          .orWhere("ref_id", "LIKE", `%${search}%`);
      });
    }


    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "consultant.first_name":
            query.whereRaw(`consultants.first_name LIKE '%${filter.value}%'`);
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    query.select("complaints.*");

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

      for (let index = 0; index < result.rows.length; index++) {
        const element = result.rows[index];
        if (element.complain_by === "consultant") {
          const data = await Visitor.query()
            .where("id", element.ref_id)
            .select(visitorFields)
            .firstOrFail();

          const complainBy = await User.query()
            .where("id", element.user_id)
            .select("id", "name", "email", "mobile")
            .firstOrFail();

          element.visitor = data;
          element.raised_by = complainBy;
          element.consultant = null;
        } else {
          const data = await Consultant.query()
            .where("id", element.ref_id)
            .select(consultantFields)
            .firstOrFail();
          const complainBy = await Visitor.query()
            .where("id", element.user_id)
            .select(visitorFields)
            .firstOrFail();
          element.visitor = null;
          element.consultant = data;
          element.raised_by = complainBy;
        }
      }
    } else {
      result = await query.fetch();
      for (let index = 0; index < result.rows.length; index++) {
        const element = result.rows[index];
        if (element.complain_by === "consultant") {
          const data = await Visitor.query()
            .where("id", element.ref_id)
            .select(visitorFields)
            .firstOrFail();
          const complainBy = await User.query()
            .where("id", element.user_id)
            .select("id", "name", "email", "mobile")
            .firstOrFail();
          element.visitor = data;
          element.raised_by = complainBy;
          element.consultant = null;
        } else {
          const data = await Consultant.query()
            .where("id", element.ref_id)
            .select(consultantFields)
            .firstOrFail();
          const complainBy = await Visitor.query()
            .where("id", element.user_id)
            .select(visitorFields)
            .firstOrFail();
          element.visitor = null;
          element.consultant = data;
          element.raised_by = complainBy;
        }
      }
    }
    return response.status(200).json(result);
  }

  async store({ request, response, auth }) {
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    const code = `${moment().format("YYYYMMDD")}${
      Math.floor(Math.random() * 90000) + 10000
    }`;
    const query = await Complaint.create({
      ...body,
      code,
      user_id: userId,
      complain_by: "consultant",
      created_by: userId,
      updated_by: userId,
    });

    const data = await Visitor.query()
      .where("id", body.ref_id)
      .select("id", "name")
      .firstOrFail();
    const complainBy = await User.query()
      .where("id", userId)
      .select("id", "name")
      .firstOrFail();

    const mailData = {
      code,
      complainBy: "consultant",
      subject: body.subject,
      message: body.message,
      consultantName: complainBy.name,
      visitorName: data.name,
    };

    // send mail
    await complaintMail(mailData);

    return response.status(200).json({ message: "Create successfully" });
  }

  async show({ params, request, response, view, auth }) {
    const query = Complaint.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();

    if (result.complain_by === "consultant") {
      const data = await Visitor.query()
        .where("id", result.ref_id)
        .select(visitorFields)
        .firstOrFail();
      const complainBy = await User.query()
        .where("id", result.user_id)
        .select("id", "name", "email", "mobile")
        .firstOrFail();
      result.visitor = data;
      result.raised_by = complainBy;
      result.consultant = null;
    } else {
      const data = await Consultant.query()
        .where("id", result.ref_id)
        .select(consultantFields)
        .firstOrFail();
      const complainBy = await Visitor.query()
        .where("id", result.user_id)
        .select(visitorFields)
        .firstOrFail();
      result.visitor = null;
      result.consultant = data;
      result.raised_by = complainBy;
    }
    return response.status(200).send(result);
  }

  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    const query = await Complaint.findOrFail(params.id);
    query.updated_by = userId;
    query.merge(body);
    await query.save();

    return response.status(200).json({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {}

  async response({ params, request, response, auth }) {
    const userId = auth.user.id;
    const query = await Complaint.findOrFail(params.id);
    query.updated_by = userId;
    query.admin_remarks = request.input("admin_remarks");
    await query.save();
    return response.status(200).json({ message: "Update successfully" });
  }

  async getUserRole(auth) {
    const user = await auth.authenticator("jwt").getUser();
    const query = await Role.findOrFail(user.role_id);
    return query.name;
  }
}

module.exports = ComplaintController;
