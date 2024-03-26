const SearchReport = use("App/Models/Report/SearchReport");
const Module = use("App/Models/Admin/ProductModule/Module");
const Database = use("Database");
const { millify } = require("millify");
const Visitors = use("App/Models/Admin/VisitorModule/Visitor");
const { getYearQuarter } = require("../../../../Helper/stats");
const { getUserSubscribtions } = require("../../../../Helper/userSubscription");
const moment = require("moment");
const _ = require("lodash");
class BuyersController {

  async index({ request, response, auth }) {
    const user = await auth.authenticator("investorAuth").getUser();
    // Get Category ids
    const { allowedModules } = await getUserSubscribtions(user.id, 2);

    const query = SearchReport.query();
    let startDate = request.input("startDate");
    let endDate = request.input("endDate");
    let countries = request.input("countries");
    let org_size = request.input("org_size");
    let industires = request.input("industires");
    let region = request.input("region");
    if (startDate) {
      startDate = moment(startDate).toISOString();
    } else {
      startDate = moment().startOf("year").toISOString();
    }

    if (endDate) {
      endDate = moment(endDate).toISOString();
    } else {
      endDate = moment().endOf("year").toISOString();
    }

    const visitorsQuery = Visitors.query();

    if (countries) {
      visitorsQuery.whereIn("country_id", JSON.parse(countries));


      const visitorids = await visitorsQuery.pluck('id');

      if(visitorids){
        query.whereIn("search_reports.visitor_id", visitorids);

      }
    }

    if (countries)
      query.whereIn("search_reports.country_id", JSON.parse(countries));

    if (org_size)
      query.whereIn("search_reports.org_size", JSON.parse(org_size));

    if (industires)
      query.whereIn("search_reports.industry_id", JSON.parse(industires));

    if (region) query.whereIn("countries.group_id", JSON.parse(region));
    query.where("search_reports.created_at", ">", startDate);
    query.where("search_reports.created_at", "<", endDate);
    //Filter based on subscrition
    query.whereIn("search_reports.module_id", allowedModules);
    query.select("search_reports.category_id as category_id");
    query.select("categories.name as category");
    query.leftJoin("countries", "countries.id", "search_reports.country_id");
    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.groupBy("search_reports.category_id");
    query.count("search_reports.category_id as count");
    query.having("count", ">", 10)
    let result = await query.fetch();
    result = result.toJSON();
    result = result.map((x) => ({
      ...x,
      count: millify(x.count),
    }));

    query.groupByRaw("YEAR(search_reports.created_at)");
    query.select("search_reports.created_at as created");
    const result2 = await this.getYeaylCategoryData(
      countries,
      org_size,
      industires,
      region,
      allowedModules
    );
    return response.status(200).send({ data: result, line: result2 });
  }

  async modules({ request, response, auth }) {
    const user = await auth.authenticator("investorAuth").getUser();
    const { allowedModules } = await getUserSubscribtions(user.id, 2);

    let startDate = request.input("startDate");
    let endDate = request.input("endDate");
    let countries = request.input("countries");
    let org_size = request.input("org_size");
    let industires = request.input("industires");
    let region = request.input("region");
    let output = {};

    if (startDate) {
      startDate = moment(startDate).toISOString();
    } else {
      startDate = moment().startOf("year").toISOString();
    }
    if (endDate) {
      endDate = moment(endDate).toISOString();
    } else {
      endDate = moment().endOf("year").toISOString();
    }
    let explore_category = request.input("explore_category");
    let explore_module = request.input("explore_module");
    let isChild = false;
    if (explore_module) {
      let childModule = await Module.query()
        .where("parent_id", explore_module)
        .fetch();
      isChild = !childModule.toJSON().length;
    }

    if (explore_module && isChild) {
      const query = SearchReport.query();
      query.select("search_reports.created_at as created");
      query.select("questions.id as question_id");
      query.select("questions.name as question_name");
      query.select("options.id as option_id");
      query.select("options.name as option_name");

      if (countries)
        query.whereIn("search_reports.country_id", JSON.parse(countries));

      if (org_size)
        query.whereIn("search_reports.org_size", JSON.parse(org_size));
      if (industires)
        query.whereIn("search_reports.industry_id", JSON.parse(industires));
      if (region) query.whereIn("countries.group_id", JSON.parse(region));
      query.leftJoin("countries", "countries.id", "search_reports.country_id");
      query.leftJoin(
        "search_report_questions",
        "search_reports.id",
        "search_report_questions.search_report_id"
      );
      query.leftJoin(
        "search_report_options",
        "search_report_options.search_report_question_id",
        "search_report_questions.id"
      );
      query.leftJoin(
        "questions",
        "questions.id",
        "search_report_questions.question_id"
      );
      query.leftJoin(
        "options",
        "options.id",
        "search_report_options.option_id"
      );
      query.count("search_report_options.option_id as count");
      query.groupBy("search_report_options.option_id");
      query.groupByRaw("QUARTER(search_reports.created_at)");
      query.groupByRaw("YEAR(search_reports.created_at)");
      query.orderByRaw("YEAR(search_reports.created_at)");
      query.where("search_reports.module_id", explore_module);
      let lineResult = await query.fetch();
      query.where("search_reports.created_at", ">", startDate);
      query.where("search_reports.created_at", "<", endDate);
      let result = await query.fetch();

      output = {
        data: this.groupChildData(result.toJSON()),
        line: this.groupChildData(lineResult.toJSON(), true),
        products: await this.getProductData(
          explore_module,
          countries,
          org_size,
          industires,
          region,
          startDate,
          endDate
        ),
        isChild,
      };
    } else {
      let data = [];
      let whereCondition = "category_id";
      if (explore_category) {
        whereCondition = `category_id = ${explore_category}`;
      }
      if (explore_module) {
        whereCondition = `parent_id = ${explore_module}`;
      }
      let groupByStr = `group by search_reports.module_id`;
      let whereStr = `where search_reports.created_at between '${startDate}' and '${endDate}'`;
      let commonWhere = "";
      if (countries) {
        let ids = JSON.parse(countries);
        commonWhere += ` and search_reports.country_id in (${ids.reduce(
          (acc, curr) => `${acc},${curr}`
        )})`;
      }

      if (industires) {
        let ids = JSON.parse(industires);
        commonWhere += ` and search_reports.industry_id in (${ids.reduce(
          (acc, curr) => `${acc},${curr}`
        )})`;
      }

      if (region) {
        let ids = JSON.parse(region);
        commonWhere += ` and c.group_id in (${ids.reduce(
          (acc, curr) => `${acc},${curr}`
        )})`;
      }

      if (org_size) {
        let ids = JSON.parse(org_size);
        commonWhere += ` and search_reports.org_size in (${ids.reduce(
          (acc, curr) => `"${acc}","${curr}"`,
          ""
        )})`;
      }
      if (allowedModules) {
        commonWhere += ` and search_reports.module_id in (${allowedModules})`;
      }
      let str = `        
            with recursive cte (id, name, parent_id,category_id,depth) as (
                select     id,
                        name,
                        parent_id,
                        category_id,
                        0 as depth
                from       modules
                where      ${whereCondition}
                union all
                select     p.id,
                        p.name,
                        p.parent_id,
                        p.category_id,
                        cte.depth+1
                from       modules p
                inner join cte
                        on p.parent_id = cte.id
            )
            select cte_as.*,count(search_reports.module_id) as count,
            m.name as parent_name,
            YEAR (search_reports.created_at) as year,
            search_reports.created_at as created
            from search_reports
            join (select DISTINCT(id) as id,name as module_name,parent_id from cte) cte_as on cte_as.id = search_reports.module_id
            left join modules m on cte_as.parent_id = m.id
            left join countries c on search_reports.country_id = c.id
        `;
      let str1 = `        
            with recursive cte (id, name, parent_id,category_id,depth) as (
                select     id,
                        name,
                        parent_id,
                        category_id,
                        0 as depth
                from       modules
                where      ${whereCondition}
                union all
                select     p.id,
                        p.name,
                        p.parent_id,
                        p.category_id,
                        cte.depth+1
                from       modules p
                inner join cte
                        on p.parent_id = cte.id
            )
            select cte_as.*,count(search_reports.module_id) as count,
            m.name as parent_name,
            YEAR (search_reports.created_at) as year,
            search_reports.created_at as created
            from search_reports
            join (select DISTINCT(id) as id,name as module_name,parent_id from cte) cte_as on cte_as.id = search_reports.module_id
            left join modules m on cte_as.parent_id = m.id
            left join countries c on search_reports.country_id = c.id
        `;
      let result = await Database.raw(
        `${str} ${whereStr} ${commonWhere} ${groupByStr} order by YEAR(search_reports.created_at)`
      );
      result = JSON.parse(JSON.stringify(result[0]));
      let groupBy = _.groupBy(result, "parent_name");
      if (groupBy["null"]) {
        data.push(...groupBy["null"]);
        delete groupBy["null"];
      }
      let childCount = Object.keys(groupBy);
      if (data.length) {
        let p = childCount.map((x) => {
          return {
            ...groupBy[x][0],
            count: millify(_.sumBy(groupBy[x], "count")),
            module_name: groupBy[x][0].parent_name,
            id: groupBy[x][0].parent_id,
          };
        });
        if (null != p) data.push(...p);
      } else {
        data = result;
      }
      output = {
        data,
        line: await this.getYearlyModulesData(str1, commonWhere, groupByStr),
        isChild,
      };
    }
    return response.status(200).send(output);
  }

  // calculatePercentage(result) {
  //   let a = result.map(x=>{

  //   })
  // }
  groupChildData(data, show_quarter = false) {
    let groupByQuestion = _.groupBy(data, "question_name");

    groupByQuestion = Object.keys(groupByQuestion).map((x) => {
      let name = x;

      if ("null" != x) {

        let sum = _.sumBy(groupByQuestion[x], "count");
        let groupByOptions = _.groupBy(groupByQuestion[x], "option_name");
        groupByOptions = Object.keys(groupByOptions).map((y) => {
          let response = {
            options: y,
            count: _.sumBy(groupByOptions[y], "count"),
            angle: ((_.sumBy(groupByOptions[y], "count") / sum) * 100).toFixed(2),
            label:
              ((_.sumBy(groupByOptions[y], "count") / sum) * 100)
                .toFixed(2)
                .toString() + "%",
            quarterly: _.groupBy(
              _.sortBy(
                groupByOptions[y].map((k) => ({
                  ...k,
                  ...getYearQuarter(k.created),
                  x: getYearQuarter(k.created).quarter,
                  y: millify(k.count),
                })),
                "year"
              ),
              "year"
            ),
            yearly: [],
          };

          Object.keys(response.quarterly).forEach((p) => {
            let total_count = _.sumBy(response.quarterly[p], "count");
            response.yearly.push({
              question_name: response.quarterly[p][0].question_name,
              question_id: response.quarterly[p][0].question_id,
              option_id: response.quarterly[p][0].option_id,
              option_name: response.quarterly[p][0].option_name,
              year: response.quarterly[p][0].year,
              x: response.quarterly[p][0].year,
              count: total_count,
              y: millify(total_count),
            });
          });

          return response;
        });
        return {
          questions: x,
          data: groupByOptions,
        };
      }
    });
    return groupByQuestion;
  }
  async getYeaylCategoryData(countries, org_size, industires, region, allowedModules) {
    const query = SearchReport.query();
    if (countries)
      query.whereIn("search_reports.country_id", JSON.parse(countries));
    if (org_size)
      query.whereIn("search_reports.org_size", JSON.parse(org_size));
    if (industires)
      query.whereIn("search_reports.industry_id", JSON.parse(industires));
    if (region) query.whereIn("countries.group_id", JSON.parse(region));
    query.leftJoin("countries", "countries.id", "search_reports.country_id");
    query.whereIn("search_reports.module_id", allowedModules);
    query.select("search_reports.category_id as id");
    query.select("categories.name as category");
    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.groupBy("search_reports.category_id");
    query.count("search_reports.category_id as count");
    query.groupByRaw("YEAR(search_reports.created_at)");
    query.groupByRaw("QUARTER(search_reports.created_at)");
    query.select("search_reports.created_at as created");
    query.orderByRaw("YEAR(search_reports.created_at)");
    const result = await query.fetch();
    let response = _.groupBy(result.toJSON(), "id");

    response = Object.keys(response).map((x) => ({
      category: response[x][0].category,
      data: this.createYearly(response[x]),
    }));

    return response;
  }

  async getProductData(
    module_id,
    countries,
    org_size,
    industires,
    region,
    startDate,
    endDate
  ) {
    const query = SearchReport.query();
    query.leftJoin(
      "search_report_products",
      "search_report_products.search_report_id",
      "search_reports.id"
    );
    query.count("search_report_products.name as count");
    query.groupBy("search_report_products.name");
    query.orderBy("count", "desc");
    query.select("search_report_products.name as product_name");
    query.whereNot("search_report_products.name", null);
    if (countries)
      query.whereIn("search_reports.country_id", JSON.parse(countries));
    if (org_size)
      query.whereIn("search_reports.org_size", JSON.parse(org_size));
    if (industires)
      query.whereIn("search_reports.industry_id", JSON.parse(industires));
    if (region) query.whereIn("countries.group_id", JSON.parse(region));
    query.leftJoin("countries", "countries.id", "search_reports.country_id");
    query.where("search_reports.created_at", ">", startDate);
    query.where("search_reports.created_at", "<", endDate);
    query.where("search_reports.module_id", module_id);
    query.where("search_report_products.selected", true);
    let data = await query.fetch();
    data = data.toJSON().splice(0, 10);
    data = data.map((x) => ({
      ...x,
      angle: ((x.count / _.sumBy(data, "count")) * 100).toFixed(2),
      label:
        ((x.count / _.sumBy(data, "count")) * 100).toFixed(2).toString() + "%",
    }));
    return data;
  }

  createYearly(data) {
    let response = {
      quaterly: [],
      yearly: [],
    };
    let temp = data.map((y) => ({
      ...y,
      ...getYearQuarter(y.created),
    }));
    temp = _.groupBy(temp, "year");
    let yearly = [];
    temp = Object.keys(temp).reduce((acc, curr) => {
      yearly.push({
        ...temp[curr][0],
        x: temp[curr][0].year,
        y: _.sumBy(temp[curr], "count"),
        quarter: "ALL",
      });
      return {
        ...acc,
        [curr]: temp[curr].map((u) => ({ ...u, y: u.count, x: u.quarter })),
      };
    }, {});
    response.quaterly = temp;
    response.yearly = yearly;
    return response;
  }
  async getYearlyModulesData(str, commonWhere, groupByStr) {
    let result = await Database.raw(
      `${str} ${commonWhere.replace(
        "and",
        "where"
      )} ${groupByStr}, YEAR(search_reports.created_at), QUARTER(search_reports.created_at) order by YEAR(search_reports.created_at)`
    );
    result = JSON.parse(JSON.stringify(result[0]));
    result = result.map((x) => ({ ...x, ...getYearQuarter(x.created) }));
    let groupBy = _.groupBy(result, "parent_name");

    let data = [];
    if (groupBy["null"]) {
      let temp = groupBy["null"];
      temp = _.groupBy(temp, "module_name");
      data = Object.keys(temp).map((x) => {
        let temp1 = _.groupBy(temp[x], "year");
        let yearly = [];
        let qt = Object.keys(temp1).reduce((a, y) => {
          let t = _.groupBy(temp1[y], "quarter");

          t = Object.keys(t).reduce((acc, curr) => {
            return [
              ...acc,
              {
                ...t[curr][0],
                x: t[curr][0].quarter,
                y: _.sumBy(t[curr], "count"),
              },
            ];
          }, []);
          return { ...a, [y]: t };
        }, {});
        return {
          module_name: x,
          data: {
            yearly: Object.keys(temp1).map((p) => {
              let d = {
                ...temp1[p][0],
              };
              d.x = d.year;
              d.y = _.sumBy(temp1[p], "count");
              d.count = d.y;
              delete d.quarter;
              return d;
            }),
            quaterly: qt,
          },
        };
      });
      delete groupBy["null"];
    }
    let parentCount = Object.keys(groupBy);
    let quaterly = {};

    if (data.length) {
      let p = parentCount.map((x) => {
        let temp = _.groupBy(groupBy[x], "year");
        quaterly = Object.keys(temp).reduce((a, y) => {
          let t = _.groupBy(temp[y], "quarter");
          t = Object.keys(t).reduce((acc, curr) => {
            return [
              ...acc,
              {
                ...t[curr][0],
                x: t[curr][0].quarter,
                y: _.sumBy(t[curr], "count"),
              },
            ];
          }, []);
          return { ...a, [y]: t };
        }, {});
        return {
          yearly: Object.keys(temp).map((y) => ({
            x: temp[y][0].year,
            module_name: temp[y][0].parent_name,
            id: temp[y][0].parent_id,
            y: millify(_.sumBy(temp[y], "count")),
          })),
        };
      });

      p = p.map((x) => ({
        module_name: x.yearly[0].module_name,
        data: { yearly: x.yearly, quaterly },
      }));
      data.push(...p);
    } else {
      let temp = _.groupBy(result, "module_name");
      let p = Object.keys(temp).map((x) => {
        let temp1 = _.groupBy(temp[x], "year");
        let qt = Object.keys(temp1).reduce((a, y) => {
          let t = _.groupBy(temp1[y], "quarter");
          t = Object.keys(t).reduce((acc, curr) => {
            return [
              ...acc,
              {
                ...t[curr][0],
                x: t[curr][0].quarter,
                y: _.sumBy(t[curr], "count"),
              },
            ];
          }, []);
          return { ...a, [y]: t };
        }, {});
        return {
          module_name: x,
          data: {
            yearly: Object.keys(temp1).map((p) => {
              let d = {
                ...temp1[p][0],
              };
              d.x = d.year;
              d.y = _.sumBy(temp1[p], "count");
              d.count = d.y;
              delete d.quarter;
              return d;
            }),
            quaterly: qt,
          },
        };
      });
      if (p != null) data.push(...p);
    }
    return data;
  }
}

module.exports = BuyersController;
