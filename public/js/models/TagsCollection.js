var TagsCollection = Backbone.Collection.extend({
    model: Tag,
    url: '/json/tag'
});