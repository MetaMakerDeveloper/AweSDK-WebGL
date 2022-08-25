const path = require('path'); //  nodejs核心模块，专门用来处理路径问题
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: 'web',
  //  输出
  output: {
    //  所有文件的输出路径
    //  __dirname nodejs的变量，代表当前文件的文件夹目录
    path: path.join(__dirname, '/dist'), // 绝对路径
    //  入口文件打包输出文件名
    filename: 'index.bundle.js',
    //  自动清空上次打包内容
    //  原理：在打包前，将path整个目录内容清空，再进行打包
    clean: true,
  },
  devServer: {
    port: 3000,
  },
  //  加载器
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/, //  只检测.css文件
        use: [
          //  执行顺序，从右到左（从下到上）
          'style-loader', //  将js中css通过创建style标签添加html文件中生效
          'css-loader', //  将css资源编译成commonjs的模块到js中
        ]
      },
      // {
      //   test: /\.(png|jpe?g|gif|webp|svg)$/,
      //   type: 'asset',
      //   parser: {
      //     dataUrlCondition: {
      //       //  小于10kb的图片转base64
      //       //  有点：减少请求数量  缺点：体积会更大
      //       maxSize: 10 * 1024,
      //     },
      //   },
      //   generator: {
      //     //  输出图片名称
      //     //  [hash:10] hash值取前10位
      //     filename: 'static/images/[hash:10][ext][query]',
      //   }
      // },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    }),
    new CopyPlugin({
      patterns: [
        { from: "public/data", to: "data" },
      ],
    }),
  ],
  optimization: {
    minimize: true
  }
}
