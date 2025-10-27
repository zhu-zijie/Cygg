/**
 * 健身房时段查询
 */
const axios = require("axios");
const CryptoJS = require("crypto-js");

const queryParams = {
  nodeid: "814927354769186816", // 南区健身房ID
  selecttime: "2025-06-14", // 查询日期
};

/**
 * AES加密函数
 * @param {string|object} data - 要加密的数据
 * @returns {string} - 加密后的字符串
 */
function encrypt(data) {
  // 定义加密所需变量
  const key = CryptoJS.enc.Utf8.parse("0102030405060708"); // 16字节密钥
  const iv = CryptoJS.enc.Utf8.parse("0102030405060708"); // 16字节IV

  // 如果是对象，先转为JSON字符串
  const jsonData = typeof data === "object" ? JSON.stringify(data) : data;

  const dataUtf8 = CryptoJS.enc.Utf8.parse(jsonData);
  const encrypted = CryptoJS.AES.encrypt(dataUtf8, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString().toUpperCase();
}

/**
 * 发送健身房时段查询请求
 */
async function sendRequest() {
  console.log("开始查询健身房时段...");

  const url =
    "https://cgyy.xju.edu.cn/service/appointment/appointment/phone/getAppointmentTimeSlot";

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
    "Cookie": ""
  };

  // 加密请求数据
  const encryptedData = encrypt(queryParams);
  const requestBody = { item: encryptedData };

  try {
    console.log(`发送请求到: ${url}`);
    console.log("请求参数:", queryParams);

    // 使用axios发送请求
    const response = await axios.post(url, requestBody, {
      headers: headers,
      timeout: 10000, // 设置超时时间
    });

    // 输出响应结果
    console.log("响应状态:", response.status);
    console.log("响应数据:", response.data);

    // 返回原始响应
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
  .then(console.log("查询完成"))
  .catch((error) => console.error("查询失败:", error.message));
