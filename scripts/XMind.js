/*
Quantumult X 脚本:
Xmind Unlock annual subscriptions 
Xmind Download Link : http://t.cn/A6zhp3Bm
[rewrite_local]
# Xmind Unlock annual subscriptions
https?:\/\/.*\.xmind\..*\/_res\/devices url script-response-body XMind.js
[mitm]
hostname = *.xmind.*,
*/

let obj = JSON.parse($response.body);

obj = {
  "raw_data": "S0MY6Wu5wpkW52RE5XmMkSMfTBvnytTwIJODrtVDjnA0axrORbnv9gh1RC4W3/ejTfQhNBb7CVxxpbYnBBk2tHc4gAODhsuGpHkltYNL/P5dfORSpdbiNkAZr5aBBbHS/dNlaYjLYyBkq9Ohfe0QS9PeXOWLbDdNA6kqidLJysw=",
  "license": {
    "status": "sub",
    "expireTime": 9999999999999
  },
  "_code": 200
}
  
$done({body: JSON.stringify(obj)});

// Updated 20200715
