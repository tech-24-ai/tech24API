const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const TimeZone = use("App/Models/Admin/LocationModule/TimeZone");
const ConsultantSchedule = use(
  "App/Models/Admin/ConsultantModule/ConsultantSchedule"
);
const moment = require("moment");
const Mail = use("Mail");
const Env = use("Env");
const { KEYS } = require("../Helper/constants");
const Config = use("App/Models/Admin/ConfigModule/Config");

async function getProfile(auth) {
  const user = await auth.getUser();
  const consultant = await Consultant.query()
    .where("user_id", user.id)
    .select("id")
    .first();
  if (consultant) {
    user.consultant_id = consultant.id;
  }
  return user;
}

async function getConsultantTimeZone(consultant_id) {
  let scheduleData = await ConsultantSchedule.query()
    .where("consultant_id", consultant_id)
    // .select("id")
    .with("timeZone")
    .first();
  scheduleData = scheduleData ? scheduleData.toJSON().timeZone : null;
  return scheduleData;
}

async function getVisitorTimeZone(visitor_id) {
  let data = await TimeZone.findOrFail(visitor_id);

  return data ? data.toJSON() : null;
}

async function convertDateTimeOld(date, time, offset = null) {
  try {
    let formatedDate = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm:ss");

    if (offset) {
      let zoneOffset = offset.replace("UTC", "").trim();
      formatedDate = moment(formatedDate).utcOffset(`${zoneOffset}`);
    }
    formatedDate = moment(formatedDate).format("YYYY-MM-DDTHH:mm:ssZ");
    return formatedDate;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function convertUTCTime(date, time, offset = null) {
  // console.log(`${date} ${time} ${offset}`);
  try {
    let formatedDate = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm:ss");

    if (offset) {
      let zoneOffset = offset.replace("UTC", "").trim();
      formatedDate = moment(formatedDate).utcOffset(`${zoneOffset}`, true);
    }
    // formatedDate = formatedDate.format("LT");
    return formatedDate;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function convertDateTime(date, time, zone) {
  // console.log(`${date} ${time} ${zone}`);
  try {
    let formatedDate = moment
      .tz(`${date} ${time}`, zone)
      .format("YYYY-MM-DDTHH:mm:ssZ");
    return formatedDate;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getCancellationPercentage() {
  let cancellationPercentage = await Config.findOrCreate(
    { key: KEYS.BOOKING_CANCELLATION_PERCENTAGE },
    { key: KEYS.BOOKING_CANCELLATION_PERCENTAGE, value: 5 }
  );

  return cancellationPercentage.value;
}

async function getConsultantPercentage() {
  let consultantPercentage = await Config.findOrCreate(
    { key: KEYS.CONSULTANT_COMMISSION_PERCENTAGE },
    { key: KEYS.CONSULTANT_COMMISSION_PERCENTAGE, value: 5 }
  );

  return consultantPercentage.value;
}

async function newConsultantSignupMail({ name, email }) {
  const subject = "New Consultant";
  const details =
    "Thank you for requesting. Your request has been sent to Admin for Approval.";
  await Mail.send(
    "enduserSubscriptionClientMail",
    {
      name: name,
      details: details,
    },
    (message) => {
      message.subject(subject);
      message.from(Env.get("MAIL_USERNAME"));
      message.to(email);
    }
  );
}

async function complaintMail(data) {
  const { subject, message, visitorName, consultantName, code } = data;
  const details = `Below ${data.complainBy} has lodged complaint:`;
  try {
    await Mail.send(
      "enduserComplaintAdminMail",
      {
        details,
        subject,
        message,
        visitorName,
        consultantName,
        code,
      },
      (message) => {
        message.subject("Complaint");
        message.from(Env.get("MAIL_USERNAME"));
        message.to(Env.get("TO_MAIL_USERNAME"));
      }
    );
  } catch (error) {
    console.log("Error", error);
  }
}

async function sendBookingCreationMail(data) {
  const {
    consultant_id,
    amount_per_hour,
    booking_date,
    booking_time,
    booking_utc_time,
    visitor_time_zone_id,
    duration,
    paypal_transaction_id,
    total_amount,
    skill,
    remarks,
    is_credit,
    zoom_meeting_id,
    meeting_link,
    topic,
    visitorName,
    visitorEmail,
    consultantName,
    consultantEmail,
  } = data;
  const details = "The below zoom meeting has been successfully created";
  try {
    const visitorTimeZone = await getVisitorTimeZone(visitor_time_zone_id);
    const visitorUtc = visitorTimeZone.offset.replace("UTC", "").trim();
    await Mail.send(
      "scheduleConsultantMail",
      {
        details,
        meeting_link,
        consultantName,
        visitorName,
        duration,
        topic,
        date: moment.parseZone(booking_utc_time).format("LLL"),
      },
      (message) => {
        message.subject(`Your Meeting - ${topic}`);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(consultantEmail);
      }
    );

    await Mail.send(
      "scheduleVisitorMail",
      {
        details,
        meeting_link,
        consultantName,
        visitorName,
        duration,
        topic,
        date: `${moment
          .parseZone(booking_utc_time)
          .utcOffset(visitorUtc)
          .format("LLL")}, ${visitorTimeZone.name}`,
        total_amount,
        paypal_transaction_id,
      },
      (message) => {
        message.subject(`Your Meeting - ${topic}`);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(visitorEmail);
      }
    );
  } catch (error) {
    console.log("Error", error);
  }
}

async function sendBookingCancellationMail(data) {
  const {
    visitorName,
    visitorMail,
    consultantName,
    consultantMail,
    meetingId,
    date,
    time,
    skill,
    reason,
  } = data;
  const subject = "Meeting Cancelled";
  const details = "Below meeting has been cancelled";

  // send mail to consultant
  await Mail.send(
    "scheduleCancellationConsultantMail",
    {
      title: subject,
      details: details,
      visitorName,
      meetingId,
      date,
      time,
      skill,
      reason,
    },
    (message) => {
      message.subject(subject);
      message.from(Env.get("MAIL_USERNAME"));
      message.to(consultantMail);
    }
  );

  // send mail to Visitor
  await Mail.send(
    "scheduleCancellationVisitorMail",
    {
      title: subject,
      details: details,
      meetingId,
      consultantName,
      date,
      time,
      skill,
      reason,
    },
    (message) => {
      message.subject(subject);
      message.from(Env.get("MAIL_USERNAME"));
      message.to(visitorMail);
    }
  );
}

module.exports = {
  getProfile,
  convertDateTime,
  getCancellationPercentage,
  getConsultantPercentage,
  getConsultantTimeZone,
  getVisitorTimeZone,
  convertDateTimeOld,
  convertUTCTime,
  newConsultantSignupMail,
  sendBookingCancellationMail,
  complaintMail,
  sendBookingCreationMail,
};
