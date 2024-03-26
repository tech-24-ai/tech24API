"use strict";
const Database = use("Database");
const SearchReport = use("App/Models/Report/SearchReport");
const SearchReportQuestion = use("App/Models/Report/SearchReportQuestion");
const SearchReportOption = use("App/Models/Report/SearchReportOption");
const SearchReportSubOption = use("App/Models/Report/SearchReportSubOption");
const SearchReportProduct = use("App/Models/Report/SearchReportProduct");
const SearchReportQuestionsTime = use(
  "App/Models/Report/SearchReportQuestionsTime"
);
const Product = use("App/Models/Product");
const Industry = use("App/Models/Admin/ProductModule/Industry");
const Module = use("App/Models/Admin/ProductModule/Module");
const IndustryVendor = use("App/Models/Admin/VendorModule/IndustryVendor");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Country = use("App/Models/Admin/LocationModule/Country");
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");
const Category = use("App/Models/Admin/ProductModule/Category");
const Flow = use("App/Models/Admin/ProductModule/Flow");
const FlowQuestion = use("App/Models/Admin/ProductModule/FlowQuestion");
const QuestionOption = use("App/Models/Admin/ProductModule/QuestionOption");
const Query = use("Query");
const Logger = use("Logger");
const _ = require("lodash");
const moment = require("moment");

const searchInFields = [
  // "vendor",
  "categories.name",
  "modules.name",
  "visitors.name",
  "search_reports.created_at",
];
const searchInFieldOptions = [
  "questions.name",
  "options.name",
  "visitors.name",
  "search_reports.created_at",
];

class SearchReportController {
  async index({ request, response }) {
    const query = SearchReport.query();

    query.select("search_reports.*");
    query.select("categories.name as category");
    query.select("modules.name as module");
    query.select("visitors.name as visitor");
    query.with("questions", (builder) => {
      builder.select("search_report_questions.*");
      builder.select("questions.name as question");
      builder
        .leftJoin(
          "questions",
          "questions.id",
          "search_report_questions.question_id"
        )
        .with("options", (optionBuilder) => {
          optionBuilder.select("search_report_options.*");
          optionBuilder.select("options.name as option");
          optionBuilder
            .leftJoin(
              "options",
              "options.id",
              "search_report_options.option_id"
            )
            .with("sub_options", (optionBuilder) => {
              optionBuilder.select("search_report_sub_options.*");
              optionBuilder.select("options.name as option");
              optionBuilder.leftJoin(
                "options",
                "options.id",
                "search_report_sub_options.sub_option_id"
              );
            });
        });
    });
    query.with("products");
    query.withCount("questions");
    query.withCount("products");

    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.leftJoin("modules", "modules.id", "search_reports.module_id");
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");

    if (request.input("category_id")) {
      query.where("search_reports.category_id", request.input("category_id"));
    }
    if (request.input("module_id")) {
      query.where("search_reports.module_id", request.input("module_id"));
    }
    if (request.input("visitor_id")) {
      query.where("search_reports.visitor_id", request.input("visitor_id"));
    }
    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(
        `DATE(search_reports.created_at) >= '${request.input("start_date")}'`
      );
      query.whereRaw(
        `DATE(search_reports.created_at) <= '${request.input("end_date")}'`
      );
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
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (request.input("groupBy")) {
      query.groupByRaw(request.input("groupBy"));
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    let result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }

  async store({ request, response, auth }) {
    let visitor = {};
    // check user loggedIn
    if (
      auth.jwtPayload ||
      (auth.jwtPayload == undefined && request.input("isloggedIn"))
    ) {
      visitor = await auth.authenticator("visitorAuth").getUser();
    } else {
      const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
      let guest_ip = _.trim(_.first(ipAddress));
      guest_ip =
        guest_ip && guest_ip != ""
          ? guest_ip
          : request.request.socket.remoteAddress;
      visitor = await Visitor.findBy({ visitor_ip: guest_ip });
    }

    const query = new SearchReport();

    query.category_id = request.input("category_id");
    query.module_id = request.input("module_id");
    query.is_advanced = request.input("is_advanced");
    query.industry_id = request.input("industry_id");
    query.country_id = request.input("country_id");
    query.visitor_id = visitor.id;
    query.org_size = visitor.company_size;

    await query.save();

    Logger.transport("file").info(
      `search category_id: ${request.input("category_id")}`
    );
    Logger.transport("file").info(
      `search module_id: ${request.input("module_id")}`
    );
    Logger.transport("file").info(`search visitor: ${visitor.id}`);

    Logger.transport("file").info(
      `search is_advanced: ${request.input("is_advanced")}`
    );

    this.storeOptions(query.id, request);

    let filter = {};
    let includeVendorsLessThanFiveYears = true;
    let includeVendorsLessThanThreeYears = true;
    if (request.input("questions")) {
      const questions = JSON.parse(request.input("questions"));

      if (questions.length) {
        let questionsFilter = [];
        if (questions) {
          questions.forEach(async (element) => {
            let value = Number(element.value);
            if (Array.isArray(element.value)) {
              value = { $in: element.value };
            }

            if (element.value == 0) {
              let questionIds = await QuestionOption.query()
                .where("question_id", element.id)
                .pluck("option_id");
              questionIds = questionIds.toString().split(",");
              value = { $in: questionIds };
            }

            if (element.id == 86 && element.value == 46) {
              includeVendorsLessThanFiveYears = false;
            }

            if (element.id == 23 && element.value == 46) {
              includeVendorsLessThanThreeYears = false;
            }

            let findElement = {};
            findElement["id"] = Number(element.id);
            findElement["value"] = value;
            if (element.subValue && element.subValue.length) {
              findElement["subValue"] = { $in: element.subValue };
            }

            if (element.priority && element.priority.length) {
              let priorityTemp = element.value.map((v, i) => ({
                priority: {
                  $elemMatch: {
                    id: v,
                    value: { $in: [...element.priority[i], "0"] },
                  },
                },
              }));
              priorityTemp.push({
                priority: { $in: [null, []] },
              });
              findElement = {
                ...findElement,
                $or: priorityTemp,
              };
            }

            if (parseInt(element.id) == 86 || parseInt(element.id) == 23) {
            } else {
              questionsFilter.push({
                $elemMatch: findElement,
              });
            }
          });
        }
        filter.questions = { $all: questionsFilter };
      }
    }

    // get parent from industry then filter
    // if (request.input("industry_id")) {
    //   let industry_id;

    //   const industryQuery = await Industry.findOrFail(
    //     request.input("industry_id")
    //   );

    //   if (industryQuery.parent_id) {
    //     industry_id = industryQuery.parent_id;
    //   } else {
    //     industry_id = industryQuery.id;
    //   }

    //   const industryVendorQuery = IndustryVendor.query();
    //   industryVendorQuery.where("industry_id", industry_id);
    //   var vendorIds = await industryVendorQuery.pluck("vendor_id");
    //   const vendorQuery = Vendor.query();
    //   vendorQuery.whereIn("id", vendorIds);
    //   const vendors = await vendorQuery.pluck("name");
    //   if (vendors && vendors.length) {
    //     filter.vendor = { $in: vendors };
    //   }
    // }

    // get country group by country id then filter by country group ids
    if (request.input("country_id")) {
      const countryQuery = await Country.findOrFail(
        request.input("country_id")
      );
      const countryGroupQuery = await CountryGroup.findOrFail(
        countryQuery.group_id
      );
      filter.countryCategories = {
        $in: [String(countryGroupQuery.id), parseInt(countryGroupQuery.id)],
      };
    }

    // get module by id
    if (request.input("module_id")) {
      filter.moduleId = String(request.input("module_id"));
    }

    // return filter
    // filter end

    Logger.transport("file").info(`search filter: ${JSON.stringify(filter)}`);

    let result = await Product.find(filter);
    let data = [];
    if (result) {
      let category;
      let module;
      if (query.category_id) {
        const categoryQuery = await Category.findOrFail(query.category_id);
        if (categoryQuery) {
          category = categoryQuery.name;
        }
      }
      if (query.module_id) {
        const moduleQuery = await Module.findOrFail(query.module_id);
        if (moduleQuery) {
          module = moduleQuery.name;
        }
      }

      // filter vendor < 5 or 3 year old
      if (
        !includeVendorsLessThanFiveYears ||
        !includeVendorsLessThanThreeYears
      ) {
        let year = new Date().getFullYear();
        if (!includeVendorsLessThanFiveYears) {
          year -= 5;
        }
        if (!includeVendorsLessThanThreeYears) {
          year -= 3;
        }
        const UniqueVendors = result
          .map((e) => e.vendor)
          .filter((e, i, a) => a.indexOf(e) === i);

        const vendorQuery = Vendor.query();
        vendorQuery.whereIn("name", UniqueVendors);
        vendorQuery.where("founded", "<", year);
        let vendorNames = await vendorQuery.pluck("name");
        vendorNames = vendorNames.map((e) => e.toLowerCase());

        result = result.filter((e) =>
          vendorNames.includes(e.vendor.toLowerCase())
        );
      }

      result.forEach((element) => {
        data.push({
          search_report_id: query.id,
          name: element.name,
          vendor: element.vendor,
          category: category,
          module: module,
          price: element.price,
          rating: element.rating,
          notes: element.notes,
          link: element.link ? element.link : "#",
        });
      });
    }

    await SearchReportProduct.createMany(data);

    if (auth.jwtPayload) {
      return response.status(200).send({
        message: "Create successfully",
        searchReportId: query.id,
        filter,
      });
    } else {
      return response.status(200).send({
        message: "Guest search data created successfully",
      });
    }
  }

  async show({ params, response }) {
    const query = SearchReport.query();
    query.select("search_reports.*");
    query.select("categories.name as category");
    query.select("modules.name as module");
    query.select("visitors.name as visitor");
    query.with("questions", (builder) => {
      builder.select("search_report_questions.*");
      builder.select("questions.name as question");
      builder
        .leftJoin(
          "questions",
          "questions.id",
          "search_report_questions.question_id"
        )
        .with("options", (optionBuilder) => {
          optionBuilder.select("search_report_options.*");
          optionBuilder.select("options.name as option");
          optionBuilder
            .leftJoin(
              "options",
              "options.id",
              "search_report_options.option_id"
            )
            .with("sub_options", (optionBuilder) => {
              optionBuilder.select("search_report_sub_options.*");
              optionBuilder.select("options.name as option");
              optionBuilder.leftJoin(
                "options",
                "options.id",
                "search_report_sub_options.sub_option_id"
              );
            });
        });
    });
    query.with("products");
    query.withCount("questions");
    query.withCount("products");

    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.leftJoin("modules", "modules.id", "search_reports.module_id");
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");
    query.where("search_reports.id", params.id);

    const result = await query.first();
    return response.status(200).send(result);
  }

  async destroy({ response }) {
    await Database.raw("SET FOREIGN_KEY_CHECKS = 0;");
    await SearchReport.truncate();
    await SearchReportOption.truncate();
    await SearchReportSubOption.truncate();
    await SearchReportProduct.truncate();
    await Database.raw("SET FOREIGN_KEY_CHECKS = 1;");

    return response.status(200).send({ message: "Delete successfully" });
  }

  async storeOptions(id, request) {
    if (request.input("questions")) {
      const questions = JSON.parse(request.input("questions"));

      Logger.transport("file").info(
        `search questions: ${JSON.stringify(questions)}`
      );

      if (questions.length) {
        if (questions) {
          questions.forEach(async (element) => {
            const questionData = {
              search_report_id: id,
              question_id: element.id,
            };
            const searchReportQuestionData = await SearchReportQuestion.create(
              questionData
            );
            if (searchReportQuestionData) {
              let value;
              if (element.value == 0) {
                const questionIdsQuery = QuestionOption.query();
                questionIdsQuery.where("question_id", element.id);
                let optionIds = await questionIdsQuery.pluck("option_id");
                optionIds = optionIds.toString().split(",");
                value = optionIds;
              } else {
                value = element.value;
              }

              if (Array.isArray(value)) {
                value.forEach(async (subElement, index) => {
                  const optionValue = subElement.split(":");
                  const option_id = optionValue[0];
                  const subOptions = optionValue[1]
                    ? optionValue[1].split(",")
                    : null;
                  const data = {
                    search_report_question_id: searchReportQuestionData.id,
                    option_id: option_id,
                    priority:
                      element.priority && element.priority.length
                        ? element.priority[index]
                        : null,
                  };
                  const questionTimedata = {
                    question_id: element.id,
                    search_report_questions_id: searchReportQuestionData.id,
                    start_date: element.start_date,
                    end_date: element.end_date,
                    time: moment
                      .duration(
                        moment(element.end_date).diff(
                          moment(element.start_date)
                        )
                      )
                      .asSeconds(),
                  };
                  await SearchReportQuestionsTime.create(questionTimedata);
                  const searchReportOptionData =
                    await SearchReportOption.create(data);
                  if (subOptions) {
                    subOptions.forEach(async (subOption) => {
                      const data = {
                        search_report_option_id: searchReportOptionData.id,
                        sub_option_id: subOption,
                      };
                      await SearchReportSubOption.create(data);
                    });
                  }
                });
              }
            }
          });
        }
      }
    }
  }

  async storeProducts(id, request) {
    // filter start
    let filter = {};
    if (request.input("questions")) {
      const questions = JSON.parse(request.input("questions"));
      if (questions.length) {
        let questionsFilter = [];
        if (questions) {
          questions.forEach((element) => {
            let value = Number(element.value);
            if (Array.isArray(element.value)) {
              value = { $in: element.value };
            }

            let findElement = {};
            findElement["id"] = Number(element.id);
            findElement["value"] = value;
            if (element.subValue && element.subValue.length) {
              findElement["subValue"] = { $in: element.subValue };
            }

            questionsFilter.push({
              $elemMatch: findElement,
            });
          });
        }
        filter.questions = { $all: questionsFilter };
      }
    }

    // get parent from industry then filter
    if (request.input("industry_id")) {
      let industry_id;

      const industryQuery = await Industry.findOrFail(
        request.input("industry_id")
      );

      if (industryQuery.parent_id) {
        industry_id = industryQuery.parent_id;
      } else {
        industry_id = industryQuery.id;
      }

      const industryVendorQuery = IndustryVendor.query();
      industryVendorQuery.where("industry_id", industry_id);
      var vendorIds = await industryVendorQuery.pluck("vendor_id");
      const vendorQuery = Vendor.query();
      vendorQuery.whereIn("id", vendorIds);
      const vendors = await vendorQuery.pluck("name");
      if (vendors && vendors.length) {
        filter.vendor = { $in: vendors };
      }
    }

    // get country group by country id then filter by country group ids
    if (request.input("country_id")) {
      const countryQuery = await Country.findOrFail(
        request.input("country_id")
      );
      const countryGroupQuery = await CountryGroup.findOrFail(
        countryQuery.group_id
      );
      filter.countryCategories = { $in: [String(countryGroupQuery.id)] };
    }

    // get module by id
    if (request.input("module_id")) {
      filter.moduleId = { $in: [request.input("module_id")] };
    }

    // filter end

    Logger.transport("file").info(`search filter: ${JSON.stringify(filter)}`);

    const result = await Product.find(filter);
    let data = [];
    if (result) {
      let category;
      let module;
      if (query.category_id) {
        const categoryQuery = await Category.findOrFail(query.category_id);
        if (categoryQuery) {
          category = categoryQuery.name;
        }
      }
      if (query.module_id) {
        const moduleQuery = await Module.findOrFail(query.module_id);
        if (moduleQuery) {
          module = moduleQuery.name;
        }
      }

      result.forEach((element) => {
        data.push({
          search_report_id: id,
          name: element.name,
          vendor: element.vendor,
          category: category,
          module: module,
          price: element.price,
          rating: element.rating,
          notes: element.notes,
          link: element.link ? element.link : "#",
        });
      });
    }
    await SearchReportProduct.createMany(data);
  }

  async products({ request, response }) {
    const query = SearchReportProduct.query();

    query.select("search_report_products.*");
    query.select("visitors.name as visitor");

    query.leftJoin(
      "search_reports",
      "search_reports.id",
      "search_report_products.search_report_id"
    );
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(
        `DATE(search_reports.created_at) >= '${request.input("start_date")}'`
      );
      query.whereRaw(
        `DATE(search_reports.created_at) <= '${request.input("end_date")}'`
      );
    }

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }
    if (search) {
      query.where(
        searchQuery.search([
          "category",
          "module",
          "search_report_products.name",
          "vendor",
          "visitors.name",
        ])
      );
    }

    if (request.input("groupBy")) {
      query.groupByRaw(request.input("groupBy"));
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }
    let result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }
    return response.status(200).send(result);
  }

  async options({ request, response }) {
    const query = SearchReportOption.query();
    query.select("search_report_options.*");
    query.select("questions.name as question");
    query.select("options.name as option");
    query.select("visitors.name as visitor");
    query.select("search_reports.created_at as created_at");
    query.select("search_report_questions_times.time");
    query.leftJoin(
      "search_report_questions",
      "search_report_questions.id",
      "search_report_options.search_report_question_id"
    );
    query.leftJoin(
      "search_report_questions_times",
      "search_report_questions.id",
      "search_report_questions_times.search_report_questions_id"
    );
    query.leftJoin(
      "search_reports",
      "search_reports.id",
      "search_report_questions.search_report_id"
    );
    query.leftJoin(
      "questions",
      "questions.id",
      "search_report_questions.question_id"
    );
    query.leftJoin("options", "options.id", "search_report_options.option_id");
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(
        `DATE(search_reports.created_at) >= '${request.input("start_date")}'`
      );
      query.whereRaw(
        `DATE(search_reports.created_at) <= '${request.input("end_date")}'`
      );
    }

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFieldOptions));
    }

    if (request.input("groupBy")) {
      query.groupByRaw(request.input("groupBy"));
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }
    let result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }
    return response.status(200).send(result);
  }

  async dummyReport({ request, response }) {
    let counter;

    if (request.input("counter")) {
      counter = request.input("counter");
    } else {
      counter = 10;
    }

    for (let index = 0; index < counter; index++) {
      const query = new SearchReport();
      let industry_id,
        country_id,
        category_id,
        module_id,
        visitor_id,
        is_advanced,
        created_at,
        updated_at,
        org_size;
      if (request.input("industry_id")) {
        industry_id = request.input("industry_id");
      } else {
        const industryQuery = await Industry.query().pluck("id");
        industry_id =
          industryQuery[Math.floor(Math.random() * industryQuery.length)];
      }
      if (request.input("country_id")) {
        country_id = request.input("country_id");
      } else {
        const countryQuery = await Country.query().pluck("id");
        country_id =
          countryQuery[Math.floor(Math.random() * countryQuery.length)];
      }
      if (request.input("category_id")) {
        category_id = request.input("category_id");
      } else {
        //const categoryQuery = await Category.query().pluck('id')
        //category_id = categoryQuery[Math.floor((Math.random() * categoryQuery.length))]

        category_id = 3;
      }

      if (request.input("module_id")) {
        module_id = request.input("module_id");
      } else {
        //const moduleQuery = await Module.query().where('category_id', category_id).pluck('id')
        //module_id = moduleQuery[Math.floor((Math.random() * moduleQuery.length))]

        module_id = 9;
      }
      if (request.input("visitor_id")) {
        visitor_id = request.input("visitor_id");
      } else {
        const visitorQuery = await Visitor.query().pluck("id");
        visitor_id =
          visitorQuery[Math.floor(Math.random() * visitorQuery.length)];
      }
      if (request.input("is_advanced")) {
        is_advanced = request.input("is_advanced");
      } else {
        is_advanced = false;
      }
      if (request.input("created_at")) {
        created_at = request.input("created_at");
      } else {
        created_at = "2019-06-20";
      }
      if (request.input("updated_at")) {
        updated_at = request.input("updated_at");
      } else {
        updated_at = "2019-06-20";
      }

      if (request.input("org_size")) {
        org_size = request.input("org_size");
      } else {
        let randomindex = Math.floor(Math.random() * 4);
        if (randomindex == 1) org_size = "0 - 10";
        else if (randomindex == 2) org_size = "10 - 100";
        else if (randomindex == 3) org_size = "100 - 1000";
        else org_size = "1000+";
      }

      // test module id
      //module_id = 9

      query.category_id = category_id;
      query.module_id = module_id;
      query.visitor_id = visitor_id;
      query.is_advanced = is_advanced;
      query.industry_id = industry_id;
      query.country_id = country_id;
      query.created_at = created_at;
      query.updated_at = updated_at;
      query.org_size = org_size;

      await query.save();

      const search_report_id = query.id;

      Logger.transport("file").info(`search category_id: ${category_id}`);
      Logger.transport("file").info(`search module_id: ${module_id}`);
      Logger.transport("file").info(`search visitor: ${visitor_id}`);
      Logger.transport("file").info(`search is_advanced: ${is_advanced}`);

      // get questions from flow module
      const flowQuery = await Flow.findBy("module_id", module_id);
      const flowQuestionQuery = FlowQuestion.query();
      flowQuestionQuery.with("questions.options");
      const flowQuestions = await flowQuestionQuery
        .where("flow_id", flowQuery.id)
        .fetch();
      const flowQuestionArray = await flowQuestions.toJSON();
      let flowQuestionData = [];
      if (flowQuestionArray) {
        flowQuestionArray.forEach((flowQuestion) => {
          const flowQuestionOptions = flowQuestion.questions.options;
          const optionData =
            flowQuestionOptions[
              Math.floor(Math.random() * flowQuestionOptions.length)
            ];

          flowQuestionData.push({
            id: flowQuestion.question_id,
            value: optionData.id,
            subValue: [],
          });
        });
      }

      let filter = {};
      if (flowQuestionData) {
        if (flowQuestionData.length) {
          let questionsFilter = [];
          let start_date = new Date();
          flowQuestionData.forEach(async (element) => {
            let value = Number(element.value);
            if (Array.isArray(element.value)) {
              value = { $in: element.value };
            }

            let findElement = {};
            findElement["id"] = Number(element.id);
            findElement["value"] = value;
            if (element.subValue && element.subValue.length) {
              findElement["subValue"] = { $in: element.subValue };
            }

            questionsFilter.push({
              $elemMatch: findElement,
            });

            const questionData = {
              search_report_id: search_report_id,
              question_id: element.id,
            };

            const searchReportQuestionData = await SearchReportQuestion.create(
              questionData
            );

            const data = {
              search_report_question_id: searchReportQuestionData.id,
              option_id: element.value,
            };
            const question_time = {
              search_report_questions_id: searchReportQuestionData.id,
              question_id: element.id,
              start_date: start_date.toISOString(),
              time: Math.floor(Math.random() * (30 - 0 + 1)) + 0,
              end_date: "",
            };
            start_date.setSeconds(start_date.getSeconds() + question_time.time);
            question_time.end_date = start_date.toISOString();
            await SearchReportQuestionsTime.create(question_time);
            await SearchReportOption.create(data);
          });

          filter.questions = { $all: questionsFilter };
        }
      }

      // get parent from industry then filter
      if (industry_id) {
        let industryId;

        const industryQuery = await Industry.findOrFail(industry_id);

        if (industryQuery.parent_id) {
          industryId = industryQuery.parent_id;
        } else {
          industryId = industryQuery.id;
        }

        const industryVendorQuery = IndustryVendor.query();
        industryVendorQuery.where("industry_id", industryId);
        var vendorIds = await industryVendorQuery.pluck("vendor_id");
        const vendorQuery = Vendor.query();
        vendorQuery.whereIn("id", vendorIds);
        const vendors = await vendorQuery.pluck("name");
        if (vendors && vendors.length) {
          filter.vendor = { $in: vendors };
        }
      }

      // get country group by country id then filter by country group ids
      if (country_id) {
        const countryQuery = await Country.findOrFail(country_id);
        const countryGroupQuery = await CountryGroup.findOrFail(
          countryQuery.group_id
        );
        filter.countryCategories = { $in: [String(countryGroupQuery.id)] };
      }

      // get module by id
      if (module_id) {
        filter.moduleId = String(module_id);
      }

      // return filter
      // filter end

      Logger.transport("file").info(`search filter: ${JSON.stringify(filter)}`);

      const result = await Product.find(filter);
      let data = [];
      if (result) {
        let category;
        let module;
        if (result.categoryId) {
          const categoryQuery = await Category.findOrFail(result.categoryId);
          if (categoryQuery) {
            category = categoryQuery.name;
          }
        }
        if (result.moduleId) {
          const moduleQuery = await Module.findOrFail(result.moduleId);
          if (moduleQuery) {
            module = moduleQuery.name;
          }
        }

        result.forEach((element) => {
          data.push({
            search_report_id: query.id,
            name: element.name,
            vendor: element.vendor,
            category: category,
            module: module,
            price: element.price,
            rating: element.rating,
            notes: element.notes,
            link: element.link ? element.link : "#",
          });
        });
      }
      await SearchReportProduct.createMany(data);
    }
    return response.status(200).send({ message: "Create successfully" });
  }
}

module.exports = SearchReportController;
