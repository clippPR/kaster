var 
    gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    exit = require('gulp-exit');

gulp.task('test', function() {
  return gulp.src(['test/*.test.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec',
            globals: {
                should: require('should')
            }
        }))
        .pipe(exit());
});

gulp.task('lint', function() {
  return gulp.src(['./lib/*.js', 'test/*.test.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('default', ['lint', 'test']);