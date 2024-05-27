const Env = use("Env");
const jwt = require('jsonwebtoken')

async function checkVisitorLoggedIn(authToken) {
  
  let userId = "";
  try {

    const decodedData = jwt.verify(authToken, Env.get('APP_KEY'))
    if(decodedData) {
      userId = decodedData.uid;
    }			
  } catch (error) {
    
  }

  return userId;
}

module.exports = {
  checkVisitorLoggedIn,
};
