var TagsView = Backbone.View.extend({
    
    initialize: function() {
        _.bindAll(this, 'fetch', 'render', 'unrender');
                
        this.collection = new TagsCollection();
        this.collection.bind('reset', this.render, this);
        
        $(this.el).css('margin', '100px auto 15px auto');
        $(this.el).masonry();
    },
    
    fetch: function(options) {
        this.collection.fetch(options);
    },
    
    render: function() {
        if (this.collection.length == 0) {
            App.router.navigate("bookmarks", true);
            return;
        }
        
        $('#app').append(this.el);
        $(this.el).html('').masonry('destroy');

        var self = this;
        _(this.collection.models).each(function(tag) {
            var tv = new TagView({ model: tag });
            tv.render();
            $(self.el).append(tv.el);
        });
        
        $(this.el).masonry({
            itemSelector: '.taglist',
            columnWidth: 200,
            isFitWidth: true
        });
    },
    
    unrender: function() {
        $(this.el).masonry('destroy').detach();
    }

});
