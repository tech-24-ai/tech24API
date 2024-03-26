"use strict";
const ConsultantRateCard = use(
  "App/Models/Admin/ConsultantModule/ConsultantRateCard"
);
const ConsultantRateCardHistory = use(
  "App/Models/Admin/ConsultantModule/ConsultantRateCardHistory"
);
const Database = use("Database");
const Query = use("Query");
const moment = require("moment");
const { getProfile } = require("../../../../Helper/consultant");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

const requestOnly = ["amount_per_hour", "min_minute", "max_minute", "skill_id"];
const searchInFields = ["skill", "amount_per_hour"];
class ConsultantRateCardController {
  async index({ request, response, view, auth }) {
    const query = ConsultantRateCard.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const user = await getProfile(auth);
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    query.with("skills");

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
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }
    // if consultant not logged in
    if (consultantId && user.consultant_id == undefined) {
      query.where("consultant_id", consultantId);
    }
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
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

    return response.status(200).json(result);
  }

  async store({ request, response, auth }) {
    const body = request.only(requestOnly);
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);
    const userId = user.id;
    const consultant_id = user.consultant_id
      ? user.consultant_id
      : request.input("consultant_id");
    try {
      const rateData = await ConsultantRateCard.query()
        .whereRaw("consultant_id=? and skill_id=?", [
          consultant_id,
          body.skill_id,
        ])
        .first();
      if (rateData) {
        return response
          .status(423)
          .json({ message: "Rate already exist for selected skill" });
      } else {
        const query = await ConsultantRateCard.create(
          {
            ...body,
            consultant_id,
            created_by: userId,
            updated_by: userId,
          },
          trx
        );

        await ConsultantRateCardHistory.create(
          {
            ...body,
            rate_card_id: query.id,
            created_by: userId,
          },
          trx
        );
        await trx.commit();
        return response.status(200).json({ message: "Create successfully" });
      }
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async show({ params, request, response, view, auth }) {
    const user = await getProfile(auth);
    const query = ConsultantRateCard.query();
    query.where("id", params.id);
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    const result = await query.firstOrFail();
    return response.status(200).json(result);
  }

  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);
    const userId = user.id;

    const consultantId = user.consultant_id
      ? user.consultant_id
      : request.input("consultant_id");
    try {
      const rateData = await ConsultantRateCard.query()
        .whereRaw("consultant_id=? and skill_id=? and id!=?", [
          consultantId,
          body.skill_id,
          params.id,
        ])
        .first();
      if (rateData) {
        return response
          .status(423)
          .json({ message: "Rate already exist for selected skill" });
      } else {
        const query = await ConsultantRateCard.findOrFail(params.id);
        query.updated_by = userId;
        query.consultant_id = consultantId;
        query.merge(body);
        await query.save(trx);
        await ConsultantRateCardHistory.create(
          {
            ...body,
            rate_card_id: query.id,
            created_by: userId,
          },
          trx
        );
        await trx.commit();
        return response.status(200).json({ message: "Update successfully" });
      }
    } catch (error) {
      await trx.rollback();
      console.log("ERROR", error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async destroy({ params, request, response }) {
    const Database = use("Database");
    const trx = await Database.beginTransaction();
    try {
      const query = await ConsultantRateCard.findOrFail(params.id, trx);
      await query.delete(trx);
      await ConsultantRateCardHistory.query(trx)
        .where("rate_card_id", params.id)
        .delete(trx);

      await trx.commit();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      await trx.rollback();
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
}

module.exports = ConsultantRateCardController;
