/**
 * 羽毛球场地预约查询脚本 -- 仅供学习和参考使用
 */

const CryptoJS = require("crypto-js");
const axios = require("axios");

/**
 * AES加密函数
 * @param {string} data - 要加密的数据
 * @returns {string} - 加密后的字符串
 */
function encrypt(data) {
  try {
    const key = CryptoJS.enc.Utf8.parse("0102030405060708");
    const iv = CryptoJS.enc.Utf8.parse("0102030405060708");

    const encryptedData = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(data),
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );
    return encryptedData.ciphertext.toString().toUpperCase();
  } catch (error) {
    console.error("加密失败:", error.message);
    throw new Error(`数据加密失败: ${error.message}`);
  }
}

/**
 * 构建请求头
 * @returns {Object} - 请求头对象
 */
// prettier-ignore
function getHeaders() {
  return {
    "Host": "cgyy.xju.edu.cn",
    "Connection": "keep-alive",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    "token": "",   
    "Origin": "https://cgyy.xju.edu.cn",
    "Referer": "https://cgyy.xju.edu.cn/",
    "Cookie": ""
  };
}

/**
 * 获取场地预约信息
 * @param {string} date - 预约日期，格式 YYYY-MM-DD
 * @returns {Promise<Object>} - 预约信息
 */
async function getBookingInfo(date) {
  const url =
    "https://cgyy.xju.edu.cn/service/appointment/appointment/phone/bookingByTime";
  const BADMINTON_COURT_ID = "814925270195904512"; // 南区羽毛球馆ID

  console.log(`🔍 查询日期: ${date}`);

  // 准备请求数据
  const bookingData = {
    nodeid: BADMINTON_COURT_ID,
    selectdate: date,
  };

  // 加密请求数据
  const encryptedData = encrypt(JSON.stringify(bookingData));
  const body = { item: encryptedData };

  try {
    console.log(`📤 发送请求...`);
    const startTime = Date.now();

    const response = await axios.post(url, body, {
      headers: getHeaders(),
      timeout: 10000, // 设置10秒超时
    });

    const endTime = Date.now();
    console.log(`✅ 请求成功! 耗时: ${endTime - startTime}ms`);

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `🔴 服务器响应错误: ${error.response.status} ${error.response.statusText}`,
      );
      if (error.response.data) {
        console.error(
          `详细信息:`,
          JSON.stringify(error.response.data, null, 2),
        );
      }
    } else if (error.request) {
      console.error(`🔴 请求超时或网络错误`);
    } else {
      console.error(`🔴 请求配置错误:`, error.message);
    }
    throw error;
  }
}

/**
 * 解析预约数据并找出可用场地
 * @param {Object} responseData - 服务器响应数据
 * @returns {Object} - 解析结果
 */
function parseAvailableCourts(responseData) {
  if (!responseData.success || !responseData.resultData) {
    throw new Error(`请求失败: ${responseData.message || "未知错误"}`);
  }

  const { timeList, nodeList, conflictList } = responseData.resultData;

  // 创建冲突集合，提高查找效率
  const conflictSet = new Set(conflictList);

  // 创建表格数据
  const courtTable = Array(nodeList.length)
    .fill()
    .map(() => Array(timeList.length).fill(""));

  // 可用场地列表
  const availableSlots = [];

  // 处理场地和时间数据
  for (let courtIndex = 0; courtIndex < nodeList.length; courtIndex++) {
    const court = nodeList[courtIndex];

    for (let timeIndex = 0; timeIndex < timeList.length; timeIndex++) {
      const timeSlot = timeList[timeIndex];

      // 检查时间是否可用
      if (timeSlot.status === "1") {
        courtTable[courtIndex][timeIndex] = "⛔"; // 不可用时间
        continue;
      }

      // 检查是否已被预约
      const slotKey = `${courtIndex}-${timeIndex}`;
      if (conflictSet.has(slotKey)) {
        courtTable[courtIndex][timeIndex] = "❌"; // 已预约
      } else {
        courtTable[courtIndex][timeIndex] = "✅"; // 可预约

        // 添加到可用列表
        availableSlots.push({
          court: court.sitename,
          courtId: court.nodeid,
          time: timeSlot.time,
          timeIndex,
          courtIndex,
          coordinateStr: slotKey,
        });
      }
    }
  }

  return {
    date:
      responseData.resultData.reserveDate ||
      responseData.resultData.bookingenddate,
    timeList: timeList.map((t) => t.time),
    courts: nodeList, // 返回完整的场地信息而非仅名称
    courtTable,
    available: availableSlots.length,
    slots: availableSlots,
    rawData: responseData,
  };
}

/**
 * 格式化输出场地可用状态表格
 * @param {Object} bookingData - 解析后的预约数据
 */
function displayBookingTable(bookingData) {
  const { date, timeList, courts, courtTable, available, slots } = bookingData;

  console.log(`\n📅 预约日期: ${date}`);
  console.log(`🏸 可用场地数量: ${available}\n`);

  // 创建表头 - 使用更紧凑的布局
  let header = "场地号      "; // 固定宽度表头
  timeList.forEach((time) => {
    header += `${time} `.padEnd(8);
  });
  console.log(header);

  // 创建分隔线
  console.log("-".repeat(header.length));

  // 显示每个场地的可用状态
  courts.forEach((court, courtIndex) => {
    // 简化表格中的场地显示
    let courtName = court.sitename.replace("南区羽毛球馆", "");
    let row = `${courtName}`.padEnd(8);

    courtTable[courtIndex].forEach((status) => {
      row += `${status}       `; // 减少间距使表格更紧凑
    });
    console.log(row);
  });

  // 场地ID列表
  console.log("\n📋 场地ID列表:");
  courts.forEach((court) => {
    let courtName = court.sitename.replace("南区羽毛球馆", "");
    console.log(`${courtName}: ${court.nodeid}`);
  });

  // 可用场地详情
  if (available > 0) {
    console.log("\n✨ 可预约场地:");

    // 按时间段排序
    const sortedSlots = [...slots].sort((a, b) => {
      // 首先按时间排序
      if (a.timeIndex !== b.timeIndex) {
        return a.timeIndex - b.timeIndex;
      }
      // 时间相同则按场地排序
      return a.courtIndex - b.courtIndex;
    });

    sortedSlots.forEach((slot, index) => {
      console.log(
        `${index + 1}. ${slot.court.replace("南区羽毛球馆", "")} [${
          slot.time
        }] 坐标:${slot.coordinateStr} ID:${slot.courtId}`,
      );
    });

    // 添加提示说明
    console.log("\n💡 场地ID可用于预约系统API调用");
  } else {
    console.log("\n😢 当前没有可用场地");
  }
}

/**
 * 获取明天的日期字符串 (YYYY-MM-DD)
 * @returns {string} - 明天的日期字符串
 */
// prettier-ignore
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
}

/**
 * 主函数 - 查询明天的场地情况
 */
async function main() {
  try {
    console.log("🔎 正在查询明天的羽毛球场地情况...");
    console.log(`🕒 查询时间: ${new Date().toLocaleString()}`);

    // 获取明天的日期
    const tomorrow = getTomorrowDate();

    // 获取预约信息
    const bookingData = await getBookingInfo(tomorrow);

    // 解析并显示结果
    const parsedData = parseAvailableCourts(bookingData);
    displayBookingTable(parsedData);
  } catch (error) {
    console.error(`❌ 程序执行错误: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main();
