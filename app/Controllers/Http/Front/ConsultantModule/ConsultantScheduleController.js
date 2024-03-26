"use strict";

const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");
const {
  getConsultantTimeZone,
  convertDateTime,
  convertDateTimeOld,
  convertUTCTime,
} = require("../../../../Helper/consultant");
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const ConsultantRateCard = use(
  "App/Models/Admin/ConsultantModule/ConsultantRateCard"
);
const ConsultantScheduleDay = use(
  "App/Models/Admin/ConsultantModule/ConsultantScheduleDay"
);
const ConsultantSchedule = use(
  "App/Models/Admin/ConsultantModule/ConsultantSchedule"
);
const ConsultantDailySlot = use(
  "App/Models/Admin/ConsultantModule/ConsultantDailySlot"
);

class ConsultantScheduleController {
  async index_old({ request, response, view }) {
    const slotInterval = 15;
    const duration = request.input("duration");
    const date = request.input("date");
    const consultantId = request.input("consultant_id");
    const daysId = await ConsultantScheduleDay.query()
      .where("day_of_week", moment(date).format("ddd"))
      .pluck("id");
    const scheduleQuery = ConsultantSchedule.query();
    scheduleQuery
      .where("consultant_id", consultantId)
      .with("scheduleTime", (builder) => {
        builder.whereRaw("schedule_days_id=?", [daysId.length ? daysId : 0]);
      });
    let result = (await scheduleQuery.firstOrFail()).toJSON();
    const timeZone = await getConsultantTimeZone(consultantId);
    // console.log("timeZone", timeZone);

    // check dailyslots data
    const daiySlotQuery = ConsultantDailySlot.query()
      .whereRaw("consultant_id=? and date=?", [consultantId, date])
      .select("id", "date", "start_time", "end_time", "is_available");
    const dailySlotsData = (await daiySlotQuery.fetch()).toJSON();
    const isConsultantNotAvailable = dailySlotsData.filter(
      (data) => data.is_available == false
    );

    if (!result.scheduleTime.length || isConsultantNotAvailable.length) {
      return response.json({
        message: `Not available on ${moment(date).format("DD-MM-YYYY")}`,
      });
    }

    // existing booking
    const bookingQuery = BookingHistory.query()
      .whereRaw("consultant_id=? and booking_date=? and booking_status=?", [
        consultantId,
        date,
        "Confirmed",
      ])
      .select("id", "booking_date", "duration", "booking_time");
    const bookedSlots = (await bookingQuery.fetch()).toJSON();
    let bookedTimes = [];

    // function to check slot is already booked or not
    const checkBookedSlot = (slot) => {
      const { start, end } = slot;
      bookedTimes = [];
      let flag = false;
      let bookedEndTime = null;
      bookedSlots.map((data) => {
        let bookingStartTime = new moment(data.booking_time, "HH:mm");
        let bookingEndTime = new moment(data.booking_time, "HH:mm").add(
          data.duration,
          "minutes"
        );
        bookedTimes.push({
          start: bookingStartTime.format("LT"),
          end: bookingEndTime.format("LT"),
        });
        // console.log(
        //   `bookingStart: ${bookingStartTime} and Endtime:${bookingEndTime}`
        // );
        if (
          bookingStartTime.isBetween(start, end, undefined, "[]") ||
          bookingEndTime.isBetween(start, end, undefined, "[]")
        ) {
          flag = true;
          bookedEndTime = bookingEndTime;
        }
      });
      return { flag, bookedEndTime };
    };

    // replace weekly schedule with if daily schedule available
    if (dailySlotsData.length) {
      result.scheduleTime = dailySlotsData;
    }
    let schedules = [];
    result &&
      result.scheduleTime.map((data) => {
        let startTime = moment(data.start_time, "HH:mm");
        let endTime = moment(data.end_time, "HH:mm");

        let timing = {
          timingFrom: new moment(startTime).format("LT"),
          timingTo: new moment(endTime).format("LT"),
          availableSlots: [],
        };

        //Loop over the times - only pushes time with 15 minutes interval if slot already booked
        while (startTime < endTime) {
          const start = new moment(startTime);
          const end = startTime.add(duration, "minutes");
          // console.log("start", start);

          if (end <= endTime) {
            const { flag, bookedEndTime } = checkBookedSlot({ start, end });
            if (flag) {
              startTime = moment(bookedEndTime);
              startTime.add(slotInterval, "minutes");
            } else {
              timing.availableSlots.push({
                start: start.format("LT"),
                end: end.format("LT"),
              });
              // startTime.add(slotInterval, "minutes");
            }
          }
        }
        schedules.push(timing);
      });

    return response.status(200).json([...schedules]);
  }

  async index({ request, response, view }) {
    const slotInterval = 15;
    const duration = request.input("duration");
    const date = request.input("date");
    const consultantId = request.input("consultant_id");
    if (!consultantId) {
      return response.send([]);
    }
    try {
      const daysId = await ConsultantScheduleDay.query()
        .where("day_of_week", moment(date).format("ddd"))
        .pluck("id");
      const scheduleQuery = ConsultantSchedule.query();
      scheduleQuery
        .where("consultant_id", consultantId)
        .with("scheduleTime", (builder) => {
          builder.whereRaw("schedule_days_id=?", [daysId.length ? daysId : 0]);
        });
      const scheduleData = await scheduleQuery.first();
      if (!scheduleData) {
        return response
          .status(404)
          .json({ message: "Consultant Schedule not available !" });
      }
      let result = scheduleData.toJSON();
      const timeZone = await getConsultantTimeZone(consultantId);

      // check dailyslots data
      const daiySlotQuery = ConsultantDailySlot.query()
        .whereRaw("consultant_id=? and date=?", [consultantId, date])
        .select("id", "date", "start_time", "end_time", "is_available");
      const dailySlotsData = (await daiySlotQuery.fetch()).toJSON();
      const isConsultantNotAvailable = dailySlotsData.filter(
        (data) => data.is_available == false
      );
      if (!result.scheduleTime.length || isConsultantNotAvailable.length) {
        return response.json({
          message: `Not available on ${moment(date).format("DD-MM-YYYY")}`,
        });
      }

      // existing booking
      const bookingQuery = BookingHistory.query()
        .whereRaw("consultant_id=? and booking_date=? and booking_status=?", [
          consultantId,
          date,
          "Confirmed",
        ])
        .select(
          "id",
          "booking_date",
          "duration",
          "booking_time",
          "booking_utc_time"
        );
      const bookedSlots = (await bookingQuery.fetch()).toJSON();
      // function to check slot is already booked or not
      const checkBookedSlot = (slot) => {
        const { start, end } = slot;
        let flag = false;
        let bookedEndTime = null;
        bookedSlots.map((data) => {
          const { booking_utc_time, duration } = data;

          let bookingStartTime = moment.parseZone(booking_utc_time);
          let bookingEndTime = moment
            .parseZone(booking_utc_time)
            .add(duration, "minutes");
          if (
            bookingStartTime.isBetween(start, end, undefined, "[]") ||
            bookingEndTime.isBetween(start, end, undefined, "[]")
          ) {
            flag = true;
            bookedEndTime = bookingEndTime;
          }
        });
        return { flag, bookedEndTime };
      };

      // replace weekly schedule with if daily schedule available
      if (dailySlotsData.length) {
        result.scheduleTime = dailySlotsData;
      }
      let schedules = [];

      for (let index = 0; index < result.scheduleTime.length; index++) {
        const { start_time, end_time } = result.scheduleTime[index];
        let startTime = await convertUTCTime(date, start_time, timeZone.offset);
        let endTime = await convertUTCTime(date, end_time, timeZone.offset);
        let currentTime = await convertUTCTime(
          moment().format("YYYY-MM-DD"),
          moment().format("HH:mm:ss"),
          timeZone.offset
        );

        //Loop over the times - only pushes time with 15 minutes interval if slot already booked
        while (startTime < endTime) {
          // check start is before current - assign current time as start if true
          if (moment(startTime).isBefore(currentTime)) {
            startTime = currentTime;
            startTime.add(15, "minutes");
            let isRound = moment(startTime).minute() % 5;
            if (isRound != 0) {
              startTime.subtract(isRound, "minutes");
            }
          }
          const start = new moment(startTime);
          startTime.add(duration, "minutes");
          const end = startTime;
          if (end <= endTime) {
            const { flag, bookedEndTime } = checkBookedSlot({ start, end });

            if (flag) {
              startTime = bookedEndTime;
              startTime.add(slotInterval, "minutes");
            } else {
              schedules.push({
                start: moment(start).clone().format(),
                end: moment(end).clone().format(),
              });
              // startTime.add(slotInterval, "minutes");
            }
          }
        }
      }

      return response.status(200).json(schedules);
    } catch (error) {
      console.log(error);
      return response
        .status(423)
        .json({ message: "something went wrong", error });
    }
  }

  async index_new({ request, response, view }) {
    const slotInterval = 15;
    const duration = request.input("duration");
    const visitorDate = request.input("date");
    const consultantId = request.input("consultant_id");
    const visitorOffset = request.input("offSet");
    let scheduleTimeList = [];
    if (!consultantId) {
      return response.send([]);
    }
    try {
      const filterDays = [
        {
          dayOfWeek: moment(visitorDate).subtract(1, "days").format("ddd"),
          date: moment(visitorDate).subtract(1, "days").format("YYYY-MM-DD"),
        },
        {
          dayOfWeek: moment(visitorDate).format("ddd"),
          date: moment(visitorDate).format("YYYY-MM-DD"),
        },
        {
          dayOfWeek: moment(visitorDate).add(1, "days").format("ddd"),
          date: moment(visitorDate).add(1, "days").format("YYYY-MM-DD"),
        },
      ];
      const daysId = await ConsultantScheduleDay.query()
        .whereIn(
          "day_of_week",
          filterDays.map((day) => day.dayOfWeek)
        )
        .pluck("id");
      const scheduleQuery = ConsultantSchedule.query();
      scheduleQuery
        .where("consultant_id", consultantId)
        .with("scheduleTime", (builder) => {
          builder.with("days", (builder) => {
            builder.select("id", "day_of_week");
          });
          builder.whereIn("schedule_days_id", daysId);
          builder.select(
            "schedule_id",
            "schedule_days_id",
            "start_time",
            "end_time"
          );
        });
      const scheduleData = await scheduleQuery.first();
      if (!scheduleData) {
        return response
          .status(404)
          .json({ message: "Consultant Schedule not available !" });
      }
      let result = scheduleData.toJSON();
      // console.log("DayIds", daysId);
      // console.log("filterDays", filterDays);

      const timeZone = await getConsultantTimeZone(consultantId);

      for (let index = 0; index < result.scheduleTime.length; index++) {
        const timeData = { ...result.scheduleTime[index] };
        let [scheduleDate] = filterDays.filter(
          (day) => day.dayOfWeek == timeData.days.day_of_week
        );
        // console.log("scheduleDate", scheduleDate);
        const daiySlotQuery = ConsultantDailySlot.query()
          .whereRaw("consultant_id=? and date=?", [
            consultantId,
            scheduleDate.date,
          ])
          .select("id", "date", "start_time", "end_time", "is_available");
        const [dailySlotsData] = (await daiySlotQuery.fetch()).toJSON();
        // console.log("dailySlotsData", dailySlotsData);

        if (dailySlotsData == undefined) {
          scheduleTimeList.push({ ...timeData, date: scheduleDate.date });
        }

        // replace weekly schedule with if daily schedule available
        if (dailySlotsData && dailySlotsData.is_available) {
          scheduleTimeList.push({ ...dailySlotsData, date: scheduleDate.date });
        }
      }
      // check dailyslots data

      // if (!result.scheduleTime.length || isConsultantNotAvailable.length) {
      //   return response.json({
      //     message: `Not available on ${moment(date).format("DD-MM-YYYY")}`,
      //   });
      // }

      // function to check slot is already booked or not
      const checkBookedSlot = (slot, bookedSlots) => {
        const { start, end } = slot;
        let flag = false;
        let bookedEndTime = null;

        bookedSlots.map((data) => {
          const { booking_utc_time, duration } = data;

          let bookingStartTime = moment.parseZone(booking_utc_time);
          let bookingEndTime = moment
            .parseZone(booking_utc_time)
            .add(duration, "minutes");
          if (
            bookingStartTime.isBetween(start, end, undefined, "[]") ||
            bookingEndTime.isBetween(start, end, undefined, "[]")
          ) {
            flag = true;
            bookedEndTime = bookingEndTime;
          }
        });
        return { flag, bookedEndTime };
      };

      // replace weekly schedule with if daily schedule available
      // if (dailySlotsData.length) {
      //   result.scheduleTime = dailySlotsData;
      // }
      let schedules = [];
      // return response.send(scheduleTimeList);

      for (let index = 0; index < scheduleTimeList.length; index++) {
        const { start_time, end_time, date } = scheduleTimeList[index];
        let startTime = await convertUTCTime(date, start_time, timeZone.offset);
        let endTime = await convertUTCTime(date, end_time, timeZone.offset);
        let currentTime = await convertUTCTime(
          moment().format("YYYY-MM-DD"),
          moment().format("HH:mm:ss"),
          timeZone.offset
        );
        // let visitorTime = moment
        //   .parseZone(startTime)
        //   .utcOffset("+05:30")
        //   .format("lll");

        // console.log("timeZone.offset", timeZone.offset);
        // console.log("visitorTime", visitorTime);
        // console.log(
        //   `startTime-${moment(date).format("YYYY-MM-DD")}=> `,
        //   startTime
        // );
        // console.log(`endTime-${moment(date).format("YYYY-MM-DD")}=> `, endTime);
        // console.log("currentTime", currentTime);

        // existing booking
        const bookingQuery = BookingHistory.query()
          .whereRaw("consultant_id=? and booking_utc_time like ?", [
            consultantId,
            `${date}%`,
          ])
          .whereIn("booking_status", ["Confirmed", "Scheduled"])
          .select(
            "id",
            "booking_date",
            "duration",
            "booking_time",
            "booking_utc_time"
          );
        const bookedSlots = (await bookingQuery.fetch()).toJSON();
        // console.log("bookedSlots", bookedSlots);

        //Loop over the times - only pushes time with 15 minutes interval if slot already booked
        while (startTime < endTime) {
          const slotDate = moment(startTime)
            .utcOffset(visitorOffset)
            .format("YYYY-MM-DD");
          console.log("SlotDate", slotDate);

          if (slotDate === visitorDate) {
            console.log("StartTimeIf:", startTime);
            // check start is before current - assign current time as start if true
            if (moment(startTime).isBefore(currentTime)) {
              startTime = currentTime;
              startTime.add(15, "minutes");
              let isRound = moment(startTime).minute() % 5;
              if (isRound != 0) {
                startTime.subtract(isRound, "minutes");
              }
            }
            const start = new moment(startTime);
            startTime.add(duration, "minutes");
            const end = startTime;
            if (end <= endTime) {
              const { flag, bookedEndTime } = checkBookedSlot(
                { start, end },
                bookedSlots
              );

              if (flag) {
                startTime = bookedEndTime;
                startTime.add(slotInterval, "minutes");
              } else {
                schedules.push({
                  start2: moment(start)
                    .clone()
                    .utcOffset(visitorOffset)
                    .format(),
                  start: moment(start).clone().format(),
                  end: moment(end).clone().format(),
                });
                // startTime.add(slotInterval, "minutes");
              }
            }
          } else {
            console.log("StartTimeElse:", startTime);
            startTime.add(duration, "minutes");
          }
        }
      }

      return response.status(200).json(schedules);
    } catch (error) {
      console.log(error);
      return response
        .status(423)
        .json({ message: "something went wrong", error });
    }
  }

  async slots({ request, response, view }) {
    const slotInterval = 15;
    const duration = request.input("duration");
    const date = request.input("date");
    const consultantId = request.input("consultant_id");
    const daysId = await ConsultantScheduleDay.query()
      .where("day_of_week", moment(date).format("ddd"))
      .pluck("id");
    const scheduleQuery = ConsultantSchedule.query();
    scheduleQuery
      .where("consultant_id", consultantId)
      .with("scheduleTime", (builder) => {
        builder.whereRaw("schedule_days_id=?", [daysId.length ? daysId : 0]);
      });
    let result = (await scheduleQuery.firstOrFail()).toJSON();
    const timeZone = await getConsultantTimeZone(consultantId);
    // console.log("timeZoneConsultant", timeZone);
    // check dailyslots data
    const daiySlotQuery = ConsultantDailySlot.query()
      .whereRaw("consultant_id=? and date=?", [consultantId, date])
      .select("id", "date", "start_time", "end_time", "is_available");
    const dailySlotsData = (await daiySlotQuery.fetch()).toJSON();
    const isConsultantNotAvailable = dailySlotsData.filter(
      (data) => data.is_available == false
    );

    if (!result.scheduleTime.length || isConsultantNotAvailable.length) {
      return response.json({
        message: `Not available on ${moment(date).format("DD-MM-YYYY")}`,
      });
    }

    // existing booking
    const bookingQuery = BookingHistory.query()
      .whereRaw("consultant_id=? and booking_date=? and booking_status=?", [
        consultantId,
        date,
        "Confirmed",
      ])
      .select("id", "booking_date", "duration", "booking_time");
    const bookedSlots = (await bookingQuery.fetch()).toJSON();
    let bookedTimes = [];

    // function to check slot is already booked or not
    const checkBookedSlot = (slot) => {
      const { start, end } = slot;
      bookedTimes = [];
      let flag = false;
      let bookedEndTime = null;
      bookedSlots.map((data) => {
        // let bookingStartTime = new moment(data.booking_time, "HH:mm");
        // let bookingEndTime = new moment(data.booking_time, "HH:mm").add(
        //   data.duration,
        //   "minutes"
        // );
        let bookingStartTime = new moment.parseZone(
          moment
            .tz(`${date} ${data.booking_time}`, timeZone.zone)
            .format("YYYY-MM-DDTHH:mm:ssZ")
        );
        let bookingEndTime = new moment(bookingStartTime).add(
          data.duration,
          "minutes"
        );
        console.log("bookingStartTime");
        bookedTimes.push({
          start: bookingStartTime.format("LT"),
          end: bookingEndTime.format("LT"),
        });

        if (
          bookingStartTime.isBetween(start, end, undefined, "[]") ||
          bookingEndTime.isBetween(start, end, undefined, "[]")
        ) {
          flag = true;
          bookedEndTime = bookingEndTime;
        }
      });
      return { flag, bookedEndTime };
    };

    // replace weekly schedule with if daily schedule available
    if (dailySlotsData.length) {
      result.scheduleTime = dailySlotsData;
    }
    let schedules = [];
    // console.log("daiySlotQuery", daiySlotQuery.toSQL());
    for (let index = 0; index < result.scheduleTime.length; index++) {
      const data = result.scheduleTime[index];

      // let endTime = moment(data.end_time, "HH:mm").tz(timeZone.zone);
      let startTime = moment.parseZone(
        await convertDateTime(date, data.start_time, timeZone.zone)
      );
      let endTime = moment.parseZone(
        await convertDateTime(date, data.end_time, timeZone.zone)
      );

      let timing = {
        // timingFrom: new moment.tz(startTime, "Asia/Kolkata").format("LT"),
        // timingTo: new moment.tz(endTime, "Asia/Kolkata").format("LT"),
        timingFrom: startTime.local().format("LT"),
        timingTo: endTime.local().format("LT"),
        // timingFrom: startTime.format("LT"),
        // timingTo: endTime.format("LT"),
        availableSlots: [],
      };

      //Loop over the times - only pushes time with 15 minutes interval if slot already booked
      while (startTime < endTime) {
        const start = new moment(startTime);
        startTime = moment(startTime)
          .add(duration, "minutes")
          .tz(timeZone.zone);
        const end = startTime;
        console.log("startTime", start);
        if (end <= endTime) {
          const { flag, bookedEndTime } = checkBookedSlot({ start, end });

          if (flag) {
            startTime = moment(bookedEndTime);
            startTime.add(slotInterval, "minutes");
          } else {
            console.log("start", moment(start).utcOffset("+05:30").format());
            timing.availableSlots.push({
              start: start.local().format("LT"),
              end: end.local().format("LT"),
              // start: start.format("LT"),
              // end: end.format("LT"),
            });
            // startTime.add(slotInterval, "minutes");
          }
        }
      }
      schedules.push(timing);
    }

    return response.status(200).json([...schedules]);
  }
  async slots_new({ params, request, response, view }) {
    let time = request.input("time");
    let offset = request.input("offset");
    let visitorOffset = request
      .input("visitorOffset")
      .replace("UTC", "")
      .trim();
    console.log("visitorOffset", visitorOffset);
    const slotInterval = 15;
    const duration = request.input("duration");
    const date = request.input("date");
    const consultantId = request.input("consultant_id");
    const daysId = await ConsultantScheduleDay.query()
      .where("day_of_week", moment(date).format("ddd"))
      .pluck("id");
    const scheduleQuery = ConsultantSchedule.query();
    scheduleQuery
      .where("consultant_id", consultantId)
      .with("scheduleTime", (builder) => {
        builder.whereRaw("schedule_days_id=?", [daysId.length ? daysId : 0]);
      });
    let result = (await scheduleQuery.firstOrFail()).toJSON();
    const timeZone = await getConsultantTimeZone(consultantId);
    // console.log("timeZoneConsultant", timeZone);
    // check dailyslots data
    const daiySlotQuery = ConsultantDailySlot.query()
      .whereRaw("consultant_id=? and date=?", [consultantId, date])
      .select("id", "date", "start_time", "end_time", "is_available");
    const dailySlotsData = (await daiySlotQuery.fetch()).toJSON();
    const isConsultantNotAvailable = dailySlotsData.filter(
      (data) => data.is_available == false
    );

    if (!result.scheduleTime.length || isConsultantNotAvailable.length) {
      return response.json({
        message: `Not available on ${moment(date).format("DD-MM-YYYY")}`,
      });
    }

    // existing booking
    const bookingQuery = BookingHistory.query()
      .whereRaw("consultant_id=? and booking_date=? and booking_status=?", [
        consultantId,
        date,
        "Confirmed",
      ])
      .select("id", "booking_date", "duration", "booking_time");
    const bookedSlots = (await bookingQuery.fetch()).toJSON();
    let bookedTimes = [];

    // function to check slot is already booked or not
    const checkBookedSlot = async (slot) => {
      const { start, end } = slot;
      bookedTimes = [];
      let flag = false;
      let bookedEndTime = null;
      for (let index = 0; index < bookedSlots.length; index++) {
        const data = bookedSlots[index];

        let bookingStartTime = await convertUTCTime(
          date,
          data.booking_time,
          offset
        );
        let bookingEndTime = new moment(bookingStartTime).add(
          data.duration,
          "minutes"
        );
        bookedTimes.push({
          start: bookingStartTime.format("LT"),
          end: bookingEndTime.format("LT"),
        });

        if (
          bookingStartTime.isBetween(start, end, undefined, "[]") ||
          bookingEndTime.isBetween(start, end, undefined, "[]")
        ) {
          flag = true;
          bookedEndTime = bookingEndTime;
        }
      }
      return { flag, bookedEndTime };
    };

    // replace weekly schedule with if daily schedule available
    if (dailySlotsData.length) {
      result.scheduleTime = dailySlotsData;
    }
    let schedules = [];

    for (let index = 0; index < result.scheduleTime.length; index++) {
      const data = result.scheduleTime[index];
      let startTime = await convertUTCTime(date, data.start_time, offset);
      let endTime = await convertUTCTime(date, data.end_time, offset);
      let timing = {
        timingFrom: moment(startTime)
          .utcOffset(`${visitorOffset}`)
          .format("LT"),
        timingTo: moment(endTime).utcOffset(`${visitorOffset}`).format("LT"),
        availableSlots: [],
      };

      //Loop over the times - only pushes time with 15 minutes interval if slot already booked
      while (startTime < endTime) {
        const start = new moment(startTime);
        startTime = moment(startTime).add(duration, "minutes");
        const end = startTime;
        if (end <= endTime) {
          const { flag, bookedEndTime } = await checkBookedSlot({ start, end });

          if (flag) {
            startTime = moment(bookedEndTime);
            startTime.add(slotInterval, "minutes");
          } else {
            timing.availableSlots.push({
              start: moment(start).utcOffset(`${visitorOffset}`).format("LT"),
              end: moment(end).utcOffset(`${visitorOffset}`).format("LT"),
            });
            // startTime.add(slotInterval, "minutes");
          }
        }
      }
      schedules.push(timing);
    }

    return response
      .status(200)
      .json([result, ...schedules, bookedSlots, timeZone]);
  }

  async create({ request, response, view }) {}

  async store({ request, response }) {}

  async show({ params, request, response, view }) {}
  async update({ params, request, response }) {}

  async destroy({ params, request, response }) {}
  async duration({ params, request, response }) {
    const skillResult = (
      await ConsultantRateCard.query()
        .whereRaw("consultant_id=? and skill_id=?", [
          request.input("consultant_id"),
          request.input("skill_id"),
        ])
        .select("id", "min_minute", "max_minute")
        .fetch()
    ).toJSON();
    const durationList = [];
    if (skillResult && skillResult.length) {
      let { min_minute, max_minute } = skillResult[0];
      while (min_minute <= max_minute) {
        durationList.push(min_minute);
        min_minute += 15;
      }
    }

    return response.status(200).send(durationList);
  }
}

module.exports = ConsultantScheduleController;
