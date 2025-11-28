const path = require('path');
const webpack = require("webpack");
const fs = require("fs");

function gatherPrecacheAssets() {
  const distPath = path.resolve(__dirname, "..", "..", "dist");
  let res = [];
  gather(distPath);
  return res;
  
  function gather(dir)
  {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for(const entry of entries)
    {
      const fullPath = path.join(dir, entry.name);
      if(fullPath.endsWith(".map"))
        continue;
      if(entry.isDirectory())
      {
        gather(fullPath);
      }
      else if(entry.isFile())
      {
        const relativePath = path.relative(distPath, fullPath).replace(/\\/g, "/");
        res.push(`/${relativePath}`);
      }
    }
  }
}
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/sw/service-worker.ts', // adjust path to your actual file
  output: {
    filename: 'service-worker.js',
    path: path.resolve(__dirname, "..", "..", 'dist-sw'),
  },
  resolve: {
    extensions: ['.ts', '.js'], // allow importing .ts without specifying extension
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  target: 'webworker', // ensures output is suitable for a service worker
  mode: process.env.NODE_ENV || 'development',
  plugins: [
    new webpack.DefinePlugin({
      __PRECACHE_ASSETS__: JSON.stringify(gatherPrecacheAssets())
    }),
    isProd ?
      new webpack.NormalModuleReplacementPlugin(
        /environment/,
        require.resolve(__dirname, "../global/environment.prod")
      )
      : null
  ].filter(e => e !== null),
};


