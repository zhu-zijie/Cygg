/**
 * 健身房预约系统 - 青龙环境适配
 * 说明:九点过后预约，建议九点半
 * 环境变量: FIT_TOKEN, FIT_RESERVE_TIME(预约时间段一小时), FIT_ID(预约人学号)
 */
const CryptoJS = require("crypto-js");
const axios = require("axios");

// 环境变量
const token = process.env.FIT_TOKEN || "";
const reserveTimeList = process.env.FIT_RESERVE_TIME || ["19:30-20:30"];
const id = process.env.FIT_ID || "";

/**
 * 获取明天的日期，格式：YYYY-MM-DD
 */
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    },
  );
  return encryptedData.ciphertext.toString().toUpperCase();
}

// 预约参数配置
const requestParams = {
  nodeid: "814927453893173248", // 固定为1号健身房ID
  reserveTime: reserveTimeList, // 预约时间段
  reserveDate: getTomorrowDate(), // 预约日期
  accompanyPerson: [], // 陪同人员
  reservationPerson: id, // 预约人ID
  payprice: "0", // 支付价格
};

/**
 * 发送API请求预约健身房
 */
async function sendRequest() {
  // 检查Token是否存在
  if (!token) {
    console.error("❌ 错误：缺少FIT_TOKEN环境变量");
    console.error("请在青龙环境中配置环境变量: FIT_TOKEN=你的token值");
    throw new Error("缺少必要的认证Token");
  }

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
    "token": token,
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

    const response = await axios.post(url, requestBody, {
      headers: headers,
      timeout: 10000, // 设置超时时间为10秒
    });

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
      console.error("服务器错误:", error.response.status);
      console.error("错误详情:", error.response.data);
    } else if (error.request) {
      console.error("请求超时或网络错误");
    } else {
      console.error("请求配置错误:", error.message);
    }
    throw error;
  }
}

// 执行预约
sendRequest()
  .then(() => console.log("预约流程完成"))
  .catch((err) => console.error("预约过程出错:", err.message));
