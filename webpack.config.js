const path = require('path'); // Modul Node.js untuk bekerja dengan path file
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Plugin untuk membuat file HTML

module.exports = {
  // 1. Entry Point: File utama JavaScript aplikasi Anda
  entry: './src/js/index.js',

  // 2. Output: Di mana file hasil bundle akan disimpan
  output: {
    filename: 'bundle.js', // Nama file bundle output
    path: path.resolve(__dirname, 'dist'), // Folder output (dist) - path.resolve memastikan path absolut
    clean: true, // Bersihkan folder 'dist' sebelum setiap build
  },

  // 3. Mode: 'development' atau 'production'
  // 'development': Fokus pada kecepatan build dan debugging (source maps, dll.)
  // 'production': Fokus pada ukuran bundle kecil dan performa (minification, dll.)
  // Ini akan diatur oleh skrip npm ('start' -> development, 'build' -> production)
  // mode: 'development', // Bisa juga di-set di sini sebagai default

  // 4. Development Server: Konfigurasi untuk webpack-dev-server
  devServer: {
    static: {
        directory: path.join(__dirname, 'dist'), // Sajikan file dari folder 'dist'
    },
    compress: true, // Aktifkan kompresi gzip untuk file yang disajikan
    port: 9000, // Port yang akan digunakan (default 8080)
    open: true, // Buka browser secara otomatis saat server dimulai
    // (Opsional) Proxy: Berguna jika API Anda di domain berbeda & ada masalah CORS saat development
    // proxy: {
    //   '/v1': { // Cocokkan path API (misal, /v1/...)
    //      target: 'https://story-api.dicoding.dev', // Target server API
    //      changeOrigin: true, // Ubah header 'Host' ke target URL
    //      secure: false, // Jika API target menggunakan HTTPS dengan sertifikat self-signed
    //      // Path Rewrite (jika perlu menghapus '/v1' saat proxying):
    //      // pathRewrite: { '^/v1': '' },
    //   }
    // }
  },

  // 5. Loaders: Cara Webpack memproses tipe file selain JavaScript
  module: {
    rules: [
      {
        // Aturan untuk file CSS
        test: /\.css$/i, // Regex untuk mencocokkan file yang berakhiran .css (case-insensitive)
        // Loader yang digunakan (dijalankan dari kanan ke kiri: css-loader -> style-loader)
        use: [
            'style-loader', // 2. Inject style CSS ke dalam tag <style> di DOM
            'css-loader'    // 1. Memproses @import dan url() dalam CSS
        ],
      },
      {
        // Aturan untuk file gambar (menggunakan Asset Modules bawaan Webpack 5+)
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // Regex untuk mencocokkan ekstensi gambar
        type: 'asset/resource', // Menyalin file aset ke folder output dan mengekspor URL-nya
      },
      // Anda bisa menambahkan loader lain di sini (misal, babel-loader untuk ES6+ transpile)
    ],
  },

  // 6. Plugins: Menambahkan fungsionalitas ekstra ke proses build
  plugins: [
    new HtmlWebpackPlugin({
      // Menggunakan file index.html di root sebagai template
      template: './index.html',
      // Nama file HTML yang akan dihasilkan di folder 'dist'
      filename: 'index.html',
      // (Opsional) Inject bundle.js ke dalam <body> tag
      inject: 'body',
    }),
    // Anda bisa menambahkan plugin lain di sini
  ],

   // (Opsional) Source Maps: Memudahkan debugging di browser
   // Pilihan: 'inline-source-map', 'source-map', 'eval-source-map', dll.
   // 'inline-source-map' bagus untuk development, tapi membuat bundle besar.
   // Jangan gunakan inline di production.
   devtool: 'source-map', // Pilihan bagus untuk development dan production (terpisah)
   // Jika Anda ingin berbeda untuk development:
   // devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

};