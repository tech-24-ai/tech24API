"use strict";

const Question = use("App/Models/Admin/ProductModule/Question");
const QuestionOption = use("App/Models/Admin/ProductModule/QuestionOption");
const Query = use("Query");
const moment = require("moment");
const searchInFields = ["id", "name"];
class QuestionController {
  async index({ request, response, view }) {
    const query = Question.query();

    if (request.input("step_id")) {
      query.where("step_id", request.input("step_id"));
    }

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

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
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "option_type":
            query.whereIn("option_type", filter.value);
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
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

  async storeOptions(id, request) {
    await QuestionOption.query().where("question_id", id).delete();

    if (request.input("options")) {
      var QuestionOptionData = [];
      const optionsData = JSON.parse(request.input("options"));
      optionsData.forEach((data, index) => {
        QuestionOptionData.push({
          question_id: id,
          option_id: data.option_id,
          sort_order: index,
        });
      });
      await QuestionOption.createMany(QuestionOptionData);
    }

    return true;
  }

  async store({ request, response }) {
    const query = new Question();
    query.step_id = request.input("step_id");
    query.name = request.input("name");
    query.option_type = request.input("option_type");
    query.tags = request.input("tags");
    query.notes = request.input("notes");
    query.isNotSure = request.input("isNotSure");

    await query.save();

    this.storeOptions(query.id, request);
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = await Question.query()
      .with("step", (builder) => {
        builder.setVisible(["name"]);
      })
      .with("option", (builder) => {
        builder.setVisible(["id", "question_id", "option_id", "sort_order"]);
        builder.orderBy("sort_order", "ASC");
      })
      .where("id", params.id)
      .first();

    return response.status(200).send(query);
  }

  async update({ params, request, response }) {
    const query = await Question.findOrFail(params.id);

    query.step_id = request.input("step_id");
    query.name = request.input("name");
    query.option_type = request.input("option_type");
    query.tags = request.input("tags");
    query.notes = request.input("notes");
    query.isNotSure = request.input("isNotSure");
    await query.save();

    this.storeOptions(query.id, request);
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await Question.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async question_options({ request, response, view }) {
    const query = QuestionOption.query();
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = QuestionController;
