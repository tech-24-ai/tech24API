const moment = require("moment");
const MaskData = require("maskdata");

async function dateFilterExtractor(data) {
  const { name, date } = data;
  if (typeof date == "object") {
    return `DATE(${name}) between '${date.startDate}' and '${date.endDate}'`;
  } else {
    return `DATE(${name}) = '${moment(date).format("YYYY-MM-DD")}'`;
  }
}

async function maskData(data, fields) {
  const config = {
    stringMaskOptions: {
      maskWith: "*",
      maskOnlyFirstOccurance: false,
      // values: [],
      maskAll: true,
      maskSpace: true,
    },
    stringFields: fields.string,

    // Email
    emailMaskOptions: {
      maskWith: "*",
      unmaskedStartCharactersBeforeAt: 0,
      unmaskedEndCharactersAfterAt: 0,
      maskAtTheRate: false,
    },
    emailFields: fields.email,
    // Phone
    phoneMaskOptions: {
      maskWith: "*",
      unmaskedStartDigits: 0,
      unmaskedEndDigits: 0,
    },
    phoneFields: fields.phone,
  };

  let maskedData = [];
  try {
    if (data && data.length) {
      data.map((elem) => {
        if (elem.is_company) {
          maskedData.push(elem);
        } else {
          masked = MaskData.maskJSON2(elem, config);
          maskedData.push(masked);
        }
      });
    }

    return maskedData;
  } catch (error) {
    console.log("ERROR", error);
    return data;
  }
}

module.exports = { dateFilterExtractor, maskData };
