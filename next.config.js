const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // На сервере исключаем @xenova/transformers (он работает только в браузере)
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@xenova/transformers');
      } else {
        config.externals = [config.externals, '@xenova/transformers'];
      }
    }

    // Настройка для Transformers.js (только для клиента)
    if (!isServer) {
      // Поддержка WASM файлов
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // Обработка WASM файлов
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/wasm/[name][ext]',
        },
      });

      // Обработка бинарных файлов моделей (игнорируем на этапе сборки)
      config.module.rules.push({
        test: /\.(bin|onnx|tflite|safetensors)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/models/[name][ext]',
        },
        // Исключаем из обработки на этапе сборки
        exclude: /node_modules\/@xenova\/transformers/,
      });

      // Исключаем бинарные файлы из node_modules/@xenova/transformers на этапе сборки
      config.module.rules.push({
        test: /\.(bin|onnx|tflite|safetensors)$/,
        include: /node_modules\/@xenova\/transformers/,
        use: 'ignore-loader',
      });

      // Исключаем только нативные Node.js модули
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      };

      // Fallback для Node.js модулей (не нужны в браузере)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };

      // Игнорируем .node файлы (нативные модули)
      config.module.rules.push({
        test: /\.node$/,
        use: 'ignore-loader',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig

