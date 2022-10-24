const {src, dest, task, series, watch, parallel} = require('gulp');
const rm = require( 'gulp-rm' );
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const autoprefixer = require('gulp-autoprefixer');
const sassGlob = require('gulp-sass-glob');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const MobileDetect = require('mobile-detect');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');

const env = process.env.NODE_ENV;

// вдвойне сжимает элементы на странице(применяет rem к rem)!!!
// const px2rem = require('gulp-smile-px2rem');


//из-за этой строки неправильно компилируется sass!!!
// sass.compiler = require('node-sass'); 

task( 'clean', () => {
  return src( 'dist/**/*', { read: false })
    .pipe(rm())
});

task ('copy:html', () => {
  return src('src/*.html')
    .pipe(dest('dist'))
    .pipe(reload({stream: true}));
});

task ('copy:img', () => {
  return src('src/**/*.png')
    .pipe(dest('dist'))
});

task ('copy', () => {
  return src('src/sass/**/*.scss')
    .pipe(dest('dist'))
});

const styles = [
  'node_modules/normalize.css/normalize.css',
  'node_modules/bxslider/dist/jquery.bxslider.css',
  'node_modules/@fancyapps/ui/dist/fancybox.css',
  'src/sass/main.scss'
]

task ('styles', () => {
  return src(styles)
  .pipe(concat('main.scss'))
  .pipe(sassGlob())
  .pipe(sass().on('error', sass.logError))
  .pipe(gulpif(env === 'dev', 
    autoprefixer({
      cascade: false
    }))
  )
  .pipe(gulpif(env === 'prod', gcmq()))
  .pipe(gulpif(env === 'prod', cleanCSS({compatibility: 'ie8'})))
  .pipe(dest('dist'));
});

const scripts = [
  'node_modules/jquery/dist/jquery.js',
  'node_modules/@fancyapps/ui/dist/fancybox.umd.js',
  'node_modules/bxslider/dist/jquery.bxslider.min.js',
  'node_modules/jquery-touchswipe/jquery.touchSwipe.js',
  'node_modules/mobile-detect/mobile-detect.min.js',
  'src/scripts/*.js'
]

task ('scripts', () => {
  return src(scripts)
  .pipe(concat('main.js', {newLine: ";"}))
  .pipe(uglify())
  .pipe(dest('dist'));
});

task('icons', () => {
  return src('src/img/icons/*.svg')
    .pipe(svgo({
      plugins: [
        {
          removeAttrs: {attrs: '(fill|stroke|style|data.*)'}
        }
      ]
    }))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: '../sprite.svg'
        }
      }
    }))
    .pipe(dest('dist/img/icons'));
})

task('server', () => {
  browserSync.init({
      server: {
          baseDir: "./dist"
      },
      open: false
  });
});

task('watch', () => {
  watch('./src/sass/**/*.scss', series('styles'));
  watch('./src/*.html', series('copy:html'));
  watch('./src/scripts/*.js', series('scripts'));
  watch('./src/img/icons/*.svg', series('icons'));
})

task('default', 
  series(
    'clean', 
    parallel('copy:html', 'copy:img', 'styles', 'scripts', 'icons'), 
    parallel('watch', 'server')
  )
);

task('build', 
  series(
    'clean', 
    parallel('copy:html', 'copy:img', 'styles', 'scripts', 'icons')
  )
);