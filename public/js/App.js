var App = {

    initialize: function() {
        
        //If Backbone sync gets an unauthorized header, it means the user's
        //session has expired, so send them back to the homepage
        var sync = Backbone.sync;
        Backbone.sync = function(method, model, options) {
            options.error = function(xhr, ajaxOptions, thrownError) {
                if (xhr.status == 401) {
                    window.location = '/';
                }
            }
            sync(method, model, options);
        };        
        
        this.router = new BookmarklyRouter();
        Backbone.history.start({pushState: true});

        var self = this;
        $(window).resize(function() {
            self.resizeHeader();
        });
        this.resizeHeader();      
        
    },
    
    resizeHeader: function() {
        setTimeout(function() {
            var el = $('#app div:first');
            if (el && el.offset()) {
                var left = el.offset().left;
                if (left > 132) left = 132;
                if (left < 20) left = 20;
                $('#redbar .wrap').css('margin-left', left + 'px');
                $('#redbar .wrap').css('margin-right', (left + 20) + 'px');
            }
        }, 1000);
    }
    
};
