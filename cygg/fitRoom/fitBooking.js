/**
 * 健身房预约系统 - 青龙环境适配
 * 说明:九点过后预约，建议九点半
 * 环境变量: FIT_TOKEN, FIT_RESERVE_TIME(预约时间段一小时), FIT_ID(预约人学号)
 */
const CryptoJS = require("crypto-js");
const axios = require("axios");

let notify = null;
try {
  notify = require("../../sendNotify.js"); // 上上级目录
} catch (e) {
  try {
    notify = require("../sendNotify.js"); // 上一级目录
  } catch (e) {
    console.log("⚠️ 未找到 sendNotify.js 模块，将不发送通知");
  }
}

// 环境变量
const id = process.env.FIT_ID || "";
const token = process.env.FIT_TOKEN || "";
let envReserveTime = process.env.FIT_RESERVE_TIME || ["19:30-20:30"];
if (typeof envReserveTime === "string") {
  try {
    // 按照 JSON 数组解析
    envReserveTime = JSON.parse(envReserveTime);
  } catch (e) {
    // 否则直接作为单项数组
    envReserveTime = [envReserveTime];
  }
}
const reserveTime = Array.isArray(envReserveTime)
  ? envReserveTime
  : [envReserveTime];

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
  reserveTime: reserveTime, // 预约时间段
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

      // 发送通知
      try {
        const time = requestParams.reserveTime[0];
        const title = "健身房预约成功";
        const content = `日期: ${requestParams.reserveDate}\n时间: ${time}`;

        console.log("📢 正在发送通知...");
        await new Promise((resolve) => setImmediate(resolve));
        if (notify && typeof notify.sendNotify === "function") {
          await notify.sendNotify(title, content);
          console.log("✅ 通知发送成功");
        } else {
          console.log("通知模块未导出 sendNotify 方法，跳过通知");
        }
      } catch (notifyErr) {
        console.warn("⚠️ 通知发送失败:", notifyErr.message);
      }
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
