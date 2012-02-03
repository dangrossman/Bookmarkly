var EditView = Backbone.View.extend({
    
    events: {
      "click .save":            "save",
      "click .cancel":          "cancel",
      "submit form":            "save"
    },
    
    initialize: function() {
        _.bindAll(this, 'render', 'unrender', 'save', 'cancel');
    },

    render: function() {
        var source = Templates.edit;
        var template = Handlebars.compile(source);
        var html = template(this.model.attributes);
        $(this.el).html(html);
        
        $('body').append(this.el);
        this.$('input[name=tags]').attr('id', 'tags' + this.model.id);
        this.$('input[name=tags]').tagsInput({
            autocomplete_url: '/json/autocomplete'                                  
        });
        
        $(this.el).modal({
            backdrop: true,
            keyboard: false,
            show: true
        });
    },
    
    unrender: function() {
        $(this.el).modal('hide');
        $(this.el).remove();
    },
    
    save: function(e) {
        e.preventDefault();
        
        var url = this.$('input[name=url]').val();
        var title = this.$('input[name=title]').val();
        var description = this.$('input[name=description]').val();
        var taglist = this.$('input[name=tags]').val();
        var tags = Array();
        
        if (taglist.indexOf(',') !== -1) {
            tags = taglist.split(',');
        } else if (taglist.length > 0) {
            tags.push(taglist);
        }
        
        this.model.set({ url: url, title: title, description: description, tags: tags, timestamp: Math.round(new Date().getTime() / 1000) });
        this.model.save();
        
        if (this.model.isNew()) {
            App.router.view.body.collection.add(this.model, { at: 0 });
            App.router.view.body.render();
        } else {
            $(App.router.view.body.el).masonry('reload');
        }
        
        this.unrender();
    },
    
    cancel: function(e) {
        e.preventDefault();
        this.unrender();
    }
    
});