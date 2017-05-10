//Module: File I/O is provided by simple wrappers around standard POSIX functions.
const file_system = require('fs');
//const util = require('util');
//The streaming build system
const gulp = require('gulp');
//Gulp plugin for compiling Pug templates
const pug = require('gulp-pug');
//The path module provides utilities for working with file and directory paths
const path_system = require('path');
//Prevent pipe breaking caused by errors from gulp plugins
const plumber = require('gulp-plumber');
//Match files using the patterns the shell uses, like stars and stuff.
//const glob = require('glob');
//Rename files
const rename = require('gulp-rename');
//Less for Gulp
const less = require('gulp-less');
//Minify css with clean-css
const clean_css = require('gulp-clean-css');
//Minify files with UglifyJS
const uglify = require('gulp-uglify');
//Concatenates files
const concat = require('gulp-concat');
//The classic and strict javascript lint-tool for gulp.js
const jslint = require('gulp-jslint');
//JSHint plugin for gulp
const jshint = require('gulp-jshint');
//Time-saving synchronised browser testing.
const browserSync = require('browser-sync').create();
//Make synchronous web requests
const request = require('sync-request');
//One-way synchronization of directories with glob.
const syncy = require('syncy');
//Prefix CSS with Autoprefixer
const autoprefixer = require('gulp-autoprefixer');
//Minify PNG, JPEG, GIF and SVG images with imagemin
const imagemin = require('gulp-imagemin');
/*
  *@constant {string} Nombre por default de la carpeta donde se encuentran los editables
  *@global
*/
const _SOURCE_FOLDER = 'src/';
/*
  *@constant {string} Nombre por default de la carpeta donde se encuentran los archivos compilados
  *@global
*/
const _DIST_FOLDER = 'dist/';
/*
  *@constant {string} Nombre de la llave para distinguir que se trata de archivos
  *@global
*/
const _FILES_KEY = '_files';
/*
  *@constant {string} Nombre clave para manejar los errores de la aplicación
  *@global
*/
const _ERROR_MESSAGE = 'errors';
/*
  *@constant {string} Nombre clave para manejar los advertencias de la aplicación
  *@global
*/
const _WARN_MESSAGE = 'warn';
/*
  *@constant {string} Nombre clave para manejar los mensajes de la aplicación
  *@global
*/
const _LOG_MESSAGE = 'log';
/*
  *@constant {string} Nombre clave para manejar los mensajes de información de la aplicación
  *@global
*/
const _INFO_MESSAGE = 'info';
/*
  *@constant {string} Prefijo que indican los archivos que sirven de include
  *@global
*/
const _FILE_PREFIX = '_';
/*
  * @description Nombre del archivo donde se encuentra la configuración inicial
  * @type {string}
  * @private
*/
var config_file = 'config.json';
/*
  * @description Almacena la configuración que se carga del archivo inicial
  * @type {json}
  * @public
*/
var global_config = {};
/*
  * @description Contiene las llaves para cada tipo de mensaje que envía la aplicación
  * @type {json}
  * @public
*/
var messages = {
  /*
    * @description Valores por default de la consola nativa
    * @type {json}
    * @public
  */
  default:{
    /*
      * @description Código del color por default de la consola
      * @type {string}
      * @public
    */
    color: '\x1b[0m'
  },
  /*
    * @description Color y mensajes de la aplicación
    * @type {json}
    * @public
  */
  log:{
    /*
      * @description Código del color por default para los mensajes de la aplicación
      * @type {string}
      * @public
    */
    color: '\x1b[36m',
    file: 'Se ha creado el archivo...',
    mkdir: 'Se ha creado la carpeta...',
    exists: 'La carpeta ya existe...'
  },
  /*
    * @description Color y mensajes de error de la aplicación
    * @type {json}
    * @public
  */
  errors: {
    /*
      * @description Código del color por default para los errores de la aplicación
      * @type {string}
      * @public
    */
    color: '\x1b[41m',
    config: 'No se encontró el archivo de configuración [config.json]'
  },
  /*
    * @description Color y mensajes de información de la aplicación
    * @type {json}
    * @public
  */
  info:{
    /*
      * @description Código del color por default para los errores de la aplicación
      * @type {string}
      * @public
    */
    color: '\x1b[42m',
    config: 'Leyendo configuración inicial del proyecto',
    mkdir: 'Creando carpetas y archivos iniciales',
    template: 'Compilando HTML...',
    html: 'HTML listo...',
    less: 'Compilando CSS...',
    css: 'CSS listo...',
    source: 'Compilando Javascript...',
    js: 'Javascript listo...',
    request: 'Descargando el template para el archivo...',
    sync: 'Se han sincronizado los archivos de la carpeta...'
  },
  /*
    * @description Color y mensajes de advertencia de la aplicación
    * @type {json}
    * @public
  */
  warn:{
    color: '\x1b[43m'
  }
};//messages end
/*
  *@constant {json} Extensiones de los archivos que sirven como fuentes a compilar
  *@global
*/
const _EXTENSIONS = {
  /*
    *@constant {json} Extensión del archivo fuente del template de HTML
    *@global
  */
  HTML: '.pug',
  CSS: '.less',
  JS: '.js'
};
/*
  *@constant {json} Nombres de las carpetas para las distribuciones
  *@global
*/
const _PATHS = {
  /*
    *@constant {string} Carpeta de los archivos para debug
    *@global
  */
  DEV: 'dist/dev/',
  /*
    *@constant {string} Carpeta de los archivos listos para producción
    *@global
  */
  PROD: 'dist/prod/',
  /*
    *@constant {string} Carpeta de los archivos a sincronizar de soporte del CSS
    *@global
  */
  ASSETS: 'css/assets/',
  /*
    *@constant {string} Carpeta de las imagenes a sincronizar entre dev y prod
    *@global
  */
  IMAGES: 'images/'
};
/*
  * @description Define los niveles de carpetas por default para los templates HTML
  * @type {json}
  * @private
*/
var _levels = {
  root: 2,
  sections: 3
};
/**
  * @description Archivos y folders que sirven de origen para compilar el HTML
  * @type {json}
  * @private
*/
var _config_templates = {
  base: 'html/',
  index: _SOURCE_FOLDER + 'html/index.pug',
  sections: 'sections',
  globs: 'html/sections/**/*.pug'
};
/**
  * @description Archivos y folders que sirven de origen para compilar el CSS
  * @type {json}
  * @private
*/
var _config_style = {
  base: 'css/',
  main: _SOURCE_FOLDER + 'css/style.less',
  sections: 'sections',
  globs: 'css/sections/**/*.less'
};
/**
  * @description Configuración base para los js de producción
  * @type {json}
  * @private
*/
var _config_js = {
  base: 'js/',
  files: [],
  total: 0
};
/**
  * @description Maneja el envío de los mensajes a la consola (log,info,error,warn)
  *
  * @private
  * @param {string} [code] es la llave del json [messages] del de mensaje a mostrar
  * @param {string} [type] es el tipo de mensaje a mostrar
  * @param {string} [log] es opcional y permite adicionar mas contenido a un mensaje de log y/o info
*/
var _handlerMessages = function (code,type,log){
  var text;
  switch(type){
    case _ERROR_MESSAGE: {return console.error('\n',messages.errors.color, messages.errors[code],messages.default.color,'\n');} break;
    case _LOG_MESSAGE: {
      text = messages.log[code];
      if (log !== undefined)
        text += log;
      return console.log(messages.log.color,text,messages.default.color);
    }
    break;
    case _INFO_MESSAGE:{
      text = messages.info[code];
      if (log !== undefined)
        text += log;
      return console.info('\n',messages.info.color, text,messages.default.color,'\n');
    }
    break;
  }//switch end
  };//_handlerMessages end
/**
  * @description Itera de manera recursiva la llave de la configuración inicial [folders]
  *
  * @private
  * @param {json} [folders] contiene las carpetas y archivos a crear por única vez
  * @param {string} [path] opcional si la carpeta y/o archivo está dentro de otros folders
*/
var _iterateFolders = function(folders,path){

  for (var key in folders){
    var dir;
    var temporal = '';
    //Determina si se encuentra en la raíz o dentro de otras carpetas
    if (path !== undefined){
      temporal = path;
      dir = path + key;
    }
    else{
      dir = key;
    }
    //Determinar si el elemento actual es un folder o un arreglo de archivos
    if (key !== _FILES_KEY ){
      //Validamos si la carpeta ya existe
      try {
        file_system.accessSync(dir, file_system.F_OK);
        _handlerMessages('exists',_LOG_MESSAGE,dir);
      }
      catch (e){//Crear el folder
        file_system.mkdirSync(dir);
        //Informar de la acción en la consola
        _handlerMessages('mkdir',_LOG_MESSAGE,dir);
      }
      //Si existen carpetas dentro del elemento actual
      if ( typeof folders[key] === "object" && folders[key] !== null){
        //Se atualiza el path
        if (temporal !== '')
          temporal += key + '/';
        else
          temporal = key + '/';
        //Recorrer el resto de llaves
        _iterateFolders(folders[key], temporal);
      }
    }
    else{
      //Crear todos los archivos en la ubicación actual
      var total = folders[key].length,
          dest;
      for ( var i = 0; i < total; i++){
        //Se determina el nivel dentro del árbol de carpeta a colocar el archivo
        dest = folders[key][i].name;
        if (temporal !== ''){
          dest = temporal + folders[key][i].name;
        }
        if (folders[key][i].template !== undefined && folders[key][i].template !== ''){
          _handlerMessages('request', _INFO_MESSAGE, folders[key][i].name);
          var response = request('GET', folders[key][i].template);
          file_system.writeFileSync(dest,response.getBody());
        }
        else{
          file_system.writeFileSync(dest,'');
        }
        _handlerMessages('file',_LOG_MESSAGE,temporal + folders[key][i].name);
      }
    }
  }//for end
};//_iterateFolders end
/**
  * @description Si la aplicación se ejecuta por primera vez, se encarga de crear la estructura
  *              inicial de carpetas para el proyecto Front end
  *
  * @private
  * @param {json} [folders] contiene las carpetas y archivos a crear por única vez
*/
var _createStructure = function (folders){
  _handlerMessages('mkdir',_INFO_MESSAGE);
  _iterateFolders(folders);
  _getModifiedFile(_SOURCE_FOLDER);
  _syncAssets(_PATHS.ASSETS);
  _optimizeImages(_PATHS.IMAGES);
};
/**
  * @description Primera función a ejecutar por parte de la aplicación, que determina
  *              si existe la configuración inicial, si no, termina su ejecución,
  *              sino, si es por primera vez crea la estructura inicial,
  *              en caso contrario sólo sigue el flujo normal del builder task
  *
  * @public
*/
var main = function(){
  //Lee el archivo de configuración inicial
  file_system.readFile( config_file, 'utf-8', function (error, config) {
    //Si no existe tal, se informa y termina la aplicación
    if (error){
      //console.error('\n','\x1b[101m', new Error( messages.errors.config ),'\x1b[0m','\n');
      _handlerMessages('config',_ERROR_MESSAGE);
      process.exit(0);
    }
    else{
      _handlerMessages('config',_INFO_MESSAGE);
      global_config = JSON.parse(config);
      //console.log(util.format(config));
      //Si es la primera vez que se ejecuta la aplicacón, crea la estrucutra inicial
      //en caso contrario pasa el flujo al builder task
      file_system.access( _SOURCE_FOLDER, file_system.F_OK, function(error) {
        if (error){
          _createStructure( global_config.folders );
        }
        else{
          if (global_config.config_js !== undefined){
            _config_js.files = Object.keys(global_config.config_js);
            _config_js.total = _config_js.files.length;
          }
          _getModifiedFile(_SOURCE_FOLDER);
          _syncAssets(_PATHS.ASSETS);
          _optimizeImages(_PATHS.IMAGES);
        }
      });
    }

  });
};//main end
//Ejecución de la función principal
main ();
/**
  * @description Permite leer los nombres de archivos dentro de un folder
  *
  * @private
  * @param {string} [folder] Path del folder donde se va a iterar los nombres de archivos
  *
  * @returns {array} Regresa un arreglo con los nombres de los archivos localizados en el folder
*/
var _readFolders = function (folder){
  file_system.readdir(folder, function(error,files){return files;});
};//_readFolders end
/**
 * [[Description]]
 * @private
 * @param {[[Type]]} file [[Description]]
 */
var _removeFile = function (file) {
  file_system.access(file, file_system.F_OK,function(error){
    if (!error){
      file_system.unlink(file,function(error){
        if (error){
          console.info('\n',messages.info.color, 'El archivo no existe',messages.default.color,'\n');
        }
        var text = 'Borrado con exito el archivo ... ' + file;
        console.info('\n',messages.info.color, text,messages.default.color,'\n');
      });
    }
  })
};
/**
 * Configura las rutas para los archivos JS que se concatenan en un sólo archivo minificado
 * @private
 * @param   {string} origin Archivo base a concatenar y minificar
 * @returns {boolean}|{object} Retorna un objecto con las rutas y nombres destino, o en caso
 *                             de error false
 */
var _getRoutesJS = function (origin) {
  var elements, total, temp_file;
  for (var i = 0; i < _config_js.total; i++ ){
    elements = global_config.config_js[_config_js.files[i]].slice();
    total = elements.length;
    for (var j = 0; j < total; j++){
      if (elements[j] === origin){
        elements.forEach(function(item,index){
          elements[index] = _SOURCE_FOLDER + item;
          temp_file = _PATHS.PROD + item;
          temp_file = temp_file.split('.');
          temp_file = temp_file[0] + '.min.' + temp_file[1];
          _removeFile(temp_file);
        });
        var path = _config_js.files[i].split('/'),
            name = path.pop();
        path = path.join('/');
        return{
          name: name,
          dest: path + '/',
          files: elements
        }
      }
    }
  }
  return false;
};
/**
 * Compila el JS para los perfiles de desarrollo y producción, así como ejecutar
 * los reportes sobre los archivos JS Hint y JS Lint
 * @private
 * @param {object} data Configuración del archivo origen que sufrió un cambio
 */
var _compileJS = function(data){
  var stylish = require('jshint-stylish'),
      origin, dest_dev, dest_prod, config_prod;

  var temp = data.folders;
  temp.pop();
  temp = temp.join('/');

  origin = _SOURCE_FOLDER + data.path;
  dest_dev = _PATHS.DEV + temp;
  //
  _handlerMessages('source',_INFO_MESSAGE);
  config_prod = _getRoutesJS(data.path);
  
  if (config_prod){ //Concantena
    gulp.src([origin])
      .pipe( plumber() )
      .pipe(gulp.dest(dest_dev))
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(jslint({indent:2}))
      .pipe(jslint.reporter('stylish'));
    
    gulp.src(config_prod.files)
        .pipe(concat(config_prod.name))
        .pipe(gulp.dest(dest_dev));
  }
  else{//Exporta
    gulp.src([origin])
      .pipe( plumber() )
      .pipe(gulp.dest(dest_dev))
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(jslint({indent:2}))
      .pipe(jslint.reporter('stylish'));
  }
  
  if (config_prod){ //Concantena y minifica
    dest_prod = _PATHS.PROD + config_prod.dest;
    console.log(config_prod.name);
    gulp.src(config_prod.files)
      .pipe(concat(config_prod.name))
      .pipe(plumber())
      .pipe(uglify())
      .pipe( rename(function(path){
        path.basename += '.min';
      }))
      .pipe(gulp.dest(dest_prod));
  }
  else{ //Minifica
    dest_prod = _PATHS.PROD + temp;
    gulp.src(origin)
      .pipe( plumber() )
      .pipe(uglify())
      .pipe( rename(function(path){
        path.basename += '.min';
      }))
      .pipe(gulp.dest(dest_prod));
  }
  //_handlerMessages('js',_INFO_MESSAGE);
};
/**
 * Compila y concatena los archivo LESS y genera los estilos
 * para producción y desarrollo
 * @private
 * @param {object} data Configuración del archivo origen que sufrió un cambio
 */
var _compileLess = function (data){
  _handlerMessages('less',_INFO_MESSAGE);

  gulp.src(_config_style.main)
      .pipe(plumber())
      .pipe(less())
      .pipe(autoprefixer({remove: false, browsers: ['last 10 versions','ie 8-9']}))
      .pipe(gulp.dest(_PATHS.DEV + _config_style.base))
      .pipe( browserSync.stream() );

  gulp.src(_config_style.main)
      .pipe( plumber() )
      .pipe(less())
      .pipe(clean_css({compatibility: 'ie8'}))
      .pipe( rename(function(path){
        path.basename += '.min';
      }))
      .pipe(autoprefixer({remove: false, browsers: ['last 10 versions','ie 8-9']}))
      .pipe(gulp.dest(_PATHS.PROD + _config_style.base))
      .pipe( browserSync.stream() );

  _handlerMessages('css',_INFO_MESSAGE);

};
/**
 * Compila los templates basados en Pug
 * @private
 * @param {object} data Configuración del archivo origen que sufrió un cambio
 */
var _compilePug = function (data){

  var prefix = data.file.substring(0,1),
      origin, dest_dev, dest_prod;

  //En caso de no tener prefijo
  //se compila el archivo modificado
  if ( prefix !== _FILE_PREFIX){
     _handlerMessages('template',_INFO_MESSAGE,data.file);
    origin = _SOURCE_FOLDER + data.path;
    dest_dev = _PATHS.DEV;
    dest_prod = _PATHS.PROD;
    //Si es una sección interna, se modifican las rutas
    var page = path_system.basename(data.file,'.pug');
    page += '.html';
    if (data.level >= _levels.sections){
      var temp = data.folders;
      temp.shift();
      temp.pop();
      //Unificar el resto en una sola cadena
      temp = temp.join('/');
      //Convertir al formato de salida
      /*var page = path_system.basename(data.file,'.pug');
      page = page.replace('_','-') + '.html';
      dest_dev += temp + '/' + page;
      dest_prod += temp + '/' + page;*/
      dest_dev += temp;
      dest_prod += temp;
    }
  }
  else{
    // En caso de ser un archivo base, se compilan de nuevo todos los archivos
    _handlerMessages('template',_INFO_MESSAGE);
    origin =  _SOURCE_FOLDER + _config_templates.globs;
    dest_dev = _PATHS.DEV + _config_templates.sections;
    dest_prod = _PATHS.PROD + _config_templates.sections;
    //Versionas para debug
    gulp.src( _config_templates.index )
      .pipe( plumber() )
      .pipe( pug({pretty:true}) )
      .pipe( gulp.dest(_PATHS.DEV) );
      //.pipe( browserSync.stream() );
      //.pipe( browserSync.reload() );
    //Generar versiones de producción
    gulp.src( _config_templates.index )
        .pipe( plumber() )
        .pipe( pug() )
        .pipe( gulp.dest( _PATHS.PROD ) );
  }
  //Versionas para debug
  gulp.src( origin )
    .pipe( plumber() )
    .pipe( pug({pretty:true}) )
    .pipe( rename(function(path){
      path.basename = path.basename.replace(/_/g,'-');
    }))
    .pipe( gulp.dest(dest_dev) );
  //Generar versiones de producción
  gulp.src( origin )
      .pipe( plumber() )
      .pipe( pug() )
      .pipe( rename(function(path){
        path.basename = path.basename.replace(/_/g,'-');
      }))
      .pipe( gulp.dest( dest_prod ) );
  _handlerMessages('html',_INFO_MESSAGE);
};//_compilePug
/**
 * Observa la carpeta de archivos recurso para compilar
 * @private
 * @param {string} path    Ruta del archivo que sufrió una modificación
 * @param {string} file    Nombre del archivo modificado
 * @param {number} level   Numero de niveles de carpetas donde se encuentra el archivo
 * @param {Array}  folders Arreglo con los nombres de carpetas y nombre del archivo
 * @param {string} ext     Extensión del archivo
 */
var _analyzeModifiedFile = function (path,file,level,folders,ext){
  var data = {
    folders: folders,
    path: path,
    dir: path_system.dirname(path),
    file: file,
    ext: ext,
    level: level
  };
  switch( data.ext ){
    case _EXTENSIONS.HTML: _compilePug(data); break;
    case _EXTENSIONS.CSS: _compileLess(data); break;
    case _EXTENSIONS.JS: _compileJS(data);
//    default:{
//      if ( file.search('-') === -1 )
//        file_system.renameSync( _DIST_FOLDER + path , _DIST_FOLDER + data.dir + '/' + file.replace('_','-') );
//      else
//        file_system.unwatch(_DIST_FOLDER + path , _DIST_FOLDER + data.dir + '/' + file.replace('_','-'));
//    }
  };
};
/**
 * Configura un servidor HTTP sobre la carpeta del ambiente de desarrollo
 * @private
 */
var _configServer = function (){
  var config, 
      profile = _PATHS.DEV;
  if (global_config.proxy === '' || global_config.proxy === undefined){
    if ( global_config.profile !== undefined){
      profile = _PATHS.PROD;
    }
    config = {
      server: {
        baseDir: profile,
        directory: true
      }
    };
  }
  else{
    config = {
      proxy: global_config.proxy
    }
  }
  browserSync.init(config);
  gulp.watch( profile + '**/*.*').on('change', browserSync.reload);
};
/**
 * Observa la carpeta con los archivos base para compilar
 * @private
 * @param {string} dir Carpeta a observar los archivos si sufren cambios
 */
var _getModifiedFile = function (dir){
  var folders = [],
      total = 0,
      file = '',
      ext = '';
  file_system.watch(dir,{recursive:true}, function(eventType, path){
    ext = path_system.extname(path);
    folders = path.split('/');
    total = folders.length;
    if ( total > 1)
      file = folders[total-1];
    else
      file = folders[0];
    if (ext !== '' )
      _analyzeModifiedFile(path,file,total,folders,ext);
  });//
  _configServer();
};
/**
 * Permite observar las modificaciones en los archivos de soporte
 * del CSS y sincronizar las distribuciones
 * @private
 * @param {string} folder Path de la carpeta a observar
 */
var _syncAssets = function(folder){
  var src = _PATHS.DEV + folder,
      dest = _PATHS.PROD + folder;
  file_system.watch(src,{recursive:true}, function(eventType, path){
    //Sincronizar imágenes
    syncy([src + '**'], dest,{base: src})
    .then(() => {
      _handlerMessages('sync',_INFO_MESSAGE,folder);
    })
    .catch(console.error);
  });
};
/**
 * Se encarga de observar una carpeta y optimizar las imagenes cuando
 * ocurre un cambio y colocarla en la distribución de producción
 * @private
 * @param {[[Type]]} folder [[Description]]
 */
var _optimizeImages = function(folder){
  var src = _PATHS.DEV + folder,
      dest = _PATHS.PROD + folder;
  file_system.watch(src,{recursive:true}, function(eventType, path){
   gulp.src(src + '**')
      .pipe(imagemin())
      .pipe(gulp.dest(dest));
  });
};
//Tarea por default del builder task (No es opcional)
gulp.task('default');
