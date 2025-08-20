const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const target = env.target || 'client';
  
  if (target === 'client') {
    // Client uses Vite, so this is just a placeholder
    return {
      entry: './client/public/index.html',
      mode: isProduction ? 'production' : 'development',
      output: {
        path: path.resolve(__dirname, 'dist/client'),
        filename: '[name].js'
      }
    };
  }
  
  if (target === 'server') {
    return {
      entry: './server/src/app.ts',
      target: 'node',
      mode: isProduction ? 'production' : 'development',
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/
          }
        ]
      },
      resolve: {
        extensions: ['.ts', '.js']
      },
      output: {
        path: path.resolve(__dirname, 'dist/server'),
        filename: 'app.js',
        libraryTarget: 'commonjs2'
      },
      externals: {
        // Don't bundle node_modules for server
        ...require('webpack-node-externals')()
      }
    };
  }
  
  throw new Error(`Unknown target: ${target}`);
};