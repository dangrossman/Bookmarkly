var BookmarkView = Backbone.View.extend({
    
    events: {
      "dblclick":               "edit",
      "click .edit":            "edit",
      "click .delete":          "del",
      "click .tag":             "filter"
    },
    
    initialize: function() {
        _.bindAll(this, 'render', 'edit', 'del');
        
        var d = new Date(this.model.get('timestamp') * 1000);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        
        this.model.set({date: d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()});
        this.model.set({thumburl: encodeURIComponent(this.model.get('url')) });
        this.model.bind('change', this.render);
                
        $(this.el).addClass('bookmark');
    },

    render: function() {
        var source = Templates.bookmark;
        var template = Handlebars.compile(source);
        var html = template(this.model.attributes);
        $(this.el).html(html);
    },
    
    edit: function(e) {
        e.preventDefault();
        new EditView({ model: this.model }).render();
    },
    
    del: function(e) {
        e.preventDefault();
        var del = confirm('Are you sure you want to delete this bookmark?');
        if (del) {
            App.router.view.body.collection.remove(this.model);
            this.model.destroy();
            $(this.el).remove();
            $(App.router.view.body.el).masonry('reload');
        }
    },
    
    filter: function(e) {
        e.preventDefault();
        var tag = $(e.target).html();
        App.router.navigate('tag/' + tag, true);
    }
    
});
