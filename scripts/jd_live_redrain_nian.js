/*
 * @Author: shylocks https://github.com/shylocks
 * @Date: 2021-01-20 09:00:00 
 * @Last Modified by: TongLin138
 * @Last Modified time: 2021-01-21 09:00:00
 */

const $ = new Env('年货直播红包雨');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
}else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
let ids = {
  '0':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '9':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '11':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '13':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '15':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '17':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '19':'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '20': 'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '21': 'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '22': 'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK',
  '23': 'RRA2v2Lh5mtxYnC4j6VHrjoaDz7crQK'
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  await getRedRain();

  let nowTs = new Date().getTime()
  if (!($.st <= nowTs && nowTs < $.ed)) {
    $.log(`远程红包雨配置获取错误，从本地读取配置`)
    let hour = (new Date().getUTCHours() + 8) %24
    if (ids[hour]){
      $.activityId = ids[hour]
      $.log(`本地红包雨配置获取成功`)
    } else{
      $.log(`无法从本地读取配置，请检查运行时间`)
      return
    }
  } else{
    $.log(`远程红包雨配置获取成功`)
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        } else {
          $.setdata('', `CookieJD${i ? i + 1 : ""}`);//cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue
      }
      let nowTs = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000
      // console.log(nowTs, $.startTime, $.endTime)
      await receiveRedRain();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

function showMsg() {
  return new Promise(resolve => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve()
  })
}

function getRedRain() {
  return new Promise(resolve => {
    $.get({
      url: "http://qn6l5d6wm.hn-bkt.clouddn.com/jd_live_redRain_nian.json?" + Date.now(),
    }, (err, resp, data) => {
      try {
        if (err) {
          console.log(`1111${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            $.activityId = data.activityId
            $.st = data.startTime
            $.ed = data.endTime
            console.log(`下一场红包雨id：${$.activityId}`)
            console.log(`下一场红包雨开始时间：${new Date(data.startTime)}`)
            console.log(`下一场红包雨结束时间：${new Date(data.endTime)}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function receiveRedRain() {
  return new Promise(resolve => {
    const body = {"actId": $.activityId};
    $.get(taskUrl('noahRedRainLottery', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode === '0') {
              console.log(`领取成功，获得${JSON.stringify(data.lotteryResult)}`)
              // message+= `领取成功，获得${JSON.stringify(data.lotteryResult)}\n`
              message += `领取成功，获得 ${(data.lotteryResult.jPeasList[0].quantity)}京豆`

            } else if (data.subCode === '8') {
              console.log(`今日次数已满`)
              message += `领取失败，本场已领过`;
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function taskPostUrl(function_id, body = body) {
  return {
    url: `https://api.m.jd.com/client.action?functionId=${function_id}`,
    body: body,
    headers: {
      'Host': 'api.m.jd.com',
      'content-type': 'application/x-www-form-urlencoded',
      'accept': '*/*',
      'user-agent': 'JD4iPhone/167521 (iPhone; iOS 14.3; Scale/3.00)',
      'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
      //"Cookie": cookie,
    }
  }
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&_=${new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000}`,
    headers: {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-cn",
      "Connection": "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "Host": "api.m.jd.com",
      "Referer": "https://h5.m.jd.com/active/redrain/index.html",
      "Cookie": cookie,
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : "jdapp;iPhone;9.3.6;14.3;bf1f9a94239880f59a8f3b018a3aadf380e216fc;network/wifi;ADID/C1F5A079-892C-4995-8CFD-9CC43BDE88E7;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone10,3;addressid/1065702877;supportBestPay/0;appBuild/167521;jdSupportDarkMode/0;pv/825.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/bf1f9a94239880f59a8f3b018a3aadf380e216fc|950;jdv/0|androidapp|t_335139774|appshare|CopyURL|1611199456785|1611199460;adk/;app_device/IOS;pap/JA2015_311210|9.3.6|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1") : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.3.6;14.3;bf1f9a94239880f59a8f3b018a3aadf380e216fc;network/wifi;ADID/C1F5A079-892C-4995-8CFD-9CC43BDE88E7;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone10,3;addressid/1065702877;supportBestPay/0;appBuild/167521;jdSupportDarkMode/0;pv/825.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/bf1f9a94239880f59a8f3b018a3aadf380e216fc|950;jdv/0|androidapp|t_335139774|appshare|CopyURL|1611199456785|1611199460;adk/;app_device/IOS;pap/JA2015_311210|9.3.6|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : "jdapp;iPhone;9.3.6;14.3;bf1f9a94239880f59a8f3b018a3aadf380e216fc;network/wifi;ADID/C1F5A079-892C-4995-8CFD-9CC43BDE88E7;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone10,3;addressid/1065702877;supportBestPay/0;appBuild/167521;jdSupportDarkMode/0;pv/825.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/bf1f9a94239880f59a8f3b018a3aadf380e216fc|950;jdv/0|androidapp|t_335139774|appshare|CopyURL|1611199456785|1611199460;adk/;app_device/IOS;pap/JA2015_311210|9.3.6|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1") : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.3.6;14.3;bf1f9a94239880f59a8f3b018a3aadf380e216fc;network/wifi;ADID/C1F5A079-892C-4995-8CFD-9CC43BDE88E7;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone10,3;addressid/1065702877;supportBestPay/0;appBuild/167521;jdSupportDarkMode/0;pv/825.2;apprpd/Home_Main;ref/JDMainPageViewController;psq/1;ads/;psn/bf1f9a94239880f59a8f3b018a3aadf380e216fc|950;jdv/0|androidapp|t_335139774|appshare|CopyURL|1611199456785|1611199460;adk/;app_device/IOS;pap/JA2015_311210|9.3.6|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
