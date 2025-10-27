/**
 * 健身房预约查询
 */
const CryptoJS = require("crypto-js");
const axios = require("axios");

/**
 * AES加密函数
 * @param {string} data - 要加密的数据
 * @returns {string} - 加密后的字符串
 */
function encrypt(data) {
  const key = CryptoJS.enc.Utf8.parse("0102030405060708");
  const iv = CryptoJS.enc.Utf8.parse("0102030405060708");

  const encryptedData = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(data),
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return encryptedData.ciphertext.toString().toUpperCase();
}

// 查询参数配置
const requestParams = {
  nodeid: "814927354769186816", // 健身房ID
  reserveTime: ["16:30-17:30"], // 预约时间段
  reserveDate: "2025-06-14", // 预约日期
  accompanyPerson: [], // 陪同人员
  reservationPerson: "", // 预约人ID
};

/**
 * 发送API请求获取信息
 */
async function sendRequest() {
  console.log("开始查询...");

  const url =
    "https://cgyy.xju.edu.cn/service/appointment/appointment/phone/getPersonalBookingNode";

  // 构建请求头
  // prettier-ignore
  const headers = {
    "Host": "cgyy.xju.edu.cn",
    "Connection": "keep-alive",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "token": "",
    "Accept": "*/*",
    "Origin": "https://cgyy.xju.edu.cn",
    "Referer": "https://cgyy.xju.edu.cn/",
    "Cookie": "",
  };

  // 对数据进行加密
  const encryptedData = encrypt(JSON.stringify(requestParams));
  const requestBody = { item: encryptedData };

  try {
    console.log("发送请求...");

    // 使用axios发送POST请求
    const response = await axios.post(url, requestBody, {
      headers: headers,
      timeout: 10000, // 设置超时时间为10秒
    });

    // axios自动解析JSON响应
    console.log("响应状态:", response.status);
    console.log("响应数据:", response.data);

    return response.data;
  } catch (error) {
    if (error.response) {
      // 服务器响应了，但状态码超出了2xx范围
      console.error("服务器错误:", error.response.status);
      console.error("错误详情:", error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error("请求超时或网络错误");
    } else {
      // 请求设置出错
      console.error("请求配置错误:", error.message);
    }
    throw error;
  }
}

// 执行查询
sendRequest()
  .then(() => console.log("查询完成"))
  .catch((err) => console.error("查询出错:", err.message));
