# UnityWebGLExample使用说明

## 环境配置
安装npm环境，安装步骤参考： [https://docs.npmjs.com/cli/v8/configuring-npm/install](https://docs.npmjs.com/cli/v8/configuring-npm/install)

## 运行示例代码
```
cd /UnityWebGLExample
npm install
npm start
```
打开浏览器输入：[http://localhost:3000/](http://localhost:3000/)

## 目录结构简介
```
document：SDK使用说明文档
public/data：引擎资源及类库。如果需要修改此文件夹位置，则需要同时修改 AweSDK.js 文件 21-31 行对应资源引用路径
src：该示例源代码
src/libs/TemplateData：UnityWebGL模板资源
awesdk-1.0.0.tgz：黑镜数字人SDK
awesdk-core-1.0.0.tgz：黑镜数字人核心库
awesdk-databridge-1.0.0.tgz： 黑镜数字人数据转接桥
index.html：UnityWebGL启动模板
package.json：项目配置文件
webpack.config.js：webpack配置文件
    webpack配置文件需要添加CopyPlugin组件，用于在生产环境时，将public/data文件夹拷贝到输出路径下data文件夹
```