var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    ts = require('gulp-typescript');

var tsProject = ts.createProject('tsconfig.json', {
  typescript: require('typescript')
});

gulp.task('typescript-compile', ['js'], function () {
  var tsResult = gulp.src(['build/**/*.ts', './index.ts']) // instead of gulp.src(...)
      .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('build'));
});

gulp.task('copy', ['typescript-compile'], function(){
  return gulp.src(['build/**/*.*'])
      .pipe(gulp.dest('../QountUI/node_modules/invoicesUI'));
});

gulp.task('clean', function () {
  return del(['test', 'build']);
});

gulp.task('watch', function () {
  gulp.watch('app/**/*.ts', ['copy']);
});

// move js
gulp.task('js', function () {
  return gulp.src(['app/**/*.*', './package.json', './index.ts', './tsconfig.json', './typings.json'], {base: "."})
      .pipe(gulp.dest('build'));
});