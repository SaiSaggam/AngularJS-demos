var gulp = require('gulp');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
var watch = require('gulp-watch');
var nano = require('gulp-cssnano');
var cssmin = require('gulp-cssmin');
var less = require('gulp-less');


var source = {
    js: {
        src: [
            'app/app.js',
            'app/**/module.js',
            'app/**/!(module)*.js',
            'app/*.js'
        ]
    },
    less: {
        watch: [
            'styles/less/**/*.less'
        ],
        src: [
            'styles/less/**/*.less'
        ],
        include: [
            'styles/less/**/*.less'
        ]
    },
    css: {
        watch: [
            'styles/css/**/*.css'
        ],
        src: [
            'styles/css/**/*.css'
        ]
    }
}

gulp.task('connect', function() {
    connect.server({
        port: 8888
    });
});

// app js
gulp.task('app-js', function() {
    gulp.src(source.js.src)
        .pipe(concat('app.min.js'))
        .pipe(gulp.dest('./assets/js'));
});

// vendor js
gulp.task('vendor-js', function() {
    gulp.src(['./vendor/js/angular.js', './vendor/js/jquery.min.js', './vendor/js/**/*.js'])
        .pipe(concat('vendor.min.js'))
        .pipe(gulp.dest('./assets/js'));
});


// vendor css
gulp.task('vendor-css', function() {
    return gulp.src('vendor/css/*.css')
        .pipe(concat('vendor.min.css'))
        .pipe(gulp.dest('./assets/css'));
});

//app-less
gulp.task('app-less', function() {
    return gulp.src(source.less.src)
        .pipe(less({
            paths: source.less.include
        }))
        // .pipe(sourcemaps.init())
        // .pipe(nano())
        // .pipe(sourcemaps.write('.'))

    .pipe(gulp.dest('./styles/css'));
});

//app-css
gulp.task('app-css', ['app-less'], function() {
    return gulp.src(source.css.src)
        .pipe(concat('app.min.css'))
        // .pipe(nano())
        .pipe(gulp.dest('./assets/css'));
});


// watch
gulp.task('watch', function() {
    gulp.watch(source.js.src, ['app-js']);
    gulp.watch(source.less.watch, ['app-less']);
    gulp.watch(source.css.watch, ['app-css']);
});


gulp.task('default', ['vendor-js', 'vendor-css', 'app-js', 'app-less', 'app-css', 'connect', 'watch']);


// gulp.task('build', ['vendor-js', 'vendor-css']);

// GULP MINFY
// gulp.task('scripts', function() {
//     gulp.src('./scripts/**/*.js')
//         .pipe(minify({
//             ext: {
//                 min: '.js'
//             },
//         }))
//         .pipe(gulp.dest('./assets/js'));
// });

// GULP UGLIFY
// gulp.task('scripts', function() {
//     gulp.src('./scripts/**/*.js')
//         .pipe(concat('app.js'))
//         .pipe(uglify())
//         .pipe(gulp.dest('./assets/js'));
// });

// GULP CSS
// app css
// gulp.task('app-css', function() {
//     return gulp.src('app-css/*.css')
//         .pipe(concat('app.min.css'))
//         .pipe(nano())
//         .pipe(gulp.dest('./assets/css'));
//
// });
