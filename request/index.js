import config from '/config.js';

function initWeatherData(location, date) {
  Promise.all(getWeatherNow(), getAirquality()).then(res => {
    console.log(res)
  })
}


function getWeatherNow() {
  return new Promise((resolve) => {
    uni.request({
      url: `https://devapi.qweather.com/v7/weather/now?location=${location.location}&key=${config.qweatherKey}`,
      success: (res) => {
        const now = res.data.now;
        resolve(now)
      },
    });
  })
}

function getAirquality() {
  return new Promise((resolve) => {
    uni.request({
      url: `https://devapi.qweather.com/airquality/v1/daily/${location.latitude}/${location.longitude}`,
      success: (res) => {
        resolve(res)
      },
    });
  })
}