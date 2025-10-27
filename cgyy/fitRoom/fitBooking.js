/**
 * 健身房预约系统
 */
const CryptoJS = require("crypto-js");
const axios = require("axios");

/**
 * AES加密函数
 * @param {string|object} data - 要加密的数据
 * @returns {string} - 加密后的字符串
 */
function encrypt(data) {
  // 如果是对象，先转为JSON字符串
  const jsonData = typeof data === "object" ? JSON.stringify(data) : data;

  const key = CryptoJS.enc.Utf8.parse("0102030405060708");
  const iv = CryptoJS.enc.Utf8.parse("0102030405060708");

  const encryptedData = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(jsonData),
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return encryptedData.ciphertext.toString().toUpperCase();
}

// 预约参数配置
const requestParams = {
  nodeid: "814927453893173248", // 1号健身房ID
  reserveTime: ["16:30-17:30"], // 预约时间段
  reserveDate: "2025-06-14", // 预约日期
  accompanyPerson: [], // 陪同人员
  reservationPerson: "", // 预约人ID
  payprice: "0", // 支付价格，免费时0，付费时500
  // txamt:"500",  // 付费时参数
  // booktype:"1", // 付费时参数
};

/**
 * 发送API请求预约健身房
 */
async function sendRequest() {
  console.log("开始预约健身房...");

  const url =
    "https://cgyy.xju.edu.cn/service/appointment/appointment/phone/bookingLaboratoryRoom";

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

  // 对数据进行加密
  const encryptedData = encrypt(requestParams);
  const requestBody = { item: encryptedData };

  try {
    console.log("发送预约请求...");
    console.log("预约信息:", {
      健身房: "1号健身房",
      日期: requestParams.reserveDate,
      时间段: requestParams.reserveTime.join(", "),
    });

    // 使用axios发送POST请求
    const response = await axios.post(url, requestBody, {
      headers: headers,
      timeout: 10000, // 设置超时时间为10秒
    });

    // axios自动解析JSON响应
    console.log("响应状态:", response.status);

    // 处理预约结果
    if (response.data.success) {
      console.log("\n✅ 预约成功!");
      console.log("预约详情:", response.data.resultData);
    } else {
      console.error("\n❌ 预约失败:", response.data.message);
    }

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

// 执行预约
sendRequest()
  .then(() => console.log("预约流程完成"))
  .catch((err) => console.error("预约过程出错:", err.message));
