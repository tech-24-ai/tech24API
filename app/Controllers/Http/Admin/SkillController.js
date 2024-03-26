"use strict";
const SkillData = use("App/Models/Skill");
const Query = use("Query");
const searchInFields = ["name", "parent_id"];
const requestOnly = ["parent_id", "name"];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with skills
 */
class SkillController {
  /**
   * Show a list of all skills.
   * GET skills
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");
    const searchQuery = new Query(request, { order: "id" });
    const query = SkillData.query();

    query.with("parent", (builder) => {
      builder.select("id", "name");
    });

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

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));

      for (let index = 0; index < filters.length; index++) {
        const filterData = filters[index];
        switch (filterData.name) {
          case "parent.name": {
            const parentIds = await SkillData.query()
              .whereRaw(
                `parent_id is null and name LIKE '%${filterData.value}%'`
              )
              .groupBy("id")
              .pluck("id");
            query.whereIn("parent_id", parentIds);
            break;
          }

          default: {
            let queryStr = "";
            if (Array.isArray(filterData.value)) {
              filterData.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filterData.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filterData.name} LIKE '%${filterData.value}%'`;
            }
            query.whereRaw(queryStr);
            break;
          }
        }
      }
    }

    let result = await query.fetch();

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }

  // async skills({ request, response, view, auth }) {
  //   const query = SkillData.query();
  //   query.select("id", "name as label");
  //   query.where("parent_id", null);
  //   const result = await query.fetch();

  //   return response.status(200).json(result);
  // }

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

  async store({ request, response }) {
    try {
      const data = await SkillData.create({
        parent_id: request.input("parent_id"),
        name: request.input("name"),
      });
      return response.send(data);
    } catch (error) {
      console.log(error);
      return response.status(423).json({ message: "something went wrong !" });
    }
  }

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
  // async update({ params, request, response, auth }) {
  //   const body = request.only(requestOnly);
  //   const userId = auth.user.id;
  //   try {
  //     const query = await SkillData.findOrFail(params.id);
  //     query.updated_by = userId;
  //     query.merge(body);
  //     query.name = request.input("name");
  //     query.parent_id = request.input("parent_id");

  //     await query.save();
  //     return response.status(200).json({ message: "Update successfully" });
  //   } catch (error) {
  //     console.log(error);
  //     return response.status(200).json({ message: "Something went wrong" });
  //   }
  // }

  async update({ params, request, response }) {
    try {
      const { name, parent_id } = request.post();

      const skill = await SkillData.findOrFail(params.id);
      skill.name = name;
      skill.parent_id = parent_id;

      await skill.save();

      return response.status(200).json({ message: "Update successful", skill });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ message: "Something went wrong" });
    }
  }

  /**
   * Delete a skill with id.
   * DELETE skills/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const { id } = params;
    const query = await SkillData.findOrFail(id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
}

module.exports = SkillController;
