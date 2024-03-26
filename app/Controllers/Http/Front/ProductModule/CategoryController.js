"use strict";
const Category = use("App/Models/Admin/ProductModule/Category");
class CategoryController {
  async index({ request, response, view }) {
    let page, perPage;
    const where = ["id", "name"];

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("perPage")) {
      perPage = request.input("perPage");
    }
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");

    const query = Category.query();
    const not_categories = request.input("not_categories");
    if (not_categories) query.whereNotIn("id", JSON.parse(not_categories));

    const category_name = request.input("category_name");
    if (category_name) {
      query.where("name", category_name);
    }

    if (orderBy && orderPos) {
      query.orderBy(orderBy, orderPos);
    }
    if (search) {
      where.forEach((filed) => {
        query.orWhereRaw(`${filed} LIKE '%${search}%'`);
      });
    }

    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async show({ params, request, response, view }) {
    const query = await Category.findOrFail(params.id);
    return response.status(200).send(query);
  }
}

module.exports = CategoryController;
