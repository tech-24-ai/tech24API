"use strict";
const Query = use("Query");
const Database = use("Database");
const moment = require("moment");
const Excel = require("exceljs");
const {
  dateFilterExtractor,
  maskData,
} = require("../../../../Helper/globalFunctions");
const { newConsultantSignupMail } = require("../../../../Helper/consultant");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const ConsultantSkill = use(
  "App/Models/Admin/ConsultantModule/ConsultantSkill"
);
const ConsultantRateCardController = use(
  "App/Models/Admin/ConsultantModule/ConsultantRateCard"
);
const ConsultantTechnology = use(
  "App/Models/Admin/ConsultantModule/ConsultantTechnology"
);

const requestOnly = [
  "first_name",
  "email",
  "mobile",
  "country_id",
  "linkedin_url",
  "is_company",
  "number_of_employee",
  "years_of_experience",
  "website",
  "name_of_company_representative",
];
const searchInFields = ["first_name", "last_name"];
const selectFields = [
  "id",
  "first_name",
  "middle_name",
  "last_name",
  "image",
  "tags",
  "profile_summary",
  "details",
  "country_id",
  "avg_rating",
  "status",
  "is_company",
  "number_of_employee",
];
class ConsultantController {
  async index({ request, response, view }) {
    const query = Consultant.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("regions", (builder) => {
      builder.select("id", "name");
    });
    // query.with("technologies", (builder) => {
    //   builder.select("id", "consultant_id", "name");
    // });
    query.with("chat_history", (builder) => {
      builder.select(
        "id as chat_id",
        "consultant_id",
        "booking_id",
        "allow_visitor_message",
        "chat_active_deadline"
      );
    });

    query.with("works", (builder) => {
      builder.select(
        "id",
        "consultant_id",
        "from_year",
        "to_year",
        "is_present",
        "company_name",
        "company_logo",
        "designation"
      );
    });

    query.with("rates", (builder) => {
      builder.with("sub_skills", (builder) => {
        builder.select("id", "parent_id", "name");
      });
      builder.innerJoin(
        "skills",
        "consultant_rate_cards.skill_id",
        "skills.id"
      );
      builder.select(
        "consultant_rate_cards.id",
        "consultant_id",
        "amount_per_hour",
        "min_minute",
        "max_minute",
        "skill_id",
        "skills.name as skill"
      );
    });
    query.with("country", (builder) => {
      builder.select("id", "group_id", "name");
    });

    query.withCount('booking as total_booking');

    if (orderBy == 'top_consultants') {
			query.orderBy('total_booking', 'DESC');
		} else if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      const filterKeys = Object.keys(filters);

      for (let index = 0; index < filterKeys.length; index++) {
        const key = filterKeys[index];
        switch (key) {
          case "location": {
            const locationIds = filters[key].map((data) => data.id);
            if (locationIds.length) {
              query.whereIn("country_id", locationIds);
            }
            break;
          }
          case "skills": {
            const skillIds = filters[key].map((data) => data.id);
            const tech_consultantIds =
              await ConsultantRateCardController.query()
                .whereIn("skill_id", skillIds)
                .groupBy("consultant_id")
                .pluck("consultant_id");
            query.whereIn("id", tech_consultantIds);
            break;
          }
          case "subskills": {
            const skillIds = [
              ...new Set(filters[key].map((data) => data.parent_id)),
            ];
            const tech_consultantIds =
              await ConsultantRateCardController.query()
                .whereIn("skill_id", skillIds)
                .groupBy("consultant_id")
                .pluck("consultant_id");
            query.whereIn("id", tech_consultantIds);
            break;
          }
          default:
            break;
        }
      }
    }

    if (request.input("consultant_id")) {
      query.where("id", request.input("consultant_id"));
    }

    if (request.input("is_company")) {
      query.where("is_company", request.input("is_company"));
    }

    query.where("status", "Active");

    query.select(selectFields);

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
      result = (await query.paginate(page, pageSize)).toJSON();
      result.data = await maskData(result.data, {
        phone: ["first_name", "last_name", "country.name"],
      });
    } else if (!page && pageSize) {
      result = (await query.limit(pageSize).fetch()).toJSON();
      result.data = await maskData(result.data, {
        phone: ["first_name", "last_name", "country.name"],
      });
    } else {
      result = (await query.fetch()).toJSON();
      result = await maskData(result, {
        phone: ["first_name", "last_name", "country.name"],
      });
    }

    return response.status(200).send(result);
  }

  async store({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    const body = request.only(requestOnly);
    const skillIds = JSON.parse(request.input("skills"));

    try {
      const isEmailExist = await Consultant.findBy({
        email: request.input("email"),
      });
      if (isEmailExist) {
        return response
          .status(422)
          .send([{ message: "Duplicate email found" }]);
      }
      // const userId = auth.user.id;

      const query = await Consultant.create(
        {
          ...body,
          // created_by: userId,
          // updated_by: userId,
          status: "Pending",
        },
        trx
      );
      if (query && skillIds) {
        const skillData = skillIds.map((id) => ({
          consultant_id: query.id,
          parent_id: id,
        }));
        await ConsultantSkill.createMany(skillData, trx);
      }
      await trx.commit();
      await newConsultantSignupMail({
        name: body.first_name,
        email: body.email,
      });
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      console.log(error);
      trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async show({ params, request, response, view }) {}

  async edit({ params, request, response, view }) {}

  /**
   * Update consultant details.
   * PUT or PATCH consultants/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a consultant with id.
   * DELETE consultants/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = ConsultantController;
