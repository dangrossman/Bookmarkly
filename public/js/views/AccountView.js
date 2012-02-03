var AccountView = Backbone.View.extend({
    
    events: {
        "submit #frm-account":      "account"
    },
    
    initialize: function() {
        _.bindAll(this, 'render', 'account', 'unrender');        
    },
    
    render: function() {
        var source = Templates.account;
        var template = Handlebars.compile(source);
        var html = template(App.user);
        $(this.el).html(html);
        
        $(this.el).css('margin', '100px auto 15px auto');
        $('#app').append(this.el);
        
        $(this.el).masonry({
            itemSelector: '.box',
            columnWidth: 460,
            isFitWidth: true
        });        
    },
    
    unrender: function() {
        $(this.el).masonry('destroy').detach();
    },
    
    account: function(e) {
        
        e.preventDefault();

        var username = this.$('input[name=username]').val();
        var email = this.$('input[name=email]').val();
        var password = this.$('input[name=password]').val();
        
        this.$('input[type=submit]').attr('disabled', 'disabled');
        
        var self = this;
        $.ajax({
            type: 'PUT',
            url: '/json/user',
            dataType: 'json',
            data: { username: username, password: password, email: email },
            success: function(data) {
                App.user = data;
                self.$('input[type=submit]').removeAttr('disabled');
                self.$('.account_info').html('Changes saved');
                setTimeout(function() {
                    self.$('.account_info').html('');
                }, 3000);
            },
            error: function() {
                window.location = '/';
            }
        });
        
    }

});