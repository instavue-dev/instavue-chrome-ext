const {parallel, series, watch, dest, src} = require('gulp');
const browserSync = require('browser-sync');
const sass = require('gulp-sass');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const del = require('del');

function browserReload() {
  browserSync.init({
    server: {
      baseDir: 'src'
    }
  });
};

function styles() {
	return src('src/sass/**/*.sass')
	.pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(rename({suffix: '.min', prefix: ''}))
	.pipe(cleanCss())
	.pipe(dest('src/css'))
	.pipe(browserSync.reload({stream: true}));
};

function html() {
	return src('src/*.html')
	.pipe(browserSync.reload({stream: true}));
};

function watchFiles() {
	watch('src/*.html', parallel(html));
	watch('src/sass/**/*.sass', parallel(styles));
};

function removeDist(cd) {
	cd();
	return del.sync('dist');
};

function files(cd) {
	
	let html = src('src/*.html')
	.pipe(dest('dist'));

	let styles = src('src/css/main.min.css')
	.pipe(dest('dist/css'));

	let fonts = src('src/fonts/**/*')
	.pipe(dest('dist/fonts'));

	let images = src('src/img/**/*')
	.pipe(dest('dist/img'));

	cd();

};

exports.default = parallel(styles, watchFiles, browserReload);
exports.build = series(removeDist, styles, files);

