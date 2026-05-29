const tencentcloud = require("tencentcloud-sdk-nodejs");

const TcbClient = tencentcloud.tcb.v20180608.Client;

/**
 * @param {{ username?: string, password?: string }} event
 */
exports.main = async (event) => {
  const username = String(event.username || "").trim();
  const password = String(event.password || "");

  if (!/^[a-zA-Z0-9_]{5,24}$/.test(username)) {
    return { ok: false, message: "用户名须为 5–24 位字母、数字、下划线" };
  }
  if (password.length < 8) {
    return { ok: false, message: "密码至少 8 位" };
  }

  const envId = process.env.TCB_ENV || process.env.SCF_NAMESPACE;
  if (!envId) {
    return { ok: false, message: "云函数环境变量 TCB_ENV 缺失" };
  }

  const client = new TcbClient({
    credential: {
      secretId: process.env.TENCENTCLOUD_SECRETID,
      secretKey: process.env.TENCENTCLOUD_SECRETKEY,
      token: process.env.TENCENTCLOUD_SESSIONTOKEN,
    },
    region: "ap-shanghai",
  });

  try {
    const res = await client.CreateUser({
      EnvId: envId,
      Name: username,
      NickName: username,
      Password: password,
      UserStatus: "ACTIVE",
      Type: "externalUser",
      Description: "网站注册用户（C 端外部用户）",
    });
    return { ok: true, uid: res.Uid || res.UserId, type: "externalUser" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[registerUser]", err);
    if (/exist|已存在|duplicate/i.test(message)) {
      return { ok: false, message: "用户名已被注册" };
    }
    return { ok: false, message: message || "注册失败" };
  }
};
