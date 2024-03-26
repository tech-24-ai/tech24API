const Config = use("App/Models/Admin/ConfigModule/Config");

async function getSerialCode(code) {
  let num = await Config.findOrCreate({ key: code }, { key: code, value: 1 });
  let serial = num.toJSON().value;
  await Config.query()
    .where("key", code)
    .update({ value: Number(serial) + 1 });
  return code + String(serial).padStart(6, "0");
}

module.exports = {
  getSerialCode,
};
