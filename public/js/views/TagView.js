var TagView = Backbone.View.extend({
    
    events: {
      "click a":      "go"
    },
    
    initialize: function() {
        _.bindAll(this, 'render', 'go');                
        $(this.el).addClass('taglist');
    },

    render: function() {
        var source = Templates.tag;
        var template = Handlebars.compile(source);
        var html = template(this.model.attributes);
        $(this.el).html(html);
    },
    
    go: function(e) {
        e.preventDefault();
        App.router.navigate('#tag/' + this.model.get('tag'), true);
    }
    
});