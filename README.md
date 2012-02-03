![Bookmarkly.com](http://bookmarkly.com/images/homeshot.png)

This repository contains the code behind [Bookmarkly](http://bookmarkly.com), a bookmark organizer built with [Backbone.js](http://backbonejs.org/) in the browser and [Node.js](http://nodejs.org/) on the server with data persisted to MySQL.

Some features:

* Add bookmarks with a bookmarklet, Chrome extension or through the site
* Saves URL, title, description, tags with autosuggest and a screenshot
* Bookmark grid view resizes with the window and loads more bookmarks on scroll
* Can import bookmark files exported from IE, Chrome, Firefox and Delicious
* No page reloads at all, so moving between pages is near-instant and smooth
* Combines and minifies all the JS source and view templates automatically when the server starts

## Installation

1. Clone this repository

2. Install [Node.js](http://nodejs.org/) and [NPM](http://npmjs.org/)

3. Install dependencies: `npm install express`, `npm install formidable`, `npm install mysql`, `npm install uglify-js`

4. Create a MySQL database with the 3 tables in `schema.sql`

5. Edit the configuration section of `server.js` to point to your database

6. Run `node server.js` and browse to `http://localhost:3000`

If you get an error from express on launch, you may need to `npm install connect@0.5.10`

## License

Copyright (c) 2012 Dan Grossman. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of the author nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
