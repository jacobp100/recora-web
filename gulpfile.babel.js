/* eslint-disable flowtype/require-valid-file-annotation */
import { join } from 'path';
import { readFileSync } from 'fs';
import gulp from 'gulp';
import concat from 'gulp-concat';
import cssnano from 'gulp-cssnano';
import htmlmin from 'gulp-htmlmin';
import postcss from 'gulp-postcss';
import cssNext from 'postcss-cssnext';
import mqPacker from 'css-mqpacker';
import webpack from 'webpack';
import esCssModules from 'es-css-modules';
import postIconfonts from 'post-iconfonts';
import gulpFile from 'gulp-file';
import cssClassGenerator from 'css-class-generator';
// import commonConfig from './common.webpack.config';

const cssClass = cssClassGenerator();


gulp.task('icons', () => {
  const font = readFileSync(join(__dirname, 'supporting-files/Pe-icon-7-stroke.ttf'));
  const css = readFileSync(join(__dirname, 'supporting-files/pe-icon-7-stroke.css'), 'utf-8');

  const svgString = postIconfonts(css, font, {
    size: 12,
    filterNames: [
      'pe-7s-angle-left',
      'pe-7s-config',
      'pe-7s-file',
      'pe-7s-help1',
      'pe-7s-notebook',
      'pe-7s-print',
      'pe-7s-share',
      'pe-7s-trash',
    ],
    transformNames: name => name.substr('pe-7s-'.length),
  });

  return gulpFile('icons.svg', svgString, { src: true })
    .pipe(gulp.dest('dist'));
});

gulp.task('css', () => (
  gulp.src('styles/**/*.css')
    .pipe(postcss([
      esCssModules({
        jsFiles: 'src/index.js',
        generateScopedName: () => cssClass.next().value,
        parser: 'babel-eslint',
      }),
    ]))
    .pipe(concat('style.css'))
    .pipe(postcss([
      cssNext({
        browsers: '> 1%, last 2 versions, Firefox ESR, Opera 12.1, not ie <= 11',
        features: {
          rem: false,
        },
      }),
      mqPacker(),
    ]))
    .pipe(cssnano())
    .pipe(gulp.dest('dist'))
));

gulp.task('html', () => (
  gulp.src('server/index.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      removeAttributeQuotes: true,
    }))
    .pipe(gulp.dest('build'))
));

gulp.task('client', ['css'], cb => {
  webpack({
    ...commonConfig,
    entry: './src/index',
    output: {
      path: join(__dirname, '/dist'),
      filename: 'client.js',
      library: 'autotrip',
      libraryTarget: 'umd',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin(),
    ],
  }, cb);
});

gulp.task('build', ['client', 'css', 'html', 'icons']);

gulp.task('default', ['build']);
