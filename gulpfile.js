var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var jade        = require('gulp-jade');
var cp          = require('child_process');
var watch       = require('gulp-watch');
var merge       = require('merge-stream');
var htmlpretty  = require('gulp-prettify');
var uglify       = require('gulp-uglify');
var rename       = require("gulp-rename");
var concat       = require("gulp-concat");
var order        = require("gulp-order");
var merge        = require('merge-stream');
var notify       = require("gulp-notify");
var rename       = require("gulp-rename");


var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

// Error Handler
function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        },
        browser: "google chrome",
        notify: false,
    });
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('assets/_scss/main.scss')
  // .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      // .pipe(sourcemaps.write())
      .pipe(prefix({browsers: ['last 15 versions']}))
      .pipe(gulp.dest('./assets/css'))
      // compressed
      // .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(prefix({browsers: ['last 15 versions']}))
      .pipe(rename({
        suffix: '.min'
        }))
      // .pipe(sourcemaps.write())
      .pipe(gulp.dest('./assets/css'))
      .pipe(browserSync.reload({stream:true}));
});

/*
* Jade + Multyply src & out
*/
gulp.task('jade', function() {
    var jadeInclude = gulp.src('_jade/include/*.jade')
      .pipe(jade({pretty: true}))
      .pipe(gulp.dest('_includes'));
    var jadeLayouts = gulp.src('_jade/layout/*.jade')
      .pipe(jade({pretty: true}))
      .pipe(gulp.dest('_layouts'));

    return merge(jadeInclude, jadeLayouts);
});

/*
* Copy add assets files to _site without jekyll rebuild
*/

gulp.task('copyfile', function() {
    var img = gulp.src('assets/img/*.*')
    .pipe(watch('assets/img/*.*'))
    .pipe(gulp.dest('_site/assets/img'));
    var js = gulp.src('assets/js/*.*')
    .pipe(watch('assets/js/*.*'))
    .pipe(gulp.dest('_site/assets/js'));

    return merge(img, js);
});


gulp.task('jsConcat', ['jsMain'], function() {
  return gulp.src('./assets/js/_lib/*.js')
    .pipe(order([
      "assets/js/_lib/jquery-1.11.2.min.js",
      // "assets/js/_lib/core.js",
      // "assets/js/_lib/gridcore.js",
      "assets/js/_lib/*.js",
    ],{ base: './' }))
    .pipe(concat("bundle.js"))
    .pipe(gulp.dest('./assets/js'))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
      }))
    .pipe(gulp.dest('./assets/js'));
});

gulp.task('jsMain',function(){
  return gulp.src('./assets/js/main.js')
    .pipe(gulp.dest('./assets/js'))
    .pipe(uglify())
    .on('error', swallowError)
    .on('error', notify.onError({
        message: 'Error: <%= error.message %>',
        sound: "Basso"
      }))
    .pipe(rename({
      suffix: '.min'
      }))
    .pipe(gulp.dest('./assets/js'))
    .pipe(browserSync.reload({stream:true}));
});

/*
* HTML Prettify
*/
gulp.task('htmlpretty', function() {
  gulp.src('_site/**/*.html')
    .pipe(htmlpretty({indent_size: 2, wrap_line_length: 0}))
    .pipe(gulp.dest('_site'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('assets/_scss/**/*.scss', ['sass']);
    gulp.watch(['*.html', '_layouts/*.html', '_posts/*', '_pages/*'], ['jekyll-rebuild']);
    gulp.watch(['_jade/**/*.jade'], ['jade', 'jekyll-rebuild']);
    gulp.watch('./assets/js/main.js',['jsMain']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch', 'jade', 'copyfile', 'jsMain', 'jsConcat']);
