var PublicView = Backbone.View.extend({
    
    events: {
        "submit #frm-signup":          "signup"
    },
    
    initialize: function() {
        _.bindAll(this, 'render', 'signup');
        $(this.el).css('width', '960px').css('margin', '0px auto');
    },
    
    render: function() {
        $(this.el).html(Templates.pub);
        $('#app').append(this.el);
    },
    
    unrender: function() {
        $(this.el).detach();  
    },
    
    signup: function(e) {
        e.preventDefault();
        
        var username = $('#frm-signup input[name=username]').val();
        var password = $('#frm-signup input[name=password]').val();
        var email = $('#frm-signup input[name=email]').val();

        username = $.trim(username);
        password = $.trim(password);
        email = $.trim(email);
        
        var error = '';
        
        var emailrx = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
        if (!emailrx.test(email)) {
            error = 'That e-mail address is invalid.';
        }
        
        if (username.length == 0 || password.length == 0 || email.length == 0) {
            error = 'Please fill out all the fields.';
        }
        
        if (error != '') {
            $('#signup-error').html(error).addClass('alert-message').addClass('error');
            return false;   
        }
        
        $.ajax({
            type: 'POST',
            url: '/json/register',
            dataType: 'json',
            data: { username: username, password: password, email: email },
            success: function(data) {
                if (typeof data.error != 'undefined') {
                    $('#signup-error').html(data.error).addClass('alert-message').addClass('error');
                } else {
                    $('#header .public').hide();
                    $('#header .logged-in').show();
                    App.user = data;
                    App.router.navigate("bookmarks", true);
                }
            },
            error: function() {
                $('#signup-error').html('An error occurred. Please try again.').addClass('alert-message').addClass('error');
            }
        });          
    }    

});
