"use strict";
const Query = use("Query");
const moment = require("moment");
const Database = use("Database");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const { getProfile } = require("../../../../Helper/consultant");
const ConsultantSchedule = use(
  "App/Models/Admin/ConsultantModule/ConsultantSchedule"
);
const ConsultantScheduleTime = use(
  "App/Models/Admin/ConsultantModule/ConsultantScheduleTime"
);
const ConsultantScheduleDay = use(
  "App/Models/Admin/ConsultantModule/ConsultantScheduleDay"
);

const requestOnly = ["type", "time_zone_id"];
const searchInFields = [];

const consultantFields = [
  "id",
  "first_name",
  "middle_name",
  "last_name",
  "avg_rating",
  "image",
];

class ConsultantScheduleController {
  async index({ request, response, view, auth }) {
    const query = ConsultantSchedule.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const consultantId = request.input("consultant_id");
    const user = await getProfile(auth);

    query.with("timeZone", (builder) => {
      builder.select("id", "name", "sort_name", "zone", "offset");
    });
    query.with("consultant", (builder) => {
      builder.select(consultantFields);
    });

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

    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows[index];
      const scheduleQuery = ConsultantScheduleDay.query();
      scheduleQuery.with("schedules", (builder) => {
        builder.where("schedule_id", element.id);
      });
      scheduleQuery.select("id", "day_of_week");
      const scheduleResult = (await scheduleQuery.fetch()).toJSON();
      element.scheduleDays = scheduleResult;
    }

    return response.status(200).send(result);
  }

  async store({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);
    // const scheduleTime = request.input("schedule_times");
    const scheduleTime = request.body.schedule_times;
    const consultantId = user.consultant_id
      ? user.consultant_id
      : request.input("consultant_id");
    try {
      const isScheduleExist = await ConsultantSchedule.query(trx)
        .where("consultant_id", consultantId)
        .first();
      if (isScheduleExist) {
        return response
          .status(423)
          .json({ message: "Weekly schedule already exist!" });
      } else {
        const query = await ConsultantSchedule.create(
          {
            type: request.input("type"),
            time_zone_id: request.input("time_zone_id"),
            consultant_id: consultantId,
            created_by: user.id,
            updated_by: user.id,
          },
          trx
        );
        for (let index = 0; index < scheduleTime.length; index++) {
          const { id, schedules } = scheduleTime[index];
          for (let index = 0; index < schedules.length; index++) {
            const { start_time, end_time } = schedules[index];
            await ConsultantScheduleTime.create(
              {
                schedule_id: query.id,
                schedule_days_id: id,
                start_time,
                end_time,
                created_by: user.id,
                updated_by: user.id,
              },
              trx
            );
          }
        }
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
    const query = ConsultantSchedule.query();
    query.where("id", params.id);
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    const result = await query.firstOrFail();

    const scheduleQuery = ConsultantScheduleDay.query();
    scheduleQuery.with("schedules", (builder) => {
      builder.where("schedule_id", result.id);
    });

    scheduleQuery.select("id", "day_of_week");
    const scheduleResult = (await scheduleQuery.fetch()).toJSON();
    result.scheduleDays = scheduleResult;

    return response.status(200).send(result);
  }

  async update({ params, request, response, auth }) {
    const trx = await Database.beginTransaction();
    const user = await getProfile(auth);
    const scheduleTime = request.body.schedule_times;

    try {
      const query = await ConsultantSchedule.findOrFail(params.id, trx);
      query.updated_by = user.id;
      query.merge({
        type: request.input("type"),
        time_zone_id: request.input("time_zone_id"),
        consultant_id: user.consultant_id
          ? user.consultant_id
          : request.input("consultant_id"),
      });
      await query.save(trx);

      await ConsultantScheduleTime.query()
        .where("schedule_id", params.id)
        .delete();
      for (let index = 0; index < scheduleTime.length; index++) {
        const { id, schedules } = scheduleTime[index];
        for (let index = 0; index < schedules.length; index++) {
          const { start_time, end_time } = schedules[index];
          await ConsultantScheduleTime.create(
            {
              schedule_id: query.id,
              schedule_days_id: id,
              start_time,
              end_time,
              created_by: user.id,
              updated_by: user.id,
            },
            trx
          );
        }
      }
      await trx.commit();
      return response.status(200).json({ message: "Update successfully" });
    } catch (error) {
      await trx.rollback();
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }

  async destroy({ params, request, response }) {}

  async exportReport({ params, request, response, auth }) {
    const query = ConsultantSchedule.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    query.with("timeZone");
    const user = await getProfile(auth);
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

    for (let index = 0; index < result.length; index++) {
      const element = result[index];
      const scheduleQuery = ConsultantScheduleDay.query();
      scheduleQuery.with("schedules", (builder) => {
        builder.where("schedule_id", element.id);
      });
      scheduleQuery.select("id", "day_of_week");
      const scheduleResult = (await scheduleQuery.fetch()).toJSON();
      element.scheduleDays = scheduleResult;
    }

    let exportData = [];
    let index = 1;

    const fileName = "schedule-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Consultant Schedule");
    let font = { name: "Arial", size: 12 };

    let columns = [
      { header: "Sr No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Consultant",
        key: "consultant_id",
        width: 30,
        style: { font: font },
      },
      {
        header: "Type",
        key: "type",
        width: 30,
        style: { font: font },
      },
      {
        header: "Time Zone",
        key: "timezone",
        width: 30,
        style: { font: font },
      },
    ];

    if (result) {
      result.forEach((element, row) => {
        let scheduleWeek = {};
        element.scheduleDays.map((days, ind) => {
          let day_of_week = days.day_of_week;
          let time = [];
          days.schedules.map((schedule) => {
            let start_time = moment(schedule.start_time, "HH:mm:ss").format(
              "LT"
            );
            let end_time = moment(schedule.end_time, "HH:mm:ss").format("LT");
            time.push(`${start_time} - ${end_time}`);
          });

          scheduleWeek = {
            ...scheduleWeek,
            [day_of_week]: time ? time.join("\r\n") : "",
          };

          if (!row) {
            columns.push({
              header: day_of_week,
              key: day_of_week,
              width: 30,
              style: { font: font, alignment: { wrapText: true } },
            });
          }
        });

        exportData.push({
          ...scheduleWeek,
          sno: index++,
          consultant_id: element.consultant_id,
          type: element.type,
          timezone: element.timeZone.offset,
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

  async updateScheduleTime({ request, response }) {
    try {
      const scheduleTimeList = await ConsultantScheduleTime.query()
        .groupBy("schedule_id")
        .pluck("schedule_id");

      const scheduleList = await ConsultantSchedule.query()
        // .where({ id: 29 })
        .whereNotIn("id", scheduleTimeList)
        .limit(100)
        .pluck("id");
      // return response.send(scheduleList);
      const scheduleDayList = [1, 2, 3, 4, 5];
      for (let index = 0; index < scheduleList.length; index++) {
        const schedule_id = scheduleList[index];

        for (let index = 0; index < scheduleDayList.length; index++) {
          const daysId = scheduleDayList[index];
          const isTimeExist = await ConsultantScheduleTime.query()
            .where({ schedule_id, schedule_days_id: daysId })
            .first();
          if (!isTimeExist) {
            await ConsultantScheduleTime.create({
              schedule_id,
              schedule_days_id: daysId,
              start_time: "00:00:01",
              end_time: "23:00:00",
              created_by: 2,
              updated_by: 2,
            });
          }
          // console.log("isTimeExist", isTimeExist);
        }
      }
      return response.json({ message: "Schedule time updated" });
    } catch (error) {
      console.log("ERR", error);
      return response
        .status(423)
        .json({ message: "Something went wrong", error });
    }
  }
}

module.exports = ConsultantScheduleController;
