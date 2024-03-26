const axios = use("axios");
const Mail = use("Mail");
const Env = use("Env");
const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");
const _ = require("lodash");
const qs = require("qs");
const { URLS, KEYS } = require("../Helper/constants");

async function getZoomAuthToken() {
  try {
    let userName = await Config.findOrCreate(
      { key: KEYS.ZOOM_GET_AUTH_TOKEN_USERNAME },
      {
        key: KEYS.ZOOM_GET_AUTH_TOKEN_USERNAME,
        value: "amYsOdv4S7a4fUL5LnwKRA",
      }
    );
    let password = await Config.findOrCreate(
      { key: KEYS.ZOOM_GET_AUTH_TOKEN_PASSWORD },
      {
        key: KEYS.ZOOM_GET_AUTH_TOKEN_PASSWORD,
        value: "WCJuqWsBWPzh7Op6ebR4qm34aHEkZMNB",
      }
    );

    let accountId = await Config.findOrCreate(
      { key: KEYS.ZOOM_GET_ACCOUNT_ID },
      { key: KEYS.ZOOM_GET_ACCOUNT_ID, value: "rSLj8OXyQ6aern856QjF9A" }
    );

    const token = `${userName.value}:${password.value}`;
    const encodedToken = Buffer.from(token).toString("base64");
    const headers = {
      Authorization: "Basic " + encodedToken,
      "content-type": "application/x-www-form-urlencoded",
    };

    return await axios.post(
      `${URLS.ZOOM_GET_ACCESS_TOKEN_URL}?grant_type=account_credentials&account_id=${accountId.value}`,
      {},
      { headers }
    );
  } catch (error) {
    console.log(error);
  }
}

async function getZoomMeeting(meetingId) {
  let tokenResponse = await getZoomAuthToken();
  let headers = {
    Authorization: "Bearer " + tokenResponse.data.access_token,
  };
  // const url = "users/me/meetings?type=scheduled&page_size=30&page_number=1";
  const url = `meetings/${meetingId}`;
  return axios.get(`${URLS.ZOOM_BASE_URL}/${url}`, { headers });
}

async function deleteZoomMeeting(meetingId) {
  let tokenResponse = await getZoomAuthToken();
  let headers = {
    Authorization: "Bearer " + tokenResponse.data.access_token,
  };
  // const url = "users/me/meetings?type=scheduled&page_size=30&page_number=1";
  const url = `meetings/${meetingId}?cancel_meeting_reminder=true`;
  return axios.delete(`${URLS.ZOOM_BASE_URL}/${url}`, { headers });
}

async function createZoomMeeting(bodyData = {}) {
  let tokenResponse = await getZoomAuthToken();
  let headers = {
    Authorization: "Bearer " + tokenResponse.data.access_token,
    "User-Agent": "Zoom-api-Jwt-Request",
    "content-type": "application/json",
  };
  const url = "users/me/meetings";
  let body = {
    type: 2,
    password: "1234567",
    settings: {
      host_video: true,
      participant_video: true,
      cn_meeting: false,
      in_meeting: true,
      join_before_host: false,
      mute_upon_entry: false,
      watermark: false,
      use_pmi: false,
      approval_type: 2,
      audio: "both",
      auto_recording: "cloud",
      enforce_login: false,
      registrants_email_notification: false,
      waiting_room: true,
      allow_multiple_devices: false,
    },
    ...bodyData,
  };
  try {
    return axios.post(`${URLS.ZOOM_BASE_URL}/${url}`, body, { headers });
  } catch (error) {
    return error;
  }
}

async function getZoomMeetingReport(meetingId) {
  let tokenResponse = await getZoomAuthToken();
  let headers = {
    Authorization: "Bearer " + tokenResponse.data.access_token,
  };
  // const url = "users/me/meetings?type=scheduled&page_size=30&page_number=1";
  const url = `report/meetings/${meetingId}`;
  return axios.get(`${URLS.ZOOM_BASE_URL}/${url}`, { headers });
}

module.exports = {
  getZoomAuthToken,
  createZoomMeeting,
  getZoomMeeting,
  deleteZoomMeeting,
  getZoomMeetingReport,
};
