"use strict";
const Query = use("Query");
const Skill = use("App/Models/Skill");

const searchInFields = ["name"];

class SkillController {
  async index({ request, response }) {
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");
    const searchQuery = new Query(request, { order: "id" });

    const query = Skill.query();

    if (orderBy && orderPos) {
      query.orderBy(`${orderBy}`, orderPos);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("only_parent")) {
      query.where("parent_id", null);
    }

    if (request.input("parent_id")) {
      query.where("parent_id", request.input("parent_id"));
    }

    const result = await query.fetch();

    return response.status(200).send(result);
  }

  async skills({ request, response, view, auth }) {
    const query = Skill.query();
    query.select("id", "name as label", "id as value");
    query.where("parent_id", null);
    if (request.input("withChildren")) {
      query.with("children", (builder) => {
        builder.select("id as value", "name as label", "parent_id");
      });
    }
    const result = await query.fetch();

    return response.status(200).json(result);
  }

  async subSkills({ request, response, view, auth }) {
    const query = Skill.query();

    query.whereNotNull("parent_id");
    if (request.input("skillIds")) {
      const parentIds = JSON.parse(request.input("skillIds"));
      query.whereIn("parent_id", parentIds);
    }
    query.select("id", "parent_id", "name as label");
    const result = await query.fetch();
    console.log("result", result);

    return response.status(200).json(result);
  }

  /**
   * Render a form to be used for creating a new skill.
   * GET skills/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new skill.
   * POST skills
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {}

  /**
   * Display a single skill.
   * GET skills/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {}

  /**
   * Render a form to update an existing skill.
   * GET skills/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update skill details.
   * PUT or PATCH skills/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a skill with id.
   * DELETE skills/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = SkillController;
