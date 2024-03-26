"use strict";
const Query = use("Query");
const moment = require("moment");
const Database = use("Database");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { getProfile } = require("../../../../Helper/consultant");
const ConsultantDailySlot = use(
  "App/Models/Admin/ConsultantModule/ConsultantDailySlot"
);

const requestOnly = ["date", "start_time", "end_time", "is_available"];
const consultantFields = [
  "id",
  "first_name",
  "middle_name",
  "last_name",
  "avg_rating",
  "image",
];

const searchInFields = [];
class ConsultantDailySlotController {
  async index({ request, response, view, auth }) {
    const query = ConsultantDailySlot.query();
    const user = await getProfile(auth);
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
    });
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const consultantId = request.input("consultant_id");
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
                name: "updated_at",
                date: filter.value,
              })
            );
            break;
          case "date":
            query.whereRaw(
              await dateFilterExtractor({
                name: "date",
                date: filter.value,
              })
            );
            break;

          case "consultant.first_name": {
            query
              .join(
                "consultants",
                "consultant_daily_slots.consultant_id",
                "=",
                "consultants.id"
              )
              .where("consultants.first_name", "LIKE", `%${filter.value}%`);
            break;
          }

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

    return response.status(200).send(result);
  }

  async store({ request, response, auth }) {
    const body = request.only(requestOnly);
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);
    const userId = user.id;
    const scheduleTime = request.body.schedule_times;
    const consultantId = user.consultant_id
      ? user.consultant_id
      : request.input("consultant_id");
    try {
      for (let index = 0; index < scheduleTime.length; index++) {
        const { date, schedules } = scheduleTime[index];
        for (let index = 0; index < schedules.length; index++) {
          const { start_time, end_time, is_available } = schedules[index];
          const dailySlotdata = {
            consultant_id: consultantId,
            date,
            start_time,
            end_time,
            created_by: userId,
            updated_by: userId,
            is_available,
          };
          await ConsultantDailySlot.create(dailySlotdata, trx);
        }
      }
      await trx.commit();
      return response.status(200).json({ message: "Create successfully" });
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async show({ params, request, response, view, auth }) {
    const query = ConsultantDailySlot.query();
    const user = await getProfile(auth);
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
    });
    query.where("id", params.id);
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    const result = await query.firstOrFail();

    return response.status(200).send(result);
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
      const query = await ConsultantDailySlot.findOrFail(params.id, trx);
      query.updated_by = userId;
      query.consultant_id = consultantId;
      query.merge(body);
      await query.save(trx);

      await trx.commit();
      return response.status(200).json({ message: "Update successfully" });
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async destroy({ params, request, response }) {
    try {
      const query = await ConsultantDailySlot.findOrFail(params.id);
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async exportReport({ params, request, response, auth }) {
    const query = ConsultantDailySlot.query();
    const user = await getProfile(auth);
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
    });
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const consultantId = request.input("consultant_id");
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

    // if consultant not logged in
    if (consultantId && user.consultant_id == undefined) {
      query.where("consultant_id", consultantId);
    }

    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }

    const result = (await query.fetch()).toJSON();

    let exportData = [];
    let index = 1;

    const fileName =
      "daily-schedule-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Consultant Daily Schedule");
    let font = { name: "Arial", size: 12 };

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Consultant Name",
        key: "name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Date",
        key: "date",
        width: 30,
        style: { font: font },
      },
      {
        header: "Start Time",
        key: "start_time",
        width: 30,
        style: { font: font },
      },
      {
        header: "End Time",
        key: "end_time",
        width: 30,
        style: { font: font },
      },
    ];

    if (result) {
      result.forEach((element, row) => {
        let name = element.consultant.first_name
          ? `${element.consultant.first_name}`
          : "";
        name += element.consultant.middle_name
          ? ` ${element.consultant.middle_name}`
          : "";
        name += element.consultant.last_name
          ? ` ${element.consultant.last_name}`
          : "";
        exportData.push({
          sno: index++,
          name: name,
          date: element.date,
          start_time: moment(element.start_time, "HH:mm").format("LT"),
          end_time: moment(element.end_time, "HH:mm").format("LT"),
          created_at: element.created_at,
          updated_at: element.updated_at,
        });
      });
    }

    // return response.json({ exportData, columns });
    columns.push(
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
      }
    );

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
}

module.exports = ConsultantDailySlotController;
