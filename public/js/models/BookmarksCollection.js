var BookmarksCollection = Backbone.Collection.extend({
    model: Bookmark,
    url: '/json/bookmark'
});