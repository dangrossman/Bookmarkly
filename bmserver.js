/*  ==============================================================
    Include required packages
=============================================================== */

var express = require('express'),
    formidable = require('formidable'),
    fs = require('fs'),
    crypto = require('crypto'),
    Client = require('mysql').Client,
    parser = require('uglify-js').parser,
    uglifyer = require('uglify-js').uglify;

/*  ==============================================================
    Configuration
=============================================================== */

//used for session and password hashes
var salt = '20sdkfjk23';

var client = new Client();
client.host = 'hostname';
client.user = 'username';
client.password = 'password';
client.database = 'bookmarks';

var app = express.createServer();

app.use(express.cookieParser());
app.use(express.session({ secret: salt, cookie: { maxAge: 3600000 * 24 * 30 } }));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.logger({ format: ':method :url' }));

delete express.bodyParser.parse['multipart/form-data'];

app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/images', express.static(__dirname + '/public/images'))
app.use(express.favicon(__dirname + '/public/favicon.ico'));

/*  ==============================================================
    Bundle + minify scripts & templates before starting server
=============================================================== */

function bundle() {

    var scripts = [
        'jquery.min',
        'json2',
        'underscore-min',
        'handlebars.min',
        'backbone-min',
        'jquery.masonry.min',
        'jquery.tagsinput.min',
        'bootstrap-modal',
        'jquery-ui.min',
        'models/Bookmark',
        'models/BookmarksCollection',
        'models/Tag',
        'models/TagsCollection',
        'views/PublicView',
        'views/AccountView',
        'views/EditView',
        'views/BookmarkView',
        'views/BookmarksView',
        'views/TagView',
        'views/TagsView',
        'views/AppView',
        'routers/BookmarklyRouter',
        'App'
    ];
    
    var templates = ['account', 'bookmark', 'edit', 'footer', 'header', 'index', 'pub', 'tag', 'bookmarks'];
    
    var bundle = '';
    scripts.forEach(function(file) {  
        bundle += "\n/**\n* " + file + ".js\n*/\n\n" + fs.readFileSync(__dirname + '/public/js/' + file + '.js') + "\n\n";
    });
    
    var ast = parser.parse(bundle);
    ast = uglifyer.ast_mangle(ast);
    ast = uglifyer.ast_squeeze(ast);
    bundle = uglifyer.gen_code(ast)
    
    fs.writeFileSync(__dirname + '/public/js/bundle.js', bundle, 'utf8');
    
    bundle = "Templates = {};\n";
    templates.forEach(function(file) {
        var html = fs.readFileSync(__dirname + '/public/templates/' + file + '.html', 'utf8');
        html = html.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/gm, ' ').replace(/'/gm, "\\'");
        bundle += "Templates." + file + " = '" + html + "';\n";
    });
    
    fs.writeFileSync(__dirname + '/public/js/templates.js', bundle, 'utf8');

}

/*  ==============================================================
    Launch the server
=============================================================== */

bundle();
app.listen(3000);

/*  ==============================================================
    Serve the site skeleton HTML to start the app
=============================================================== */

app.get('*', function(req, res, next) {

    //Regenerates the JS/template file
    if (req.url.indexOf('/bundle') == 0) bundle();

    //Don't process requests for API endpoints
    if (req.url.indexOf('/json') == 0 ) return next();
    
    var init = "$(document).ready(function() { App.initialize(); });";
    if (typeof req.session.user != 'undefined') {
        init = "$(document).ready(function() { App.user = " + JSON.stringify(req.session.user) + "; App.initialize(); });";
    }
    
    fs.readFile(__dirname + '/public/templates/index.html', 'utf8', function(error, content) {
        if (error) console.log(error);
        content = content.replace("{{init}}", init);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
    });
    
});

/*  ==============================================================
    API endpoints for the front-end AJAX requests
=============================================================== */

//Register a new user
app.post('/json/register', function(req, res) {
    
    var username = req.body.username;
    var password = md5(req.body.username + req.body.password + salt);
    var email = req.body.email;
    
    var query = "INSERT INTO users (username, email, password, created_at, last_login) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
    
    client.query(query, [username, email, password], function(err, info) {
        if (err) {
            console.log(err);
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.write(JSON.stringify({ error: 'There is already an account with that e-mail or username' }), 'utf8');
            res.end('\n');
        } else {
            user = { id: info.insertId, username: username, email: email };
          
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.write(JSON.stringify(user), 'utf8');
            res.end('\n');
            
            req.session.user_id = user.id;
            req.session.user = user;         
        }
    });
    
});

//Log in an existing user, starting a session
app.post('/json/login', function(req, res) {
    
    var username = req.body.username;
    var password = md5(req.body.username + req.body.password + salt);
    var query = "SELECT id, username, email FROM users WHERE username = ? AND password = ?";
    client.query(query, [username, password], function(err, results, fields) {
        if (err) console.log(err);
        if (results && results.length == 1) {

            res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.write(JSON.stringify(results[0]), 'utf8');
            res.end('\n');
            
            req.session.user_id = results[0].id;
            req.session.user = results[0];
            
            client.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [req.session.user_id]);
        } else {
            res.writeHead(401, { 'Content-Type': 'text/html' });
            res.end();
            req.session.destroy();
        }
    });
    
});

//Log out the current user
app.post('/json/logout', function(req, res) {
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end();
    req.session.destroy();
    
});

//Update a user's profile
app.put('/json/user', function(req, res) {
  
    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }    
  
    var query = "UPDATE users SET username = ?, password = md5(concat(?, ?, ?)), email = ? WHERE id = ?";
    client.query(query, [req.body.username, req.body.username, req.body.password, salt, req.body.email, req.session.user_id], function(err) {
        if (err) console.log(err);
        
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify({ id: req.session.user_id, username: req.body.username, email: req.body.email }), 'utf-8');
        res.end('\n');                           
    });
  
});

//Retrieve a user's tags
app.get('/json/tag', function(req, res) {
  
    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }  
  
    var tags = Array();
    var query = "SELECT tag, COUNT(*) AS `count` FROM tags INNER JOIN bookmarks ON bookmarks.id = tags.bookmark_id WHERE user_id = ? GROUP BY tag ORDER BY COUNT(*) DESC";
  
    client.query(query, [req.session.user_id], function(err, results, fields) {
        if (err) console.log(err);
        
        for (var i = 0; i < results.length; i++) {
            tags.push(results[i]);
        }

        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(tags), 'utf-8');
        res.end('\n');                   
    });  
    
});

//Autocomplete for tagging, returns tags matching input
app.get('/json/autocomplete', function(req, res) {
  
    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }
  
    var tags = Array();
    client.query("SELECT DISTINCT tag FROM tags INNER JOIN bookmarks ON bookmarks.id = tags.bookmark_id WHERE user_id = ? AND tag LIKE ?", [req.session.user_id, req.query['term'] + '%'], function(err, results, fields) {
        if (err) console.log(err);
        
        for (var i = 0; i < results.length; i++) {
            tags.push(results[i].tag);
        }
        
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(tags), 'utf-8');
        res.end('\n');  
        
    });
  
    console.log('autocomplete # ' + req.url + ' # ' + req.query['term']);
});

//Return a user's bookmarks
app.get('/json/bookmark', function(req, res) {

    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }

    var bookmarks = Array();
    var params = [];
    var query = '';
    
    if (req.query['tag']) {
        params = [req.session.user_id, req.query['tag']];
        query = "SELECT id, url, title, description, UNIX_TIMESTAMP(created_at) AS `timestamp`, GROUP_CONCAT(DISTINCT tag ORDER BY tag ASC SEPARATOR ',') AS tags FROM bookmarks LEFT OUTER JOIN tags ON bookmarks.id = tags.bookmark_id WHERE user_id = ? AND id IN (SELECT bookmark_id FROM tags WHERE tag = ?) GROUP BY id ORDER BY created_at DESC";
    } else if (req.query['search']) {
        params = [req.session.user_id, '%' + req.query['search'] + '%', '%' + req.query['search'] + '%', '%' + req.query['search'] + '%'];
        query = "SELECT id, url, title, description, UNIX_TIMESTAMP(created_at) AS `timestamp`, GROUP_CONCAT(DISTINCT tag ORDER BY tag ASC SEPARATOR ',') AS tags FROM bookmarks LEFT OUTER JOIN tags ON bookmarks.id = tags.bookmark_id WHERE user_id = ? AND ((title LIKE ? OR description LIKE ?) OR id IN (SELECT bookmark_id FROM tags WHERE tag LIKE ?))GROUP BY id ORDER BY created_at DESC";
    } else {
        params = [req.session.user_id];
        var offset = 0;
        if (typeof req.query['offset'] != 'undefined')
            offset = req.query['offset'];
        query = "SELECT id, url, title, description, UNIX_TIMESTAMP(created_at) AS `timestamp`, GROUP_CONCAT(DISTINCT tag ORDER BY tag ASC SEPARATOR ',') AS tags FROM bookmarks LEFT OUTER JOIN tags ON bookmarks.id = tags.bookmark_id WHERE user_id = ? GROUP BY id ORDER BY created_at DESC LIMIT " + offset + ",50";
    }

    client.query(query, params, function(err, results, fields) {
            if (err) console.log(err);
            
            for (var i = 0; i < results.length; i++) {
                if (results[i].tags && results[i].tags.indexOf(',') !== -1) {
                    results[i].tags = results[i].tags.split(',');
                } else if (results[i].tags && results[i].tags != '') {
                    var tags = Array();
                    tags.push(results[i].tags);
                    results[i].tags = tags;
                } else {
                    results[i].tags = Array();
                }
                bookmarks.push(results[i]);
            }
            
            res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.write(JSON.stringify(bookmarks), 'utf-8');
            res.end('\n');            
            
        }
    );
   
});

//Update a bookmark
app.put('/json/bookmark/:id', function(req, res) {

    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }
    
    var bookmark = req.body;
    
    var params = [bookmark.url, bookmark.title, bookmark.description, bookmark.id];
    client.query('UPDATE bookmarks SET url = ?, title = ?, description = ? WHERE id = ?', params, function(err) {
        if (err) console.log(err);
    });
    
    client.query('DELETE FROM tags WHERE bookmark_id = ?', [bookmark.id], function(err) {
        if (err) console.log(err);
    });
    
    for (var i = 0; i < bookmark.tags.length; i++) {
        client.query('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)', [bookmark.id, bookmark.tags[i]], function(err) {
            if (err) console.log(err);
        });
    }
    
    res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
    res.writeHead(200, { 'Content-type': 'application/json' });
    res.write(JSON.stringify(bookmark), 'utf-8');
    res.end('\n');            
});

//Create a new bookmark
app.post('/json/bookmark/:id?', function(req, res) {
    
    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }    
    
    var bookmark = req.body;
    
    var params = [req.session.user_id, bookmark.url, bookmark.title, bookmark.description];
    client.query('INSERT INTO bookmarks (user_id, url, title, description, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', params, function(err, info) {
        if (err) console.log(err);
        
        bookmark.id = info.insertId;
        
        for (var i = 0; i < bookmark.tags.length; i++) {
            client.query('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)', [info.insertId, bookmark.tags[i]], function(err) {
                if (err) console.log(err);
            });
        }
        
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store');
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.write(JSON.stringify(bookmark), 'utf-8');
        res.end('\n');        
        
    });
    
});

//Delete a bookmark
app.del('/json/bookmark/:id', function(req, res) {
  
    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }  
  
    var params = [req.params.id, req.session.user_id];
    client.query('DELETE FROM bookmarks WHERE id = ? AND user_id = ?', params, function(err) {
        if (err) {
            console.log(err);
        } else {
            params = [req.params.id];
            client.query('DELETE FROM tags WHERE bookmark_id = ?', params, function(err) {
                  if (err) console.log(err);
            });
        }
    });
  
    res.writeHead(200, { 'Content-type': 'application/json' });
    res.end('\n');
});

//Import bookmarks from an HTML file
app.post('/json/import', function(req, res) {
  
    if (typeof req.session.user_id == 'undefined') {
        res.writeHead(401, { 'Content-type': 'text/html' });
        res.end();
        return;
    }  
      
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname;
    
    form.addListener('file', function(name, file) {
        fs.readFile(file.path, 'utf8', function(error, content) {
            importFrom(content, req, res);
            fs.unlink(file.path);
        });
    });
    
    form.parse(req, function(err, fields, files) {
      if (err) {
          console.log(err);
          res.end();
      }
    });
 
});

/*  ==============================================================
    Convenience functions
=============================================================== */

function md5(str) {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
};

function importFrom(html, req, res) {

    var regex = /<a([^>]*)>([^<]*)<\/a>/gmi;

    //Extract anchor tags from the import file
    var list = [];
    while (true) {
        matches = regex.exec(html);
            
        if (matches !== null) {
            list.push([matches[1], matches[2]]);
        } else {
            break;
        }
    }
    
    //Stick the attributes from the anchor tag onto an object
    var links = [];
    list.forEach(function(link) {
              
        regex = /(\w+?)=["']{0,1}(.*?)["']{0,1}\s+/g
        var obj = { title: link[1] };
        while (true) {
            matches = regex.exec(' ' + link[0] + ' ');
            if (matches !== null) {
                obj[matches[1].toLowerCase()] = matches[2];
            } else {
                break;
            }
        }
                
        var old = obj.tags;
        if (typeof obj.tags == 'undefined' || obj.tags == '') {
            obj.tags = [];
        } else if (obj.tags.indexOf(',') === -1) {
            obj.tags = [obj.tags];
        } else {
            obj.tags = obj.tags.replace(/"([^,]*),([^"]*)"/gi,"$1 $2").split(',');
        }
      
        if ((obj.href.indexOf('http://') === 0 || obj.href.indexOf('https://') === 0) && obj.title.length > 0) {
            links.push(obj);
        }
    });
    
    console.log("Importing " + links.length + "links");
  
    importQueue = 0;
    links.forEach(function(link) {
        importQueue++;
        link.tags.forEach(function(tag) {
            importQueue++;
        });
    });
    
    //Insert the bookmarks and their tags into the database
    links.forEach(function(link) {
      
        if (typeof link['add_date'] == 'undefined' || parseInt(link['add_date']) == 0) {
            link['add_date'] = 'CURRENT_TIMESTAMP';
        } else {
            link['add_date'] = "FROM_UNIXTIME('" + link['add_date'] + "')";
        }
        console.log(link['add_date']);
        
        if (typeof link['private'] == 'undefined') {
            link['private'] = 0;
        }
              
        var params = [req.session.user_id, link['href'], link['title'], link['private']];
        client.query('INSERT INTO bookmarks (user_id, url, title, private, created_at) VALUES (?, ?, ?, ?, ' + link['add_date'] + ')', params, function(err, info) {
            if (err) console.log(err);
            importQueue--;            
            
            link.tags.forEach(function(tag) {
                tag = tag.replace('.', ' ').replace('-', ' ');
                client.query('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)', [info.insertId, tag], function(err) {
                    if (err) console.log(err);
                    importQueue--;
                    
                    if (importQueue == 0) {
                        res.writeHead(302, { 'Location': '/bookmarks' });
                        res.end();                      
                    }
                    
                });
            });
            
            if (importQueue == 0) {
                res.writeHead(302, { 'Location': '/bookmarks' });
                res.end();                      
            }            
        
        });
    
    });
};
