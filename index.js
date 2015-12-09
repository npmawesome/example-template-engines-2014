var express = require('express');
var fs = require('fs');
var todos = require('./todos.json');
var jade = require('jade');
var mustache = require('mustache');
var dust = require('dustjs-linkedin');
var ejs = require('ejs');
var nunjucks = require('nunjucks');
var dot  = require('dot');

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/jade', function(req, res) {
  var options = {todos: todos};
  res.send(jade.renderFile('./jade/index.jade', options));
})

app.get('/mustache', function(req, res) {
  var template = fs.readFileSync('./mustache/index.mustache', 'utf8');
  var partials = {
    item: fs.readFileSync('./mustache/item_partial.mustache', 'utf8')
  };
  var locals = {todos: todos};
  res.send(mustache.render(template, locals, partials));
});

app.get('/dust', function(req, res) {
  function register(name) {
    var template = dust.compile(fs.readFileSync('./dust/' + name + '.dust', 'utf8'), name);
    dust.loadSource(template);
  }

  register('index');
  register('layout');
  register('item_partial');

  var delay = 1;

  var locals = {
    todos: todos,
    stream: function(chunk, context, bodies) {
      return chunk.map(function(chunk) {
        setTimeout(function() {
          chunk
            .render(bodies.block, context)
            .end();
        }, delay++ * 1000);
      });
    }
  };

  dust
    .stream('index', locals)
    .on('error', function(err) {
      console.log(err.message);
      res.send(err.message);
    })
    .pipe(res)
    ;
});

app.get('/nunjucks', function(req, res) {
  var locals = {todos: todos};
  nunjucks.render('./nunjucks/index.html', locals, function(err, result) {
    if(err) {
      return res.send(err.message);
    }
    res.send(result);
  });
});

app.get('/ejs', function(req, res) {
  var template = fs.readFileSync('./ejs/index.ejs', 'utf8');
  var options = {
    filename: './ejs/index.ejs',
    todos: todos
  };
  res.send(ejs.render(template, options));
});



app.get('/dot', function(req, res) {
  var template = fs.readFileSync('./dot/index.html', 'utf8');

  var dot_render = dot.template(template,undefined,
       {
        loadFile : function(path) {
           return fs.readFileSync(__dirname +"/dot"+ path);
        }
  });

  var options = {
    filename: './dot/index.html',
    todos: todos
  };
  res.send(dot_render(options));
});

app.listen(3000);
console.log('Example is listening on http://127.0.0.1:3000');
