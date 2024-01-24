//HOOK微信小程序
let version = (process.argv[2] + "").toLowerCase();
let bit = (process.argv[3] + "").toLowerCase();
// let version = "8531"
// let bit = "x64"
var frida = require("frida");
const cmdline = require('cmdline-windows');
const fs = require('fs');
const path = require('path');


let addressSource = "";
let addressSourceHeadFilePath = path.join(__dirname, `/Core/AddressSource.head`);
let addressSourceEndFilePath = path.join(__dirname, `/Core/AddressSource.end`);

let addressFilePath = path.join(__dirname, `/Core/WeChatAppEx.exe/address_${version}_${bit}.json`);
let hookFilePath = path.join(__dirname, `/Core/WeChatAppEx.exe/hook.js`);

function onMessage(message, data) {
    if (message.type === 'send') {
        console.log(message.payload);
    } else if (message.type === 'error') {
        console.error(message.stack);
    }
}

try {
    fs.accessSync(addressFilePath);
    addressSource += fs.readFileSync(addressSourceHeadFilePath);
    addressSource += fs.readFileSync(addressFilePath);
    addressSource += fs.readFileSync(addressSourceEndFilePath);
    addressSource += fs.readFileSync(hookFilePath);
    // console.log(addressSource)
} catch (error) {
    console.log(`暂不支持 ${version}_${bit} 的版本!`)
    return;
}
console.log("HOOK文件组装成功!")

;;(async ()=>{
    var device = await frida.getLocalDevice();
    var processes = await device.enumerateProcesses();
    var pid = -1;
    var pids = []
    processes.forEach(async (p_)=>{
        // console.log(p_.name)
        if(p_.name == "WeChatAppEx.exe"){
            let commandLine = cmdline.getCmdline(p_.pid);
            // console.log(commandLine)
            if(commandLine.indexOf("--type=") == -1){
                pid = p_.pid;
                pids.push(p_.pid)
                console.log(pid)
            }  
        }
    })
    if(pid==-1){
        console.log("WeChatAppEx.exe 主进程未找到!")
        return;
    }
    for (const pid of pids) {
        session = await frida.attach(pid);
        script = await session.createScript(addressSource);
        script.message.connect(onMessage);
        await script.load();
    }


})().catch((error)=>{
    console.error(error.stack);
});
