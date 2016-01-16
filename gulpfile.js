var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'gulp.*']
    });

var paths = {
    jade: 'src/sections/**/*.jade',
    stylus: 'src/app/main.styl',
    js: 'src/**/*.js',
    assets: 'build/assets',
    source: 'src/',
    output: 'build/'
};

gulp.task('clean', function () {
    return gulp.src(paths.output, {read: false})
        .pipe($.clean());
});


// Development tasks
// -------------------------------------------------------------

gulp.task('compile-jade', function() {
    return gulp
        .src(paths.jade)
        .pipe($.jade({
            pretty: true,
            cwd: "/"
        }))
        .pipe($.rename({dirname: ''}))
        .pipe(gulp.dest(paths.output))
        .pipe($.connect.reload());
});

gulp.task('wiredep', ['compile-jade'], function () {
    return gulp.src(paths.output + '*.html')
        .pipe($.wiredep())
        .pipe(gulp.dest(paths.output));
});

gulp.task('inject-js', ['wiredep'], function () {
    return gulp.src(paths.output + '*.html')
        .pipe($.inject(gulp.src(['./src/**/*.js'], {read: false}), {relative: true}))
        .pipe(gulp.dest(paths.output));
});

gulp.task('dev-styles', function () {
    return gulp.src([paths.stylus])
        .pipe($.stylus())
        .pipe(gulp.dest(paths.assets + '/css/'))
        .pipe($.livereload())
        .pipe($.connect.reload());
});

gulp.task('dev-jade', ['inject-js']);

// Build and inject all files for development
gulp.task('build-dev', ['dev-jade', 'dev-styles']);


// Production tasks
// -------------------------------------------------------------

gulp.task('prod-wiredep', ['prod-inject-js'], function() {
    return gulp.src(paths.output + '*.html')
        .pipe($.usemin({
            js: [$.uglify()]
        }))
        .pipe(gulp.dest(paths.output));
});

gulp.task('prod-inject-js', ['wiredep'], function () {
    var appStream = gulp.src(['./src/**/*.js'])
        .pipe($.concat('app.js'))
        .pipe($.uglify())
        .pipe(gulp.dest(paths.output + 'assets/js/'));

    return gulp.src(paths.output + '*.html')
        .pipe($.inject(appStream, {ignorePath: "/build/", addRootSlash: false}))
        .pipe(gulp.dest(paths.output));
});

gulp.task('optimize-files', ['prod-wiredep'], function() {
    var opts = {
        conditionals: true,
        spare:true
    };
    return gulp.src(paths.output + '**/*.html')
        .pipe($.minifyHtml(opts))
        .pipe(gulp.dest(paths.output));
});

gulp.task('prod-styles', ['dev-styles'], function () {
    return gulp.src([paths.assets + '/main.css'])
        .pipe($.csso())
        .pipe(gulp.dest(paths.assets))
        .pipe($.connect.reload());
});

gulp.task('build-prod', ['optimize-files', 'prod-styles']);


// Server tasks
// -------------------------------------------------------------

gulp.task('serve-dev', ['build-dev'], function () {
    $.connect.server({
        root: 'build',
        livereload: true
    });

    gulp.src(__filename)
        .pipe($.open({uri: 'http://localhost:8080'}));

    gulp.watch([paths.source + '**/*.jade'], ['dev-jade']);
    gulp.watch([paths.source + '**/*.styl'], ['dev-styles']);
    gulp.watch([paths.source + '**/*.js'], ['dev-jade']);
});

gulp.task('serve-prod', ['build-prod'], function () {
    $.connect.server({
        root: 'build',
        livereload: true
    });

    gulp.src(__filename)
        .pipe($.open({uri: 'http://localhost:8080'}));

    gulp.watch([paths.source + '**/*.jade'], ['optimize-files']);
    gulp.watch([paths.source + '**/*.styl'], ['prod-styles']);
    gulp.watch([paths.source + '**/*.js'], ['optimize-files']);
});