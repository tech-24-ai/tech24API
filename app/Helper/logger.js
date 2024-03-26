const ApiLog = use("App/Models/Admin/LoggerModule/ApiLog");

async function logApi(api_type, vendor_id, user_id = null) {
  return await ApiLog.create({ api_type, vendor_id, user_id });
}
module.exports = {
  logApi,
};
