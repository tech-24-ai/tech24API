"use strict";

const Blog = use("App/Models/Admin/BlogModule/Blog");
const Query = use("Query");
const Module = use("App/Models/Admin/ProductModule/Module");
const ModuleRole = use("App/Models/Admin/UserModule/ModuleRole");
const CategoryRole = use("App/Models/Admin/UserModule/CategoryRole");
const Excel = require("exceljs");
const Category = use("App/Models/Admin/ProductModule/Category");
const moment = require("moment");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const searchInFields = ["blogs.id"];
class BlogController {
  async index({ request, response, auth }) {
    const query = Blog.query();
    const role_id = auth.user.role_id;

    const module_ids = await ModuleRole.query()
      .where("role_id", role_id)
      .pluck("module_id");

    const categoy_ids = await CategoryRole.query()
      .where("role_id", role_id)
      .pluck("category_id");

    let filterCategories = [];
    if (module_ids && module_ids.length > 0) {
      const category_ids = await Module.query()
        .whereIn("id", module_ids)
        .groupBy("category_id")
        .pluck("category_id");
      filterCategories = [...category_ids];
    }
    if (categoy_ids && categoy_ids.length) {
      categoy_ids.map((id) => {
        if (!filterCategories.includes(id)) {
          filterCategories.push(id);
        }
      });
    }

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.select("blogs.*");
    query.select("categories.name as blog_topic");

    query.leftJoin("categories", "categories.id", "blogs.blog_topic_id");

    if (filterCategories.length) {
      query.whereIn("categories.id", filterCategories);
    }
    // query.orWhereIn("categories.id", [1]);

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(
        searchQuery.search(["blogs.name", "categories.name", "details"])
      );
    }

    var blog_topic_name = "";
    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `blogs.created_at`,
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: `blogs.updated_at`,
                date: filter.value,
              })
            );
            break;
          case "status":
            query.whereIn("blogs.status", filter.value);
            break;
          case "blog_topic":
            query.whereRaw(`categories.name LIKE '%${filter.value}%'`);
            break;
          case "blog_topics.name":
            blog_topic_name = filter.value;
            break;
          default:
            query.whereRaw(`blogs.${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (blog_topic_name.length > 0) {
      const categoryids = await Category.query()
        .whereRaw(`name LIKE '%${blog_topic_name}%'`)
        .pluck("id");
      if (categoryids.length > 0)
        query.whereRaw("blog_topic_id in (?)", [categoryids]);
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
    const query = new Blog();
    query.blog_topic_id = request.input("blog_topic_id");
    query.meta_title = request.input("meta_title");
    query.meta_keywords = request.input("meta_keywords");
    query.meta_description = request.input("meta_description");
    query.name = request.input("name");
    query.image = request.input("image");
    query.banner = request.input("banner");
    query.slug = request.input("slug");
    query.details = request.input("details");
    query.html = request.input("html");
    if (request.input("status")) query.status = request.input("status");
    //status 0: Inactive, 1: Active Live, 2: Draft
    else query.status = 2;
    await query.save();
    return response.status(200).send({ message: "Created successfully" });
  }

  async show({ params, response }) {
    const query = await Blog.findOrFail(params.id);
    const blog_topic = await query.blog_topic().fetch();
    if (blog_topic) {
      query.blog_topic = blog_topic.name;
    } else {
      query.blog_topic = "";
    }
    return response.status(200).send(query);
  }

  async update({ params, request, response }) {
    const query = await Blog.findOrFail(params.id);
    query.blog_topic_id = request.input("blog_topic_id");
    query.meta_title = request.input("meta_title");
    query.meta_keywords = request.input("meta_keywords");
    query.meta_description = request.input("meta_description");
    query.name = request.input("name");
    query.image = request.input("image");
    query.banner = request.input("banner");
    query.slug = request.input("slug");
    query.details = request.input("details");
    query.html = request.input("html");
    query.status = request.input("status"); //status 0: Inactive, 1: Active Live, 2: Draft
    await query.save();
    return response.status(200).send({ message: "Updated successfully" });
  }

  async destroy({ params, response }) {
    const query = await Blog.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Deleted successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async exportReport({ request, response, auth }) {
    const query = Blog.query();

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.select("blogs.*");
    query.select("categories.name as blog_topic");

    query.leftJoin("categories", "categories.id", "blogs.blog_topic_id");

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
              `DATE(blogs.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              `DATE(blogs.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "blog_topic":
            query.whereRaw(`blog_topics.name LIKE '%${filter.value}%'`);
            break;
          default:
            query.whereRaw(`blogs.${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    var result = await query.fetch();

    const fileName = "blogs-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Blog List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        let blogstatus = "Inactive";

        if (element.status == 1) {
          blogstatus = "Active";
        } else if (element.status == 2) {
          blogstatus = "Draft";
        }

        exportData.push({
          sno: index++,
          name: element.name,
          blog_topic: element.blog_topic,
          html: element.html,
          meta_title: element.meta_title,
          meta_keywords: element.meta_keywords,
          meta_description: element.meta_description,
          slug: element.slug,
          image: element.image,
          banner: element.banner,
          status: blogstatus,
          created: element.created_at,
          updated: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "Blog Title", key: "name", width: 30, style: { font: font } },
      {
        header: "Blog Category",
        key: "blog_topic",
        width: 30,
        style: { font: font },
      },
      {
        header: "HTML Description",
        key: "html",
        width: 60,
        style: { font: font },
      },
      {
        header: "Meta Title",
        key: "meta_title",
        width: 30,
        style: { font: font },
      },
      {
        header: "Meta Keywords",
        key: "meta_keywords",
        width: 30,
        style: { font: font },
      },
      {
        header: "Meta Description",
        key: "meta_description",
        width: 60,
        style: { font: font },
      },
      {
        header: "Blog SEO Slug URL",
        key: "slug",
        width: 40,
        style: { font: font },
      },
      {
        header: "Thumbnail URL",
        key: "image",
        width: 40,
        style: { font: font },
      },
      { header: "Banner URL", key: "banner", width: 40, style: { font: font } },
      { header: "Status", key: "status", width: 20, style: { font: font } },
      {
        header: "Created",
        key: "created_at",
        width: 30,
        style: { font: font },
      },
      {
        header: "Updated",
        key: "updated_at",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.getColumn(4).alignment = { wrapText: true };
    worksheet.getColumn(7).alignment = { wrapText: true };
    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
}

module.exports = BlogController;
