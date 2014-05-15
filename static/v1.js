;(function(w){
    "use strict";

    var globalFunc = 'twitprof',
    globalClass = 'twitprof',
    currentFile = 'twitprof/v1.js';
    
    if (w[globalFunc]) {
        return false;
    }

    w[globalFunc] = {};

    var init = function(){
        var css,

        getClassElements = (function(d){
            if ('function' === typeof d.querySelectorAll) {
                return function (className, callback) {
                    var className = '.'+className.replace(/^\./, ""),
                    callback = ('function' === typeof callback ? callback : false),
                    elements = d.querySelectorAll(className),
                    results = [],
                    i = 0, l = elements.length, c = 0,
                    current;
                    for (; i < l; i++) {
                        current = elements[i];
                        results.push(current);
                        if (callback) {
                            callback(c, current, (i+1 == l));
                        }
                        c++;
                    }
                    return results;
                }
            }

            else if ('function' === typeof d.getElementsByClassName) {
                return  function (className, callback) {
                    var className = className.replace(/^\./, ""),
                    callback = ('function' === typeof callback ? callback : false),
                    elements = d.getElementsByClassName(className),
                    results = new Array(),
                    i = 0, l = elements.length, c = 0,
                    current;
                    for (; i < l; i++) {
                        current = elements[i];
                        results.push(current);
                        if (callback) {
                            callback(c, current, (i+1 == l));
                        }
                        c++;
                    }
                    return results;
                }
            }

            else if ('function' === typeof d.evaluate) {
                return  function (className, callback) {
                    var className = className.replace(/^\./, ""),
                    callback = ('function' === typeof callback ? callback : false),
                    elements = d.evaluate('//*[contains(concat(" ",normalize-space(@class)," "),"'+className+'")]', d, null, 0, null),
                    results = new Array(),
                    i = 0, l = elements.length, c = 0,
                    current;
                    while (current = elements.iterateNext()) {
                        results.push(current);
                        if (callback) {
                            callback(c, current, (i+1 == l));
                        }
                        c++;
                    }
                    return results;
                }
            } else {
                return  function (className, callback) {
                    var className = className.replace(/^\./, ""),
                    callback = ('function' === typeof callback ? callback : false),
                    elements = d.all || d.getElementsByTagName('*'),
                    results = new Array(),
                    i = 0, l = elements.length, c = 0,
                    current;
                    for (; i < l; i++) {
                        current = elements[i];
                        if (current.className.indexOf(className) != -1) {
                            results.push(current);
                            if (callback) {
                                callback(c, current, (i+1 == l));
                            }
                            c++;
                        }
                    }
                    return results;
                }
            }
        })(document),

        trim = function(str){
            return str.replace(/(^[\t\n\r\s　]+)|([\t\n\r\s　]+$)/g, "");
        },

        getData = function(screenName, funcName){
            var url = 'https://query.yahooapis.com/v1/public/yql?q=SELECT%20html%20FROM%20json%20WHERE%20url%20%3D%20%22https%3A%2F%2Ftwitter.com%2Fi%2Fprofiles%2Fpopup%3Fscreen_name%3D'+screenName+'%22&format=json&_maxage=3600&callback='+globalFunc+'.'+funcName;
            var s = document.createElement('script');
            s.src = url;
            s.async = "async";
            s.defer = "defer";
            document.body.appendChild(s);
        },

        parseData = function(src) {
            if ('string' === typeof src) {
                var m,  data = {};
                if (m = src.match(/data-background-image=\"url\(\'([^\']*)\'/m)) {
                    data.bg = trim(m[1]);
                }
                if (m = src.match(/src=\"(https\:\/\/pbs\.twimg\.com\/profile_images[^\"]*)\".*?alt=\"([^\"]*)\"/m)) {
                    var path = trim(m[1]);
                    data.avatar = {
                        original: path.replace('_bigger.','.'),
                        bigger: path, //73x73
                        normal: path.replace('_bigger.','_normal.') //48x48
                    };
                    data.name = trim(m[2]);
                }
                if (m = src.match(/<p class=\"bio profile-field\">(.*?)?<\/p>/m)) {
                    data.comment = trim(m[1]);
                }
                if (m = src.match(/<span class=\"location profile-field\">([^<]*)?<\/span>/m)) {
                    data.location = trim(m[1]);
                }
                if (m = src.match(/<a target=\"_blank\" rel=\"me nofollow\" href=\"[^\"]*" class=\"js-tooltip\" title=\"([^\"]*?)\">([^<]*)/m)) {
                    data.url = trim(m[1]);
                    data.urlstr = trim(m[2]);
                }
                if (m = src.match(/<div [^>]*data-screen-name=\"([^\"]*)\"[^>]*data-user-id=\"([^\"]*)\">/m)) {
                    data.screen = trim(m[1]);
                    data.id = trim(m[2]);
                    data.link = 'https://twitter.com/'+data.screen;
                }
                if (m = src.match(/<a[^>]*href=\"([^\"]*)\"[^>]*data-element-term=\"tweet_stats\"[^>]*>[^<]*?<strong title=\"([^\"]*)\" class=\"js-mini-profile-stat\">([^<]*)<\/strong>/m)) {
                    var linkstr = trim(m[1]);
                    data.tweetslink = ('/' == linkstr[0] ? 'https://twitter.com' : '')+linkstr;
                    data._tweets = trim(m[2]);
                    data.tweets = trim(m[3]);
                }
                if (m = src.match(/<a[^>]*href=\"([^\"]*)\"[^>]*data-element-term=\"following_stats\"[^>]*>[^<]*?<strong title=\"([^\"]*)\"[^>]*>([^<]*)<\/strong>/m)) {
                    var linkstr = trim(m[1]);
                    data.followinglink = ('/' == linkstr[0] ? 'https://twitter.com' : '')+linkstr;
                    data._following = trim(m[2]);
                    data.following = trim(m[3]);
                }
                if (m = src.match(/<a[^>]*href=\"([^\"]*)\"[^>]*data-element-term=\"follower_stats\"[^>]*>[^<]*?<strong title=\"([^\"]*)\"[^>]*>([^<]*)<\/strong>/m)) {
                    var linkstr = trim(m[1]);
                    data.followerlink = ('/' == linkstr[0] ? 'https://twitter.com' : '')+linkstr;
                    data._follower = trim(m[2]);
                    data.follower = trim(m[3]);
                }

                return data;
            }
        },

        showProf = function(target, data){
            var html = '';
            html+='<div class="-'+globalClass+'"><div class="-wrap">';

            html+='<div class="-head">';
            html+='<div class="-avatar"><a href="'+data.link+'" target="_blank"><img src="'+data.avatar.normal+'" data-src-2x="'+data.avatar.bigger+'" alt="'+data.name+'"></a></div>';
            html+='<div class="-names">';
            html+='<div class="-name"><a href="'+data.link+'" target="_blank" title="'+data.name+'"><strong>'+data.name+'</strong><br><small>@'+data.screen+'</small></a></div>';
            html+='<a href="'+data.link+'" class="-button" target="_blank" title="Twitterで'+data.name+'さんをフォロー"><img src="https://abs.twimg.com/favicons/favicon.ico"><strong>&nbsp;フォローする</strong></a>';
            html+='</div>';
            html+='</div>';

            if (data.comment) {
                html+='<div class="-comment"><p>'+data.comment+'</p></div>';
            }

            if (data.url && location.href.indexOf(data.url) != 0) {
                html+='<div class="-url"><a href="'+data.url+'" target="_blank" rel="nofollow" title="'+data.url+'">'+data.urlstr+'</a></div>';
            }

            if (data.tweets || data.following || data.follower) {
                html+='<div class="-counts"><table><thead><tr>';
                if (data.tweets) {
                    html+='<th>ツイート</th>';
                }
                if (data.following) {
                    html+='<th>フォロー</th>';
                }
                if (data.follower) {
                    html+='<th>フォロワー</th>';
                }
                html+='</tr></thead><tbody><tr>';
                if (data.tweets) {
                    html+='<td><a href="'+data.tweetslink+'" title="'+data._tweets+'ツイート">'+data.tweets+'</a></td>';
                }
                if (data.following) {
                    html+='<td><a href="'+data.followinglink+'" title="'+data._following+'人をフォロー中">'+data.following+'</a></td>';
                }
                if (data.follower) {
                    html+='<td><a href="'+data.followerlink+'" title="'+data._follower+'人のフォロワー">'+data.follower+'</a></td>';
                }
                html+='</tr></tbody></table></div>';
            }
            
            html+='</div></div>';
            target.innerHTML = html;
        };

        var elements = getClassElements(globalClass, function(i, element, last){
            var screenName = element.getAttribute("data-screen"),
            funcName = 'func'+i;
            if (!screenName) {
                return false;
            }
            /*showProf(element, {"bg":"https://pbs.twimg.com/profile_banners/214937525/1358302805/web","avatar":{"original":"https://pbs.twimg.com/profile_images/3093943816/b3987e896b44348c61ffdd7a63fbe16f.jpeg","bigger":"https://pbs.twimg.com/profile_images/3093943816/b3987e896b44348c61ffdd7a63fbe16f_bigger.jpeg","normal":"https://pbs.twimg.com/profile_images/3093943816/b3987e896b44348c61ffdd7a63fbe16f_normal.jpeg"},"name":"きじとら","comment":"Webづくりなどしてます。","location":"undefined","url":"http://kijtra.com","urlstr":"kijtra.com","screen":"kijtra","id":"214937525","link":"https://twitter.com/kijtra","tweetslink":"/kijtra","_tweets":"2,259","tweets":"2,259","followinglink":"/kijtra/following","_following":"30","following":"30","followerlink":"/kijtra/followers","_follower":"25","follower":"25"});
            return false;*/
            getData(screenName, funcName);
            window[globalFunc][funcName] = function(res){
                if (res.query.results && res.query.results.json && res.query.results.json.html) {
                    var data = parseData(res.query.results.json.html);
                    showProf(element, data);
                } else {
                    element.style = 'display:none !important;';
                }
            };
        });

        if (elements.length) {
            css = (function(d){
                var elements = d.getElementsByTagName('script'),
                i = 0, l = elements.length, c = 0,
                current, path, css;
                for (; i < l; i++) {
                    current = elements[i];
                    path = current.src;
                    if (path.indexOf(currentFile) != -1) {
                        path = path.replace(/\.js$/, '.css');
                        css = d.createElement("link");
                        css.setAttribute("rel", "stylesheet");
                        css.setAttribute("href", path);
                        d.getElementsByTagName("head")[0].appendChild(css);
                        return css;
                        break;
                    }
                }
            })(document);
        }
    }

    if (w.addEventListener) {
        w.addEventListener('load', init, false);
    } else if (w.attachEvent) {
        w.attachEvent('onload', init);
    }
})(window);