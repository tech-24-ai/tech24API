"use strict";
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const Consultant_rate_card = use(
  "App/Models/Admin/ConsultantModule/ConsultantRateCard"
);
const Consultant_rate_card_history = use(
  "App/Models/Admin/ConsultantModule/ConsultantRateCardHistory"
);
const Country = use("App/Models/Admin/LocationModule/Country");
const Skill = use("App/Models/Skill");
const Module = use("App/Models/Admin/ProductModule/Module");
const User = use("App/Models/Admin/UserModule/User");
const Role = use("App/Models/Admin/UserModule/Role");
const Database = use("Database");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { getProfile } = require("../../../../Helper/consultant");
const ConsultantTechnology = use(
  "App/Models/Admin/ConsultantModule/ConsultantTechnology"
);
const ConsultantRegion = use(
  "App/Models/Admin/ConsultantModule/ConsultantRegion"
);
const _helperBasicInfoScraper = require("../../../../Helper/basicInfoScraper");

const requestOnly = [
  "first_name",
  "middle_name",
  "last_name",
  "email",
  "mobile",
  "country_id",
  "image",
  "tags",
  "profile_summary",
  "details",
  "linkedin_url",
  "is_company",
  "number_of_employee",
];
const searchInFields = [
  "first_name",
  "middle_name",
  "last_name",
  "email",
  "mobile",
  "tags",
  "profile_summary",
  "details",
  "number_of_employee",
];
class ConsultantController {
  async index({ request, response, view }) {
    const query = Consultant.query();

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

  async store({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    try {
      const query = await Consultant.create(
        {
          ...body,
          created_by: userId,
          updated_by: userId,
          status: "Active",
        },
        trx
      );

      await query
        .regions()
        .attach(JSON.parse(request.input("regions")), null, trx);

      // const moduleQuery = Module.query(trx)
      //   .whereIn("id", JSON.parse(request.input("modules")))
      //   .select("id", "category_id");
      // const module_category_ids = (await moduleQuery.fetch()).toJSON();
      // const consultant_technologiesData = module_category_ids.map((value) => ({
      //   module_id: value.id,
      //   category_id: value.category_id,
      //   consultant_id: query.id,
      // }));
      // await ConsultantTechnology.createMany(consultant_technologiesData, trx);

      const roleQuery = Role.query(trx);
      roleQuery.where("name", "Consultant");
      const role = await roleQuery.firstOrFail();
      const userQuery = new User(trx);

      userQuery.role_id = role.id;
      userQuery.name = query.first_name;
      userQuery.email = query.email;
      userQuery.mobile = query.mobile;
      userQuery.password = "Abcd@1234";
      await userQuery.save();

      query.user_id = userQuery.id;
      await query.save(trx);
      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      await trx.rollback();
      console.log("ERR:", error);
      return response
        .status(423)
        .json({ message: "Somthing went wrong", error });
    }
  }
  async show({ params, request, response, view }) {
    const query = Consultant.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    const regions = await result.regions().ids();
    result.regions = regions;
    // const categories = await result.categories().ids().groupBy("id");
    // result.categories = categories;
    // const modulesIds = await result.modules().ids();
    // result.modules = modulesIds;
    return response.status(200).send(result);
  }

  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const userId = auth.user.id;
    try {
      const query = await Consultant.findOrFail(params.id);
      query.updated_by = userId;
      query.merge(body);

      // await ConsultantTechnology.query()
      //   .where("consultant_id", params.id)
      //   .delete();
      // const moduleQuery = Module.query()
      //   .whereIn("id", JSON.parse(request.input("modules")))
      //   .select("id", "category_id");
      // const module_category_ids = (await moduleQuery.fetch()).toJSON();
      // const consultant_technologiesData = module_category_ids.map((value) => ({
      //   module_id: value.id,
      //   category_id: value.category_id,
      //   consultant_id: query.id,
      // }));
      // await ConsultantTechnology.createMany(consultant_technologiesData);

      await query.regions().detach();
      await query.regions().attach(JSON.parse(request.input("regions")));
      await query.save();
      const userQuery = await User.findOrFail(query.user_id);
      userQuery.name = query.first_name;
      userQuery.email = query.email;
      userQuery.mobile = query.mobile;
      userQuery.password = request.input("password");
      await userQuery.save();
      return response.status(200).json({ message: "Update successfully" });
    } catch (error) {
      console.log(error);
      return response.status(200).json({ message: "Something went wrong" });
    }
  }

  async destroy({ params, request, response }) {
    const query = await Consultant.findOrFail(params.id);
    try {
      const hasBookingHistory = await BookingHistory.findBy(
        "consultant_id",
        params.id
      );

      if (hasBookingHistory) {
        return response
          .status(423)
          .send({ message: "Unable to delete consultant" });
      } else {
        await query.delete();
        return response.status(200).send({ message: "Delete successfully" });
      }
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
  async exportReport({ params, request, response }) {
    const query = Consultant.query();
    query.with("regions", (builder) => {
      builder.select("id", "name");
    });
    query.with("technologies", (builder) => {
      builder.select("id", "consultant_id", "name");
    });
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

    const result = (await query.fetch()).toJSON();
    let exportData = [];
    let index = 1;

    const fileName = "consultants-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Consultant List");
    let font = { name: "Arial", size: 12 };

    if (result) {
      result.forEach((element) => {
        // const categories = element.categories.map((ct) => ct.name);
        // const modules = element.modules.map((ct) => ct.name);
        const technologies = element.technologies.map((ct) => ct.name);
        const regions = element.regions.map((ct) => ct.name);
        exportData.push({
          sno: index++,
          first_name: element.first_name,
          middle_name: element.middle_name,
          last_name: element.last_name,
          mobile: element.mobile,
          email: element.email,
          tags: element.tags,
          profile_summary: element.profile_summary,
          details: element.details,
          linkedin_url: element.linkedin_url,
          image: element.image,
          status: element.status,
          regions: regions ? regions.join(",") : "",
          technologies: technologies ? technologies.join(",") : "",
          is_company: element.is_company ? "Yes" : "No",
          number_of_employee: element.number_of_employee,
          created_at: element.created_at,
          updated_at: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Fist Name",
        key: "first_name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Middle Name",
        key: "middle_name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Last Name",
        key: "last_name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Mobile",
        key: "mobile",
        width: 30,
        style: { font: font },
      },
      {
        header: "Email",
        key: "email",
        width: 30,
        style: { font: font },
      },
      {
        header: "Tags",
        key: "tags",
        width: 60,
        style: { font: font },
      },
      {
        header: "Details",
        key: "details",
        width: 60,
        style: { font: font },
      },
      {
        header: "Profile Summary",
        key: "profile_summary",
        width: 30,
        style: { font: font },
      },
      {
        header: "Linkedin URL",
        key: "linkedin_url",
        width: 60,
        style: { font: font },
      },

      {
        header: "Profile URL",
        key: "image",
        width: 40,
        style: { font: font },
      },
      { header: "Status", key: "status", width: 20, style: { font: font } },
      { header: "Regions", key: "regions", width: 40, style: { font: font } },
      {
        header: "Technologies",
        key: "technologies",
        width: 60,
        style: { font: font },
      },
      {
        header: "is_company",
        key: "is_company",
        width: 30,
        style: { font: font },
      },
      {
        header: "Number of Employee",
        key: "number_of_employee",
        width: 30,
        style: { font: font },
      },
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

    // worksheet.getCell("B1", "C1").fill = {
    //   type: "pattern",
    //   pattern: "solid",
    //   fgColor: { argb: "cccccc" },
    // };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
  async active({ params, request, response }) {
    const trx = await Database.beginTransaction();
    try {
      const query = await Consultant.findOrFail(params.id, trx);
      const roleQuery = Role.query(trx);
      roleQuery.where("name", "Consultant");
      const role = await roleQuery.firstOrFail(trx);
      const userQuery = new User(trx);
      userQuery.role_id = role.id;
      userQuery.name = query.first_name;
      userQuery.email = query.email;
      userQuery.mobile = query.mobile;
      userQuery.password = "Abcd@1234";
      await userQuery.save(trx);

      query.user_id = userQuery.id;
      query.status = "Active";
      await query.save(trx);
      await trx.commit();
      return response
        .status(200)
        .send({ message: "Consultant request approved" });
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "something went wrong", error });
    }
  }

  async activeAll({ params, request, response }) {
    const trx = await Database.beginTransaction();
    try {
      const pendingConsultants = await Consultant.query()
        .where({ status: "Pending", user_id: 0 })
        .limit(100)
        .pluck("id");
      if (pendingConsultants.length) {
        for (let index = 0; index < pendingConsultants.length; index++) {
          const consultantId = pendingConsultants[index];
          const query = await Consultant.findOrFail(consultantId, trx);
          const roleQuery = Role.query(trx);
          roleQuery.where("name", "Consultant");
          const role = await roleQuery.firstOrFail(trx);
          const userQuery = new User(trx);
          userQuery.role_id = role.id;
          userQuery.name = query.first_name;
          userQuery.email = query.email;
          userQuery.mobile = query.mobile;
          userQuery.password = "Abcd@1234";
          await userQuery.save(trx);

          query.user_id = userQuery.id;
          query.status = "Active";
          await query.save(trx);
        }
        await trx.commit();
        return response.status(200).send({
          message: `Total ${pendingConsultants.length} Consultants activated`,
        });
      } else {
        return response
          .status(200)
          .json({ message: "Not found any pending consultant" });
      }
    } catch (error) {
      await trx.rollback();
      console.log("ERR", error);
      return response
        .status(423)
        .json({ message: "something went wrong", error });
    }
  }

  async reject({ params, request, response }) {
    const trx = await Database.beginTransaction();
    try {
      const query = await Consultant.findOrFail(params.id, trx);
      query.status = "Rejected";
      await query.save(trx);
      await trx.commit();
      return response
        .status(200)
        .send({ message: "Consultant request rejected" });
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "something went wrong", error });
    }
  }

  async viewProfile({ request, response, view, auth }) {
    const user = await getProfile(auth);
    if (!user.consultant_id) {
      return response.status(423).json({ message: "Something went wrong" });
    }
    const query = Consultant.query();
    query.where("id", user.consultant_id);
    query.select(requestOnly);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async updateProfile({ request, response, view, auth }) {
    const user = await getProfile(auth);
    if (!user.consultant_id) {
      return response.status(423).json({ message: "Something went wrong" });
    }
    const body = request.only(requestOnly);
    const query = await Consultant.findOrFail(user.consultant_id);
    query.updated_by = user.id;
    query.merge(body);
    await query.save();
    const userQuery = await User.findOrFail(query.user_id);
    userQuery.name = query.first_name;
    userQuery.email = query.email;
    userQuery.mobile = query.mobile;
    userQuery.password = request.input("password");
    await userQuery.save();
    return response.status(200).json({ message: "Update successfully" });
  }

  // consultant data import API

  async import({ request, response }) {
    const validationOptions = {
      types: [
        "xls",
        "xlsx",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };
    let dataArray = [];

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }

      var workbook = new Excel.Workbook();

      workbook = await workbook.xlsx.read(file.stream);

      var worksheet = workbook.getWorksheet(1);
      let rowData;

      worksheet.eachRow(
        { includeEmpty: true },
        async function (row, rowNumber) {
          rowData = JSON.parse(JSON.stringify(row.values));

          if (rowData && rowData.length > 0 && rowNumber !== 1) {
            let first_name;
            let last_name;
            let email;
            let country;
            let linkedinurl;
            let details;
            // rate card column
            let skill;
            let amount_per_hour;
            let min_minute;
            let max_minute;

            let is_company = 0;
            let number_of_employee;

            if (rowData[1]) {
              if (typeof rowData[1] === "string") {
                first_name = rowData[1];
              } else {
                first_name = rowData[1].text;
              }
            }
            if (rowData[2]) {
              if (typeof rowData[2] === "string") {
                last_name = rowData[2];
              } else {
                last_name = rowData[2].text;
              }
            }
            if (rowData[3]) {
              if (typeof rowData[3] === "string") {
                email = rowData[3];
              } else {
                email = rowData[3].text;
              }
            }
            if (rowData[4]) {
              if (typeof rowData[4] === "string") {
                country = rowData[4];
              } else {
                country = rowData[4].text;
              }
            }
            if (rowData[5]) {
              if (typeof rowData[5] === "string") {
                linkedinurl = rowData[5];
              } else {
                linkedinurl = rowData[5].text;
              }
            }
            if (rowData[6]) {
              if (typeof rowData[6] === "string") {
                details = rowData[6];
              } else {
                details = rowData[6].text;
              }
            }
            if (rowData[7]) {
              is_company = rowData[7] === "yes" ? 1 : 0;
            }
            if (rowData[8]) {
              number_of_employee = rowData[8];
            }

            if (rowData[9]) {
              if (typeof rowData[9] === "string") {
                skill = rowData[9];
              } else {
                skill = rowData[9].text;
              }
            }
            if (rowData[10]) {
              amount_per_hour = rowData[10];
            }
            if (rowData[11]) {
              min_minute = rowData[11];
            }
            if (rowData[12]) {
              max_minute = rowData[12];
            }

            let country_id;
            if (country) {
              const country_data = await Country.findBy("name", country);
              if (country_data) {
                country_id = country_data.id;
              }
            }

            let skill_id;
            if (skill) {
              const skill_data = await Skill.findBy("name", skill);
              if (skill_data) {
                skill_id = skill_data.id;
              }
            }

            const bodyData = {
              first_name: first_name,
              last_name: last_name ? last_name : null,
              email: email,
              country_id: country_id,
              details: details,
              linkedin_url: linkedinurl,
              is_company: is_company,
              number_of_employee: is_company ? number_of_employee : null,
            };
            dataArray.push(bodyData);
            const query = await Consultant.create(bodyData);

            if (query) {
              await query.regions().attach([1, 2, 3, 4, 5, 6, 7, 8], null);

              const bodyDataRateCard = {
                consultant_id: query.id,
                skill_id: skill_id,
                amount_per_hour: amount_per_hour,
                min_minute: min_minute,
                max_minute: max_minute,
                created_by: 2,
                updated_by: 2,
              };

              const queryRate = await Consultant_rate_card.create(
                bodyDataRateCard
              );

              if (queryRate) {
                const bodyDataHistory = {
                  rate_card_id: queryRate.id,
                  skill_id: skill_id,
                  amount_per_hour: amount_per_hour,
                  min_minute: min_minute,
                  max_minute: max_minute,
                  created_by: 2,
                };
                await Consultant_rate_card_history.create(bodyDataHistory);
              }
            }
          }
        }
      );
    });

    await request.multipart.process();
    return response.status(200).send({ message: "Import successfully" });
  }

  async updateLogo({ request, response, params }) {
    try {
      let result =
        await _helperBasicInfoScraper.updateConsultantLogoFromLinkedInUrl();

      return response
        .status(200)
        .send({ message: "All consultants List", result: result });
    } catch (error) {
      return response.status(423).send({
        message: `Error fetching Data : ${error}`,
      });
    }
  }
}

module.exports = ConsultantController;
